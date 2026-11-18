import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fixture } from './helpers/learning-fixture.mjs';
test('level rewards stay pending until claimed and cannot be received twice',()=>{
 const f=fixture();
 try{
  const letters=f.load('app/learning/catalog.ts').learningLetters;
  for(const letter of letters) for(const word of letter.words) f.call('markWord',{wordId:word.id,state:'learned'});
  let snapshot=f.service.getSnapshot(f.bee);
  assert.equal(snapshot.profile.totalXp,260); assert.equal(snapshot.profile.level,2);
  const reward=snapshot.rewards.find(r=>r.kind==='level_up');
  assert.equal(reward.status,'pending'); assert.equal(snapshot.profile.stars,0);
  f.call('acknowledgeCelebration',{rewardId:reward.id});
  assert.equal(f.service.getSnapshot(f.bee).profile.stars,0);
  snapshot=f.call('claimReward',{rewardId:reward.id}).snapshot;
  assert.equal(snapshot.profile.stars,50); assert.equal(snapshot.profile.totalXp,260);
  assert.equal(f.call('claimReward',{rewardId:reward.id}).snapshot.profile.stars,50);
  assert.throws(()=>f.service.claimReward(f.other,f.command({rewardId:reward.id})),{code:'FORBIDDEN'});
  const sum=f.db.prepare("SELECT sum(xp_delta) AS xp,sum(stars_delta) AS stars FROM reward_ledger WHERE user_id=? AND status='claimed'").get(f.bee.id);
  assert.equal(sum.xp,snapshot.profile.totalXp); assert.equal(sum.stars,snapshot.profile.stars);
 }finally{f.db.close();}
});
test('an award crossing several levels creates each pending level exactly once',()=>{
 const f=fixture();try{
  const attempt=f.call('startAttempt',{activityId:'opw.l1.quiz.a'}).attempt;
  // A high historical snapshot exercises the general multi-level rule without changing public reward rates.
  f.db.prepare('UPDATE attempts SET bonus_bps_snapshot=990000 WHERE id=?').run(attempt.id);
  const result=f.call('answerQuestion',{attemptId:attempt.id,questionId:'opw.l1.quiz.question.a',selectedId:'Apple'});
  assert.equal(result.snapshot.profile.totalXp,1000);assert.equal(result.snapshot.profile.level,5);
  assert.deepEqual(result.snapshot.rewards.filter(r=>r.kind==='level_up').map(r=>r.level).sort(),[2,3,4,5]);
  f.call('answerQuestion',{attemptId:attempt.id,questionId:'opw.l1.quiz.question.a',selectedId:'Apple'});
  assert.equal(f.service.getSnapshot(f.bee).rewards.filter(r=>r.kind==='level_up').length,4);
 }finally{f.db.close();}
});
test('failures after ledger writes roll back answer, claim, profile and receipt atomically',()=>{
 const f=fixture();try{
  const attempt=f.call('startAttempt',{activityId:'opw.l1.quiz.a'}).attempt;
  const command=f.command({attemptId:attempt.id,questionId:'opw.l1.quiz.question.a',selectedId:'Apple'});
  f.db.exec("CREATE TEMP TRIGGER reject_profile BEFORE UPDATE ON learner_profiles BEGIN SELECT RAISE(ABORT,'fault injection'); END;");
  assert.throws(()=>f.service.answerQuestion(f.bee,command),/fault injection/);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM answer_events').get().n,0);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM reward_ledger').get().n,0);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM mutation_receipts WHERE request_id=?').get(command.requestId).n,0);
  assert.equal(f.service.getAttempt(f.bee,attempt.id).questions[0].answered,false);
  f.db.exec('DROP TRIGGER reject_profile');
  f.service.answerQuestion(f.bee,command);
  for(const letter of f.load('app/learning/catalog.ts').learningLetters.slice(0,10))for(const word of letter.words)f.call('markWord',{wordId:word.id,state:'learned'});
  const reward=f.service.getSnapshot(f.bee).rewards.find(r=>r.kind==='level_up');
  const claim=f.command({rewardId:reward.id});
  f.db.exec("CREATE TEMP TRIGGER reject_profile BEFORE UPDATE ON learner_profiles BEGIN SELECT RAISE(ABORT,'fault injection'); END;");
  assert.throws(()=>f.service.claimReward(f.bee,claim),/fault injection/);
  assert.equal(f.db.prepare('SELECT status FROM reward_ledger WHERE id=?').get(reward.id).status,'pending');
  assert.equal(f.service.getSnapshot(f.bee).profile.stars,10);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM mutation_receipts WHERE request_id=?').get(claim.requestId).n,0);
  f.db.exec('DROP TRIGGER reject_profile');
  assert.equal(f.service.claimReward(f.bee,claim).snapshot.profile.stars,60);
 }finally{f.db.close();}
});
