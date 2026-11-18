import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { test } from 'node:test';
import { fixture } from './helpers/learning-fixture.mjs';
test('HTTP validates session, actor, origin, payload and ownership before mutation',async()=>{
 const f=fixture();
 try{
  const http=existsSync('app/learning/http.ts')?f.load('app/learning/http.ts'):{};
  assert.equal(typeof http.handleLearningRequest,'function');
  const context=async()=>({learner:f.bee,service:f.service,db:f.db});
  const request=(body,headers={})=>new Request('https://bee.test/api/learning',{method:'POST',headers:{origin:'https://bee.test','content-type':'application/json','x-bee-learner':f.bee.id,...headers},body:JSON.stringify(body)});
  const body={operation:'markWord',requestId:'request-123',input:{wordId:'opw.l1.word.a.apple',state:'learned'}};
  const ok=await http.handleLearningRequest(request(body),context);
  assert.equal(ok.status,200); assert.match(ok.headers.get('cache-control'),/no-store/);
  assert.equal((await ok.json()).snapshot.learnedWordIds.length,1);
  assert.equal((await http.handleLearningRequest(request(body),async()=>({...await context(),learner:null}))).status,401);
  assert.equal((await http.handleLearningRequest(request(body,{origin:'https://evil.test'}),context)).status,403);
  const proxied=new Request('http://localhost/api/learning',{method:'POST',headers:{host:'bee.test',origin:'https://bee.test','content-type':'application/json','x-bee-learner':f.bee.id},body:JSON.stringify(body)});
  assert.equal((await http.handleLearningRequest(proxied,context)).status,200);
  assert.equal((await http.handleLearningRequest(request(body,{'x-bee-learner':'other'}),context)).status,409);
  assert.equal((await http.handleLearningRequest(new Request('https://bee.test/api/learning?view=snapshot',{headers:{'x-bee-learner':'other'}}),context)).status,409);
  assert.equal((await http.handleLearningRequest(request({...body,input:{...body.input,userId:'other'}}),context)).status,400);
  assert.equal((await http.handleLearningRequest(request({...body,input:{...body.input,state:'seen'}}),context)).status,409);
  assert.equal((await http.handleLearningRequest(request({...body,operation:'grantStars'}),context)).status,400);
  assert.equal((await http.handleLearningRequest(request({...body,padding:'a'.repeat(17000)}),context)).status,413);
  const get=await http.handleLearningRequest(new Request('https://bee.test/api/learning?view=snapshot'),context);
  assert.equal((await get.json()).learnedWordIds.length,1);
 }finally{f.db.close();}
});
