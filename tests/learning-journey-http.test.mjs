import assert from 'node:assert/strict';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { startProductionServer } from './helpers/production-server.mjs';
import { createLoader } from './helpers/load-learning.mjs';

test('production journey saves Bee, resumes after restart, claims concurrently and publishes real assessment',async()=>{
 const directory=mkdtempSync(path.join(os.tmpdir(),'bee-journey-'));
 const databasePath=path.join(directory,'progress.sqlite'),secret=randomBytes(32).toString('hex');
 const env={BEE_DATABASE_PATH:databasePath,BEE_SESSION_SECRET:secret};
 let server;
 const load=createLoader(),catalog=load('app/learning/catalog.ts');
 const payload=`${Buffer.from('bee').toString('base64url')}.${Date.now()+3600000}`;
 const cookie=`bee_session=${payload}.${createHmac('sha256',secret).update(payload).digest('base64url')}`;
 const headers={cookie,'x-bee-learner':'usr_bee'};
 try{
  server=await startProductionServer(env);
  const get=async query=>{const response=await fetch(`${server.origin}/api/learning?${query}`,{headers});const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));return body;};
  const post=async(operation,input,requestId=randomUUID())=>{
   const response=await fetch(`${server.origin}/api/learning`,{method:'POST',headers:{...headers,origin:server.origin,'content-type':'application/json'},body:JSON.stringify({operation,input,requestId})});
   const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));return body;
  };
  assert.equal((await fetch(`${server.origin}/api/learning?view=snapshot`)).status,401);
  const initial=await get('view=snapshot');assert.equal(initial.profile.totalXp,0);assert.equal(initial.profile.stars,0);
  await post('markWord',{wordId:catalog.learningLetters[0].words[0].id,state:'learned'});
  let game=(await post('startAttempt',{activityId:'opw.l1.quiz.a'})).attempt;
  const q=catalog.getActivity(game.activityId).questions[0];
  await Promise.all([post('answerQuestion',{attemptId:game.id,questionId:q.id,selectedId:q.targetId}),post('answerQuestion',{attemptId:game.id,questionId:q.id,selectedId:q.targetId})]);
  assert.equal((await get('view=snapshot')).profile.stars,10);
  await server.stop();server=await startProductionServer(env);
  const resumed=await get('view=snapshot');assert.equal(resumed.learnedWordIds.length,1);assert.equal(resumed.profile.stars,10);
  const restored=await get(`view=attempt&activityId=${game.activityId}`);assert.equal(restored.id,game.id);assert.equal(restored.questions[0].solved,true);
  for(const letter of catalog.learningLetters.slice(0,10))for(const word of letter.words)await post('markWord',{wordId:word.id,state:'learned'});
  const reward=(await get('view=snapshot')).rewards.find(r=>r.kind==='level_up');assert(reward);
  const before=(await get('view=snapshot')).profile.stars;
  await Promise.all([post('claimReward',{rewardId:reward.id}),post('claimReward',{rewardId:reward.id})]);
  assert.equal((await get('view=snapshot')).profile.stars,before+50);
  game=(await post('startAttempt',{activityId:'opw.l1.assessment'})).attempt;
  for(const question of catalog.getActivity(game.activityId).questions) await post('answerQuestion',{attemptId:game.id,questionId:question.id,selectedId:question.targetId});
  const ranking=await get('view=leaderboard&period=today&level=1');assert.equal(ranking.rows.length,1);assert.equal(ranking.own.score,26);assert.equal(ranking.own.rank,1);
  for(const page of ['/oxford-phonics-world/level-1','/minigame?letter=Z','/gheptu','/mohop','/achivement','/bangxephang','/oxford-phonics-world/level-1/assessment']) {
   const response=await fetch(`${server.origin}${page}`,{headers});const html=await response.text();
   assert.equal(response.status,200,page);assert(!html.includes('NEXT_HTTP_ERROR_FALLBACK'),page);
   assert(!html.includes('data-next-error-message'),`${page}: ${server.output()}`);
   assert(!html.includes('A server error occurred')&&!/\"digest\":\"\d+\"/.test(html),`${page}: ${server.output()}`);
  }
  await server.stop();server=null;
  const report=(await import('../scripts/learning-db.mjs')).reconcileDatabase(databasePath);assert.equal(report.ok,true);
 }finally{await server?.stop();rmSync(directory,{recursive:true,force:true});}
});
