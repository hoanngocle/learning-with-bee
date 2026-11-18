import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import { withTransaction } from './db';
import { row, rows } from './repository';
import { getActivity, gradeAnswer, learningLetters } from './catalog';
import { badgeDefinitions, evaluateAchievements } from './achievements';
import { calculateXp, levelForXp, scoreAttempt } from './scoring';
import { summarizeStudyDays, toStudyDate } from './study-calendar';
import { LearningError, type AttemptDto, type Learner, type LearnerSnapshot, type LearningCommands, type LearningOperation, type Mutation, type MutationResult, type RewardDto } from './types';

type AttemptRow = { id:string; user_id:string; activity_id:string; status:AttemptDto['status']; started_at:string; completed_at:string|null; bonus_bps_snapshot:number };
type QuestionRow = { question_id:string; answered:number; first_answer_correct:number|null; solved_at:string|null; hint_count:number; revealed:number };
type ProfileRow = { total_xp:number; stars:number; revision:number };
function canonical(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))));
  return JSON.stringify(value);
}

export function createLearningService(db:DatabaseSync,clock:()=>Date=()=>new Date()) {
  function counts(userId:string,now:Date) {
    const totals=row<{sessions:number;perfect:number}>(db,'SELECT count(*) AS sessions,coalesce(sum(perfect),0) AS perfect FROM daily_completions WHERE user_id=?',userId)!;
    const days=rows<{local_date:string}>(db,'SELECT local_date FROM study_days WHERE user_id=?',userId).map(d=>d.local_date);
    const summary=summarizeStudyDays(days,now);
    return {...totals,studyDays:summary.total,currentStreak:summary.currentStreak,longestStreak:summary.longestStreak};
  }
  function getSnapshot(learner:Learner,now=clock()):LearnerSnapshot {
    const profile=row<ProfileRow>(db,'SELECT * FROM learner_profiles WHERE user_id=?',learner.id);
    if(!profile) throw new LearningError('NOT_FOUND');
    const progress=rows<{word_id:string;learned_at:string|null}>(db,'SELECT word_id,learned_at FROM word_progress WHERE user_id=?',learner.id);
    const learned=new Set(progress.filter(p=>p.learned_at).map(p=>p.word_id));
    const seen=new Set(progress.map(p=>p.word_id));
    const unlocked=rows<{badge_id:string;unlocked_at:string}>(db,'SELECT badge_id,unlocked_at FROM user_achievements WHERE user_id=?',learner.id);
    const unlockedMap=new Map(unlocked.map(b=>[b.badge_id,b.unlocked_at]));
    const bonusBps=badgeDefinitions.reduce((sum,b)=>sum+(unlockedMap.has(b.id)?b.bonusBps:0),0);
    const rewardRows=rows<{id:string;kind:RewardDto['kind'];status:RewardDto['status'];xp_delta:number;stars_delta:number;level:number|null;celebration_seen:number}>(db,'SELECT * FROM reward_ledger WHERE user_id=? ORDER BY created_at,id',learner.id);
    return { revision:profile.revision,studyDate:toStudyDate(now),learner,
      profile:{totalXp:profile.total_xp,stars:profile.stars,...levelForXp(profile.total_xp),bonusBps},
      learnedWordIds:[...learned],reviewedTodayWordIds:rows<{word_id:string}>(db,'SELECT word_id FROM word_reviews WHERE user_id=? AND local_date=?',learner.id,toStudyDate(now)).map(r=>r.word_id),
      seenLetterIds:learningLetters.filter(l=>l.words.some(w=>seen.has(w.id))).map(l=>l.id),
      completedLetterIds:learningLetters.filter(l=>l.words.every(w=>learned.has(w.id))).map(l=>l.id),
      resume:row<{letterId:string;wordId:string}>(db,'SELECT letter_id AS letterId,word_id AS wordId FROM resume_positions WHERE user_id=? AND course_id=?',learner.id,'opw')??null,
      counts:counts(learner.id,now),badges:badgeDefinitions.map(b=>({id:b.id,unlockedAt:unlockedMap.get(b.id)??null})),
      rewards:rewardRows.map(r=>({id:r.id,kind:r.kind,status:r.status,xp:r.xp_delta,stars:r.stars_delta,level:r.level,celebrationSeen:!!r.celebration_seen})),
    };
  }
  function ownedAttempt(learner:Learner,id:string) {
    const attempt=row<AttemptRow>(db,'SELECT * FROM attempts WHERE id=?',id);
    if(!attempt) throw new LearningError('NOT_FOUND');
    if(attempt.user_id!==learner.id) throw new LearningError('FORBIDDEN');
    return attempt;
  }
  function getAttempt(learner:Learner,id:string):AttemptDto {
    const attempt=ownedAttempt(learner,id),activity=getActivity(attempt.activity_id);
    const questions=rows<QuestionRow>(db,'SELECT * FROM attempt_questions WHERE attempt_id=? ORDER BY ordinal',id).map(q=>({
      id:q.question_id,solved:!!q.solved_at,answered:!!q.answered,firstAnswerCorrect:q.first_answer_correct===null?null:!!q.first_answer_correct,
      hintCount:q.hint_count,revealed:!!q.revealed,
    }));
    const score=scoreAttempt({kind:activity.kind,questions:questions.map(q=>({...q,points:activity.questions.find(x=>x.id===q.id)!.points}))});
    return {id,activityId:activity.id,kind:activity.kind,status:attempt.status,startedAt:attempt.started_at,completedAt:attempt.completed_at,
      questions,gameScore:score.gameScore,correctFirst:score.correctFirst,questionCount:questions.length};
  }
  function getActiveAttempt(learner:Learner,activityId:string) {
    getActivity(activityId);
    const attempt=row<{id:string}>(db,"SELECT id FROM attempts WHERE user_id=? AND activity_id=? AND status='in_progress'",learner.id,activityId);
    return attempt?getAttempt(learner,attempt.id):null;
  }
  function grantMastery(learner:Learner,source:string,baseXp:number,stars:number,bonus:number,now:Date) {
    const changes=db.prepare("INSERT OR IGNORE INTO reward_ledger(id,user_id,source_key,kind,base_xp,bonus_bps,xp_delta,stars_delta,status,created_at,claimed_at) VALUES (?,?,?,'mastery',?,?,?,?,'claimed',?,?)")
      .run(randomUUID(),learner.id,`mastery:${source}`,baseXp,bonus,calculateXp(baseXp,bonus),stars,now.toISOString(),now.toISOString()).changes;
    if(changes) db.prepare('UPDATE learner_profiles SET total_xp=total_xp+?,stars=stars+? WHERE user_id=?').run(calculateXp(baseXp,bonus),stars,learner.id);
    return !!changes;
  }
  function dailyComplete(learner:Learner,activityId:string,perfect:boolean,now:Date) {
    const day=toStudyDate(now);
    db.prepare('INSERT INTO daily_completions(user_id,activity_id,local_date,perfect) VALUES (?,?,?,?) ON CONFLICT(user_id,activity_id,local_date) DO UPDATE SET perfect=max(perfect,excluded.perfect)').run(learner.id,activityId,day,Number(perfect));
    db.prepare('INSERT OR IGNORE INTO study_days VALUES (?,?)').run(learner.id,day);
  }
  function updateAwards(learner:Learner,previousXp:number,now:Date) {
    const unlocked=rows<{badge_id:string}>(db,'SELECT badge_id FROM user_achievements WHERE user_id=?',learner.id).map(b=>b.badge_id);
    for(const badge of evaluateAchievements(counts(learner.id,now),unlocked).newBadgeIds) {
      db.prepare('INSERT OR IGNORE INTO user_achievements VALUES (?,?,?,?)').run(learner.id,badge,now.toISOString(),toStudyDate(now));
    }
    const xp=row<ProfileRow>(db,'SELECT * FROM learner_profiles WHERE user_id=?',learner.id)!.total_xp;
    for(let level=levelForXp(previousXp).level+1;level<=levelForXp(xp).level;level++) {
      db.prepare("INSERT OR IGNORE INTO reward_ledger(id,user_id,source_key,kind,base_xp,bonus_bps,xp_delta,stars_delta,level,status,created_at) VALUES (?,?,?,'level_up',0,0,0,50,?,'pending',?)")
        .run(randomUUID(),learner.id,`level:${level}`,level,now.toISOString());
    }
  }
  function execute<K extends LearningOperation>(learner:Learner,operation:K,command:Mutation<LearningCommands[K]>,work:(now:Date)=>Partial<MutationResult>):MutationResult {
    if(!/^[a-zA-Z0-9_-]{8,100}$/.test(command.requestId)) throw new LearningError('INVALID_INPUT');
    const hash=createHash('sha256').update(`${operation}:${canonical(command.input)}`).digest('hex');
    return withTransaction(db,()=>{
      const previous=row<{payload_hash:string;response_json:string}>(db,'SELECT * FROM mutation_receipts WHERE user_id=? AND request_id=?',learner.id,command.requestId);
      if(previous) { if(previous.payload_hash!==hash) throw new LearningError('CONFLICT'); return JSON.parse(previous.response_json) as MutationResult; }
      const now=clock(),xp=row<ProfileRow>(db,'SELECT * FROM learner_profiles WHERE user_id=?',learner.id)?.total_xp;
      if(xp===undefined) throw new LearningError('NOT_FOUND');
      const partial=work(now);
      updateAwards(learner,xp,now);
      db.prepare('UPDATE learner_profiles SET revision=revision+1 WHERE user_id=?').run(learner.id);
      const result:MutationResult={snapshot:getSnapshot(learner,now),attempt:null,feedback:'recorded',assistance:null,...partial};
      db.prepare('INSERT INTO mutation_receipts VALUES (?,?,?,?,?)').run(learner.id,command.requestId,operation,hash,JSON.stringify(result));
      return result;
    });
  }
  function markWord(learner:Learner,command:Mutation<LearningCommands['markWord']>) {
    return execute(learner,'markWord',command,now=>{
      const {wordId,state}=command.input;
      const letter=learningLetters.find(l=>l.words.some(w=>w.id===wordId));
      if(!letter || !['seen','learned'].includes(state)) throw new LearningError('INVALID_INPUT');
      const bonus=getSnapshot(learner,now).profile.bonusBps;
      db.prepare('INSERT INTO resume_positions VALUES (?,?,?,?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET letter_id=excluded.letter_id,word_id=excluded.word_id,updated_at=excluded.updated_at').run(learner.id,'opw',letter.id,wordId,now.toISOString());
      db.prepare('INSERT INTO word_progress VALUES (?,?,?,?) ON CONFLICT(user_id,word_id) DO UPDATE SET learned_at=coalesce(word_progress.learned_at,excluded.learned_at)')
        .run(learner.id,wordId,now.toISOString(),state==='learned'?now.toISOString():null);
      if(state==='learned') {
        db.prepare('INSERT OR IGNORE INTO word_reviews VALUES (?,?,?,?)').run(learner.id,wordId,toStudyDate(now),now.toISOString());
        const snapshot=getSnapshot(learner,now);
        if(letter.words.every(w=>snapshot.learnedWordIds.includes(w.id))) {
          const first=grantMastery(learner,`opw.l1.flashcard.${letter.letter.toLowerCase()}`,10,0,bonus,now);
          if(first || letter.words.every(w=>snapshot.reviewedTodayWordIds.includes(w.id))) dailyComplete(learner,`opw.l1.flashcard.${letter.letter.toLowerCase()}`,false,now);
        }
      }
      return {};
    });
  }
  function saveResume(learner:Learner,command:Mutation<LearningCommands['saveResume']>) {
    return execute(learner,'saveResume',command,now=>{
      const {letterId,wordId}=command.input;
      if(!learningLetters.some(l=>l.id===letterId && l.words.some(w=>w.id===wordId))) throw new LearningError('INVALID_INPUT');
      db.prepare('INSERT INTO resume_positions VALUES (?,?,?,?,?) ON CONFLICT(user_id,course_id) DO UPDATE SET letter_id=excluded.letter_id,word_id=excluded.word_id,updated_at=excluded.updated_at').run(learner.id,'opw',letterId,wordId,now.toISOString());
      return {};
    });
  }
  function startAttempt(learner:Learner,command:Mutation<LearningCommands['startAttempt']>) {
    return execute(learner,'startAttempt',command,now=>{
      const activity=getActivity(command.input.activityId),existing=getActiveAttempt(learner,activity.id);
      if(existing) return {attempt:existing};
      const id=randomUUID();
      db.prepare("INSERT INTO attempts(id,user_id,activity_id,status,started_at,bonus_bps_snapshot) VALUES (?,?,?,'in_progress',?,?)").run(id,learner.id,activity.id,now.toISOString(),getSnapshot(learner,now).profile.bonusBps);
      activity.questions.forEach((q,index)=>db.prepare('INSERT INTO attempt_questions(attempt_id,question_id,ordinal,target_id) VALUES (?,?,?,?)').run(id,q.id,index,q.targetId));
      return {attempt:getAttempt(learner,id)};
    });
  }
  function answerQuestion(learner:Learner,command:Mutation<LearningCommands['answerQuestion']>) {
    return execute(learner,'answerQuestion',command,now=>{
      const {attemptId,questionId,selectedId}=command.input;
      const attempt=ownedAttempt(learner,attemptId),activity=getActivity(attempt.activity_id);
      if(attempt.status!=='in_progress') throw new LearningError('CONFLICT');
      const question=row<QuestionRow>(db,'SELECT * FROM attempt_questions WHERE attempt_id=? AND question_id=?',attemptId,questionId);
      if(!question) throw new LearningError('INVALID_INPUT');
      if(question.solved_at || (activity.kind==='assessment' && question.answered)) return {attempt:getAttempt(learner,attemptId)};
      const correct=gradeAnswer(activity.id,questionId,selectedId);
      db.prepare('INSERT INTO answer_events VALUES (?,?,?,?,?,?,?)').run(randomUUID(),attemptId,questionId,command.requestId,selectedId,Number(correct),now.toISOString());
      db.prepare('UPDATE attempt_questions SET first_answer_correct=coalesce(first_answer_correct,?),answered=1,solved_at=? WHERE attempt_id=? AND question_id=?').run(Number(correct),correct?now.toISOString():null,attemptId,questionId);
      const definition=activity.questions.find(q=>q.id===questionId)!;
      if(correct && !question.revealed && activity.kind!=='assessment') grantMastery(learner,definition.id,definition.points,definition.points,attempt.bonus_bps_snapshot,now);
      const dto=getAttempt(learner,attemptId);
      if(dto.questions.every(q=>activity.kind==='assessment'?q.answered:q.solved)) {
        const scoring=scoreAttempt({kind:activity.kind,questions:dto.questions.map(q=>({...q,points:activity.questions.find(x=>x.id===q.id)!.points}))});
        db.prepare("UPDATE attempts SET status='completed',completed_at=?,duration_ms=?,score=?,perfect=? WHERE id=?").run(now.toISOString(),Math.max(0,now.getTime()-Date.parse(attempt.started_at)),scoring.gameScore,Number(scoring.perfect),attemptId);
        if(dto.questions.every(q=>!q.revealed)) dailyComplete(learner,activity.id,scoring.perfect,now);
      }
      return {attempt:getAttempt(learner,attemptId),feedback:correct?'correct':'retry'};
    });
  }
  function useAssistance(learner:Learner,command:Mutation<LearningCommands['useAssistance']>) {
    return execute(learner,'useAssistance',command,()=>{
      const {attemptId,questionId,kind}=command.input,attempt=ownedAttempt(learner,attemptId),activity=getActivity(attempt.activity_id);
      const question=row<QuestionRow>(db,'SELECT * FROM attempt_questions WHERE attempt_id=? AND question_id=?',attemptId,questionId);
      if(!question || !['hint','reveal'].includes(kind) || activity.kind==='assessment') throw new LearningError('INVALID_INPUT');
      if(attempt.status!=='in_progress' || question.solved_at) throw new LearningError('CONFLICT');
      if(kind==='hint' && activity.kind==='scramble' && question.hint_count>=2) throw new LearningError('CONFLICT');
      db.prepare('UPDATE attempt_questions SET hint_count=hint_count+?,revealed=max(revealed,?) WHERE attempt_id=? AND question_id=?').run(Number(kind==='hint'),Number(kind==='reveal'),attemptId,questionId);
      const definition=activity.questions.find(q=>q.id===questionId)!;
      return {attempt:getAttempt(learner,attemptId),assistance:{kind,text:kind==='reveal'?definition.targetId:definition.hint}};
    });
  }
  function abandonAttempt(learner:Learner,command:Mutation<LearningCommands['abandonAttempt']>) {
    return execute(learner,'abandonAttempt',command,()=>{
      const attempt=ownedAttempt(learner,command.input.attemptId);
      if(attempt.status==='in_progress') db.prepare("UPDATE attempts SET status='abandoned' WHERE id=?").run(attempt.id);
      return {attempt:getAttempt(learner,attempt.id)};
    });
  }
  function rewardCommand<K extends 'claimReward'|'acknowledgeCelebration'>(learner:Learner,operation:K,command:Mutation<LearningCommands[K]>) {
    return execute(learner,operation,command,now=>{
      const reward=row<{user_id:string;status:string;stars_delta:number;xp_delta:number}>(db,'SELECT * FROM reward_ledger WHERE id=?',command.input.rewardId);
      if(!reward) throw new LearningError('NOT_FOUND');
      if(reward.user_id!==learner.id) throw new LearningError('FORBIDDEN');
      if(operation==='acknowledgeCelebration') db.prepare('UPDATE reward_ledger SET celebration_seen=1 WHERE id=?').run(command.input.rewardId);
      else if(reward.status==='pending') {
        db.prepare("UPDATE reward_ledger SET status='claimed',claimed_at=? WHERE id=?").run(now.toISOString(),command.input.rewardId);
        db.prepare('UPDATE learner_profiles SET stars=stars+?,total_xp=total_xp+? WHERE user_id=?').run(reward.stars_delta,reward.xp_delta,learner.id);
      }
      return {};
    });
  }
  function getCalendar(learner:Learner,year:number,month:number) {
    if(!Number.isInteger(year)||year<2000||year>2200||!Number.isInteger(month)||month<1||month>12) throw new LearningError('INVALID_INPUT');
    const prefix=`${year}-${String(month).padStart(2,'0')}`;
    return {year,month,studyDates:rows<{local_date:string}>(db,'SELECT local_date FROM study_days WHERE user_id=? AND local_date LIKE ? ORDER BY local_date',learner.id,`${prefix}-%`).map(d=>d.local_date)};
  }
  return {getSnapshot,getAttempt,getActiveAttempt,getCalendar,markWord,saveResume,startAttempt,answerQuestion,useAssistance,abandonAttempt,
    claimReward:(learner:Learner,command:Mutation<LearningCommands['claimReward']>)=>rewardCommand(learner,'claimReward',command),
    acknowledgeCelebration:(learner:Learner,command:Mutation<LearningCommands['acknowledgeCelebration']>)=>rewardCommand(learner,'acknowledgeCelebration',command)};
}
