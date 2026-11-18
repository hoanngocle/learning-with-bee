import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { createLoader } from './helpers/load-learning.mjs';
test('achievements unlock once, stack basis points and respect thresholds',()=>{
 const a=existsSync('app/learning/achievements.ts')?createLoader()('app/learning/achievements.ts'):{};
 assert.equal(typeof a.evaluateAchievements,'function');
 const counts={sessions:128,perfect:8,studyDays:45};
 const result=a.evaluateAchievements(counts,[]);
 assert.equal(result.newBadgeIds.length,9); assert.equal(result.totalBonusBps,950);
 assert.equal(a.evaluateAchievements(counts,result.newBadgeIds).newBadgeIds.length,0);
 const all=a.evaluateAchievements({sessions:500,perfect:50,studyDays:365},[]);
 assert.equal(all.newBadgeIds.length,18); assert.equal(all.totalBonusBps,3150);
 assert.equal(a.evaluateAchievements({sessions:0,perfect:0,studyDays:6},[]).newBadgeIds.length,0);
});
