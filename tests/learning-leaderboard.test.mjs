import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { fixture } from './helpers/learning-fixture.mjs';
test('assessment completes on answered questions and ranks best result inside the period',()=>{
 const f=fixture();
 try{
  const ranking=existsSync('app/learning/leaderboard.ts')?f.load('app/learning/leaderboard.ts'):{};
  assert.equal(typeof ranking.getLeaderboard,'function');
  const query=period=>ranking.getLeaderboard(f.db,{period,level:1,now:new Date('2026-11-18T12:00:00Z'),viewerId:f.bee.id});
  assert.deepEqual(query('today'),{rows:[],own:null});
  const run=(start,end,correct)=>{
   f.setNow(start); const attempt=f.call('startAttempt',{activityId:'opw.l1.assessment'}).attempt;
   const activity=f.load('app/learning/catalog.ts').getActivity(attempt.activityId);
   assert.throws(()=>f.call('useAssistance',{attemptId:attempt.id,questionId:activity.questions[0].id,kind:'hint'}),{code:'INVALID_INPUT'});
   f.setNow(end);
   for(const [index,q] of activity.questions.entries()) f.call('answerQuestion',{attemptId:attempt.id,questionId:q.id,selectedId:index<correct?q.targetId:q.options.find(v=>v!==q.targetId)});
   assert.equal(f.service.getAttempt(f.bee,attempt.id).status,'completed');
  };
  run('2026-11-17T10:00:00Z','2026-11-17T10:01:00Z',26);
  run('2026-11-18T10:00:00Z','2026-11-18T10:02:00Z',25);
  assert.equal(query('today').rows[0].score,25); assert.equal(query('week').rows[0].score,26);
  assert.equal(query('today').own.rank,1); assert.equal(query('today').rows[0].durationMs,120000);
  assert.equal(f.service.getSnapshot(f.bee).profile.totalXp,0);
  assert.equal(f.service.getSnapshot(f.bee).counts.perfect,1);
  assert.deepEqual(ranking.getLeaderboard(f.db,{period:'all',level:2,now:new Date(),viewerId:f.bee.id}),{rows:[],own:null});
 }finally{f.db.close();}
});
test('ranking query handles ties and the exact Monday midnight boundary in Vietnam',()=>{
 const f=fixture();try{
  const ranking=f.load('app/learning/leaderboard.ts');
  for(const id of ['rank_c','rank_d'])f.db.prepare('INSERT INTO users VALUES (?,?,?,?)').run(id,id,id,'2026-11-01T00:00:00Z');
  const insert=(id,user,score,duration,completed)=>f.db.prepare("INSERT INTO attempts(id,user_id,activity_id,status,started_at,completed_at,bonus_bps_snapshot,score,duration_ms) VALUES (?,?,'opw.l1.assessment','completed',?,?,0,?,?)").run(id,user,'2026-11-15T16:00:00.000Z',completed,score,duration);
  insert('old',f.bee.id,26,100,'2026-11-15T16:59:59.999Z');
  insert('new',f.bee.id,25,1000,'2026-11-15T17:00:00.000Z');
  insert('other',f.other.id,25,500,'2026-11-15T17:01:00.000Z');
  insert('third','rank_c',25,500,'2026-11-15T17:02:00.000Z');
  insert('fourth','rank_d',25,500,'2026-11-15T17:02:00.000Z');
  const input={period:'week',level:1,now:new Date('2026-11-16T00:00:00Z'),viewerId:f.bee.id};
  const result=ranking.getLeaderboard(f.db,input);
  assert.deepEqual(result.rows.map(r=>r.userId),[f.other.id,'rank_c','rank_d',f.bee.id]);
  assert.equal(result.own.rank,4);assert.equal(result.own.score,25);
  assert.equal(ranking.getLeaderboard(f.db,{...input,period:'all'}).own.rank,1);
 }finally{f.db.close();}
});
