import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { createLoader } from './helpers/load-learning.mjs';
test('operations back up active WAL data and reconcile balances without changing them',async()=>{
 assert(existsSync('scripts/learning-db.mjs'),'database operations CLI is missing');
 const operations=await import('../scripts/learning-db.mjs');
 const dir=mkdtempSync(path.join(os.tmpdir(),'bee-ops-'));
 const file=path.join(dir,'source.sqlite'),output=path.join(dir,'backup.sqlite');
 const load=createLoader();let db;
 try{
  db=load('app/learning/db.ts').openLearningDb(file);
  const bee=load('app/learning/repository.ts').ensureLearner(db,{username:'bee',displayName:'Bee'});
  assert.equal(operations.reconcileDatabase(file).ok,true);
  db.prepare('UPDATE learner_profiles SET stars=42 WHERE user_id=?').run(bee.id);
  assert.equal(operations.reconcileDatabase(file).ok,false);
  await operations.backupDatabase(file,output);
  const restored=load('app/learning/db.ts').openLearningDb(output);
  assert.equal(restored.prepare('SELECT stars FROM learner_profiles').get().stars,42);restored.close();
  await assert.rejects(operations.backupDatabase(file,output),/exists/);
  assert.equal(db.prepare('SELECT stars FROM learner_profiles').get().stars,42);
 }finally{db?.close();rmSync(dir,{recursive:true,force:true});}
});
