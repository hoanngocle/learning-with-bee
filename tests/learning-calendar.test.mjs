import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { createLoader } from './helpers/load-learning.mjs';
test('study dates use Vietnam midnight, deduplicate and keep yesterday streak',()=>{
 const c=existsSync('app/learning/study-calendar.ts')?createLoader()('app/learning/study-calendar.ts'):{};
 assert.equal(typeof c.toStudyDate,'function');
 assert.equal(c.toStudyDate(new Date('2026-11-18T16:59:59Z')),'2026-11-18');
 assert.equal(c.toStudyDate(new Date('2026-11-18T17:00:00Z')),'2026-11-19');
 assert.deepEqual(c.summarizeStudyDays(['2026-11-16','2026-11-17','2026-11-17'],new Date('2026-11-18T12:00:00Z')),{total:2,currentStreak:2,longestStreak:2});
 assert.deepEqual(c.summarizeStudyDays(['2026-11-16','2026-11-17'],new Date('2026-11-19T12:00:00Z')),{total:2,currentStreak:0,longestStreak:2});
 assert.equal(c.summarizeStudyDays(['2024-02-28','2024-02-29','2024-03-01'],new Date('2024-03-01T00:00:00Z')).currentStreak,3);
 assert.equal(c.periodStart('week',new Date('2026-11-15T17:00:00Z')),'2026-11-15T17:00:00.000Z');
});
