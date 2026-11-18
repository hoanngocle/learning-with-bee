import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers/learning-fixture.mjs';
test('flashcards preserve learned words and require a complete daily review',()=>{
 const f=fixture();
 try{
  assert.equal(f.service.getSnapshot(f.bee).profile.totalXp,0);
  const words=f.load('app/learning/catalog.ts').learningLetters[0].words;
  for(const w of words.slice(0,3)) f.call('markWord',{wordId:w.id,state:'learned'});
  assert.equal(f.service.getSnapshot(f.bee).counts.sessions,0);
  f.setNow('2026-11-19T10:00:00Z');
  const result=f.call('markWord',{wordId:words[3].id,state:'learned'});
  assert.equal(result.snapshot.profile.totalXp,10); assert.equal(result.snapshot.counts.sessions,1);
  assert.equal(result.snapshot.resume.wordId,words[3].id);
  assert.equal(Object.getPrototypeOf(result.snapshot.resume),Object.prototype,'server component DTO must be a plain object');
  f.call('markWord',{wordId:words[0].id,state:'seen'});
  assert.equal(f.service.getSnapshot(f.bee).learnedWordIds.length,4);
  f.setNow('2026-11-20T10:00:00Z');
  for(const w of words.slice(0,3)) f.call('markWord',{wordId:w.id,state:'learned'});
  assert.equal(f.service.getSnapshot(f.bee).counts.sessions,1);
  const reviewed=f.call('markWord',{wordId:words[3].id,state:'learned'}).snapshot;
  assert.equal(reviewed.counts.sessions,2); assert.equal(reviewed.profile.totalXp,10); assert.equal(reviewed.counts.perfect,0);
  assert.throws(()=>f.call('saveResume',{letterId:'opw.l1.letter.b',wordId:words[0].id}),{code:'INVALID_INPUT'});
 }finally{f.db.close();}
});
test('attempts keep wrong first answers, shared mastery and idempotent receipts',()=>{
 const f=fixture();
 try{
  const start=f.call('startAttempt',{activityId:'opw.l1.quiz.a'});
  const id=start.attempt.id;
  assert.equal(f.call('startAttempt',{activityId:'opw.l1.quiz.a'}).attempt.id,id);
  const cmd=f.command({attemptId:id,questionId:'opw.l1.quiz.question.a',selectedId:'Banana'});
  assert.equal(f.service.answerQuestion(f.bee,cmd).feedback,'retry');
  const right=f.command({...cmd.input,selectedId:'Apple'});
  const result=f.service.answerQuestion(f.bee,right);
  assert.equal(result.snapshot.profile.stars,10); assert.equal(result.attempt.correctFirst,0);
  assert.deepEqual(f.service.answerQuestion(f.bee,right),result);
  assert.throws(()=>f.service.answerQuestion(f.bee,{...right,input:{...right.input,selectedId:'Banana'}}),{code:'CONFLICT'});
  f.call('answerQuestion',{attemptId:id,questionId:'opw.l1.quiz.question.a',selectedId:'Apple'});
  f.call('answerQuestion',{attemptId:id,questionId:'opw.l1.quiz.question.b',selectedId:'Banana'});
  const done=f.call('answerQuestion',{attemptId:id,questionId:'opw.l1.quiz.question.c',selectedId:f.load('app/learning/catalog.ts').getActivity('opw.l1.quiz.a').questions[2].targetId});
  assert.equal(done.attempt.status,'completed'); assert.equal(done.snapshot.counts.perfect,0); assert.equal(done.snapshot.profile.stars,30);
  const next=f.call('startAttempt',{activityId:'opw.l1.quiz.b'}).attempt;
  const shared=f.call('answerQuestion',{attemptId:next.id,questionId:'opw.l1.quiz.question.b',selectedId:'Banana'});
  assert.equal(shared.snapshot.profile.stars,30);
  assert.throws(()=>f.service.answerQuestion(f.other,f.command({attemptId:next.id,questionId:'opw.l1.quiz.question.b',selectedId:'Banana'})),{code:'FORBIDDEN'});
  assert.throws(()=>f.call('answerQuestion',{attemptId:id,questionId:'opw.l1.quiz.question.c',selectedId:'Cat'}),{code:'CONFLICT'});
 }finally{f.db.close();}
});
test('reveals prevent rewards and completions while hints prevent perfect',()=>{
 const f=fixture();
 try{
  const activity=f.load('app/learning/catalog.ts').getActivity('opw.l1.scramble.breakfast');
  const attempt=f.call('startAttempt',{activityId:activity.id}).attempt;
  const first=activity.questions[0];
  assert.equal(f.call('useAssistance',{attemptId:attempt.id,questionId:first.id,kind:'reveal'}).assistance.text,'BREAKFAST');
  for(const q of activity.questions) f.call('answerQuestion',{attemptId:attempt.id,questionId:q.id,selectedId:q.targetId});
  const result=f.service.getSnapshot(f.bee);
  assert.equal(result.counts.sessions,0); assert.equal(result.profile.stars,140);
  const quiz=f.call('startAttempt',{activityId:'opw.l1.quiz.a'}).attempt;
  f.call('useAssistance',{attemptId:quiz.id,questionId:quiz.questions[0].id,kind:'hint'});
  for(const q of f.load('app/learning/catalog.ts').getActivity(quiz.activityId).questions) f.call('answerQuestion',{attemptId:quiz.id,questionId:q.id,selectedId:q.targetId});
  assert.equal(f.service.getSnapshot(f.bee).counts.perfect,0);
  assert.equal(f.service.getSnapshot(f.bee).counts.sessions,1);
 }finally{f.db.close();}
});
