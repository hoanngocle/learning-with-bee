import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { createLoader } from './load-learning.mjs';
export function fixture() {
 const load=createLoader();
 const serviceModule=existsSync('app/learning/service.ts')?load('app/learning/service.ts'):{};
 assert.equal(typeof serviceModule.createLearningService,'function');
 const db=load('app/learning/db.ts').openLearningDb(':memory:');
 const repo=load('app/learning/repository.ts');
 const bee=repo.ensureLearner(db,{username:'bee',displayName:'Bee'});
 const other=repo.ensureLearner(db,{username:'other',displayName:'Other'});
 let now=new Date('2026-11-18T10:00:00Z');
 const service=serviceModule.createLearningService(db,()=>now);
 const command=input=>({requestId:randomUUID(),input});
 const call=(op,input)=>service[op](bee,command(input));
 return {load,db,bee,other,service,command,call,setNow:value=>now=new Date(value)};
}
