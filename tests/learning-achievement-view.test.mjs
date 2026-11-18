import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { fixture } from './helpers/learning-fixture.mjs';
test('achievement view shows new learners at zero and only unseen pending celebrations',()=>{
 const f=fixture();try{
  const moduleView=existsSync('app/learning/achievement-view.ts')?f.load('app/learning/achievement-view.ts'):{};
  assert.equal(typeof moduleView.achievementView,'function');
  const snapshot=f.service.getSnapshot(f.bee);
  const view=moduleView.achievementView(snapshot);
  assert.equal(view.unlockedCount,0);assert.equal(view.expPercent,0);assert.equal(view.nextPerfectTarget,1);assert.equal(view.pendingRewards.length,0);
  const withRewards={...snapshot,rewards:[{id:'a',kind:'level_up',status:'pending',celebrationSeen:false},{id:'b',kind:'level_up',status:'claimed',celebrationSeen:false},{id:'c',kind:'level_up',status:'pending',celebrationSeen:true}]};
  const rewards=moduleView.achievementView(withRewards);
  assert.deepEqual(rewards.pendingRewards.map(r=>r.id),['a','c']);assert.equal(rewards.nextCelebration.id,'a');
 }finally{f.db.close();}
});
