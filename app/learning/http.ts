import 'server-only';
import type { DatabaseSync } from 'node:sqlite';
import { getLeaderboard } from './leaderboard';
import { LearningError, type Learner, type LearningCommands, type LearningOperation } from './types';
import type { createLearningService } from './service';

type Context={learner:Learner|null;db:DatabaseSync;service:ReturnType<typeof createLearningService>};
const fields:Record<LearningOperation,string[]>={
  markWord:['wordId','state'],saveResume:['letterId','wordId'],startAttempt:['activityId'],
  answerQuestion:['attemptId','questionId','selectedId'],useAssistance:['attemptId','questionId','kind'],
  abandonAttempt:['attemptId'],claimReward:['rewardId'],acknowledgeCelebration:['rewardId'],
};
function json(value:unknown,status=200) { return Response.json(value,{status,headers:{'Cache-Control':'private, no-store',...(status===503?{'Retry-After':'2'}:{})}}); }
function sameOrigin(request:Request,url:URL) {
  try{
    const value=request.headers.get('origin');if(!value)return false;
    const origin=new URL(value);
    return ['http:','https:'].includes(origin.protocol)&&value===origin.origin&&origin.host===(request.headers.get('host')??url.host);
  }catch{return false;}
}
async function readBody(request:Request) {
  if(Number(request.headers.get('content-length'))>16384) return null;
  const reader=request.body?.getReader(); if(!reader) throw new LearningError('INVALID_INPUT');
  let size=0; const chunks:Uint8Array[]=[];
  while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.byteLength; if(size>16384){await reader.cancel();return null;} chunks.push(value); }
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  try{return JSON.parse(new TextDecoder().decode(bytes)) as unknown;}catch{throw new LearningError('INVALID_INPUT');}
}
export async function handleLearningRequest(request:Request,resolve:()=>Promise<Context>) {
  try{
    const url=new URL(request.url);
    if(request.method==='POST') {
      if(!sameOrigin(request,url)) return json({error:'FORBIDDEN'},403);
      if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) return json({error:'INVALID_INPUT'},400);
    }
    const context=await resolve(),{learner,service,db}=context;
    const expectedActor=request.headers.get('x-bee-learner');
    if(expectedActor&&!learner)return json({error:'UNAUTHENTICATED'},401);
    if(expectedActor&&expectedActor!==learner?.id)return json({error:'ACCOUNT_CHANGED'},409);
    if(request.method==='GET' && url.searchParams.get('view')==='leaderboard') {
      const period=url.searchParams.get('period')??'week';
      if(!['today','week','all'].includes(period)) throw new LearningError('INVALID_INPUT');
      return json(getLeaderboard(db,{period:period as 'today'|'week'|'all',level:Number(url.searchParams.get('level')??1),now:new Date(),viewerId:learner?.id??null}));
    }
    if(!learner) return json({error:'UNAUTHENTICATED'},401);
    if(request.method==='GET') {
      const view=url.searchParams.get('view')??'snapshot';
      if(view==='snapshot')return json(service.getSnapshot(learner));
      if(view==='attempt') {
        const id=url.searchParams.get('attemptId'),activityId=url.searchParams.get('activityId');
        if(id)return json(service.getAttempt(learner,id));
        if(activityId)return json(service.getActiveAttempt(learner,activityId));
      }
      if(view==='calendar')return json(service.getCalendar(learner,Number(url.searchParams.get('year')),Number(url.searchParams.get('month'))));
      throw new LearningError('INVALID_INPUT');
    }
    if(request.method!=='POST')return json({error:'INVALID_INPUT'},405);
    if(request.headers.get('x-bee-learner')!==learner.id) return json({error:'ACCOUNT_CHANGED'},409);
    const body=await readBody(request);
    if(body===null)return json({error:'INVALID_INPUT'},413);
    if(!body || typeof body!=='object' || Array.isArray(body))throw new LearningError('INVALID_INPUT');
    const envelope=body as Record<string,unknown>;
    if(Object.keys(envelope).some(k=>!['operation','requestId','input'].includes(k)))throw new LearningError('INVALID_INPUT');
    const operation=envelope.operation as LearningOperation;
    if(!Object.hasOwn(fields,operation)||typeof envelope.requestId!=='string'||!envelope.input||typeof envelope.input!=='object'||Array.isArray(envelope.input))throw new LearningError('INVALID_INPUT');
    const input=envelope.input as Record<string,unknown>,expected=fields[operation];
    if(Object.keys(input).length!==expected.length||!expected.every(k=>typeof input[k]==='string'&&(input[k] as string).length>0&&(input[k] as string).length<=200))throw new LearningError('INVALID_INPUT');
    // Narrow after exact field validation; every command additionally validates domain membership/ownership.
    const command={requestId:envelope.requestId,input} as {requestId:string;input:LearningCommands[LearningOperation]};
    const invoke=service[operation] as (user:Learner,c:typeof command)=>unknown;
    return json(invoke(learner,command));
  }catch(error){
    if(error instanceof LearningError) {
      const status={UNAUTHENTICATED:401,FORBIDDEN:403,NOT_FOUND:404,INVALID_INPUT:400,CONFLICT:409,BUSY:503,UNAVAILABLE:503}[error.code];
      return json({error:error.code},status);
    }
    return json({error:'UNAVAILABLE'},503);
  }
}
