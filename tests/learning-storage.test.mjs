import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createLoader } from './helpers/load-learning.mjs';

test('storage survives reopen, isolates learners, rejects duplicates and rolls back writes', () => {
  const load = createLoader();
  const storage = existsSync('app/learning/db.ts') ? load('app/learning/db.ts') : {};
  assert.equal(typeof storage.openLearningDb, 'function');
  const directory = mkdtempSync(path.join(os.tmpdir(), 'bee-storage-'));
  const file = path.join(directory, 'progress.sqlite');
  let db;
  try {
    db = storage.openLearningDb(file);
    storage.migrateLearningDb(db);
    const repo = load('app/learning/repository.ts');
    const bee = repo.ensureLearner(db, {username:'bee',displayName:'Bee'});
    const other = repo.ensureLearner(db, {username:'other',displayName:'Other'});
    assert.equal(bee.id, 'usr_bee'); assert.notEqual(bee.id,other.id);
    assert.throws(()=>storage.withTransaction(db,()=>{
      db.prepare('UPDATE learner_profiles SET stars=10 WHERE user_id=?').run(bee.id);
      throw new Error('simulated interruption');
    }), /simulated/);
    assert.equal(db.prepare('SELECT stars FROM learner_profiles WHERE user_id=?').get(bee.id).stars,0);
    db.prepare('INSERT INTO study_days VALUES (?,?)').run(bee.id,'2026-11-18');
    assert.throws(()=>db.prepare('INSERT INTO study_days VALUES (?,?)').run(bee.id,'2026-11-18'));
    assert.throws(()=>db.prepare('INSERT INTO study_days VALUES (?,?)').run('missing','2026-11-18'));
    db.close(); db=storage.openLearningDb(file);
    assert.equal(db.prepare('SELECT count(*) AS n FROM study_days').get().n,1);
    assert.equal(db.prepare('SELECT count(*) AS n FROM study_days WHERE user_id=?').get(other.id).n,0);
  } finally { db?.close(); rmSync(directory,{recursive:true,force:true}); }
});
