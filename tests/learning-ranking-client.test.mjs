import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { createLoader } from './helpers/load-learning.mjs';
test('ranking clears own results on session loss and ignores late responses',async()=>{
 const code=existsSync('app/learning/ranking-client.ts')?createLoader()('app/learning/ranking-client.ts'):{};
 assert.equal(typeof code.createRankingClient,'function');
 const responses=[],initial={rows:[],own:{rank:12,score:12,durationMs:10000}};
 const client=code.createRankingClient(initial,'usr_bee',()=>new Promise(resolve=>responses.push(resolve)));
 const earlier=client.refresh('week'),later=client.refresh('week');
 responses[1](Response.json({error:'ACCOUNT_CHANGED'},{status:409}));await later;
 responses[0](Response.json(initial));await earlier;
 assert.equal(client.getState().accountChanged,true);
 assert.deepEqual(client.getState().results,{});
});
