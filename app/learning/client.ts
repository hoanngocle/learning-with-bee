import type { LearnerSnapshot, LearningCommands, LearningOperation, MutationResult } from './types';

export function createLearnerClient(initial:LearnerSnapshot|null,fetcher:typeof fetch=fetch) {
  let state:{snapshot:LearnerSnapshot|null;status:'idle'|'saving'|'error';lastResult:MutationResult|null;message:string}={snapshot:initial,status:'idle',lastResult:null,message:''};
  let pending:{operation:LearningOperation;requestId:string;input:LearningCommands[LearningOperation];onSuccess?:(result:MutationResult)=>void}|null=null;
  let generation=0,active=true;
  let suspended=state;
  const listeners=new Set<()=>void>();
  const publish=(patch:Partial<typeof state>)=>{state={...state,...patch};listeners.forEach(listener=>listener());};
  const invalidate=()=>{generation++;pending=null;publish({snapshot:null,lastResult:null,status:'error',message:'Phiên đã thay đổi. Hãy tải lại trang và đăng nhập để tiếp tục.'});};
  async function run():Promise<MutationResult|null> {
    if(!pending||!state.snapshot||state.status==='saving'||!active)return null;
    const current=pending,actor=state.snapshot.learner.id,epoch=generation;
    publish({status:'saving',message:''});
    try{
      const response=await fetcher('/api/learning',{method:'POST',headers:{'Content-Type':'application/json','X-Bee-Learner':actor},body:JSON.stringify({operation:current.operation,requestId:current.requestId,input:current.input}),cache:'no-store'});
      const result=await response.json();
      if(!active||epoch!==generation)return null;
      if(response.status===401||result.error==='ACCOUNT_CHANGED') {
        invalidate();return null;
      }
      if(!response.ok) {
        if(response.status<500)pending=null;
        throw new Error(result.error==='CONFLICT'?'Bài đã thay đổi ở trang khác. Hãy tải lại để đồng bộ.':'Chưa lưu được. Bé thử lại nhé.');
      }
      const value=result as MutationResult;
      if(value.snapshot.learner.id!==actor)throw new Error('Tài khoản đã thay đổi.');
      pending=null;
      if(value.snapshot.revision >= (state.snapshot?.revision??0))publish({snapshot:value.snapshot,lastResult:value,status:'idle',message:''});
      else publish({status:'idle'});
      current.onSuccess?.(value);
      return value;
    }catch(error){if(active&&epoch===generation)publish({status:'error',message:error instanceof Error?error.message:'Chưa lưu được.'});return null;}
  }
  async function refresh(attemptId?:string):Promise<MutationResult|null> {
    const actor=state.snapshot?.learner.id,epoch=generation;
    if(!actor||!active)return null;
    try{
      const response=await fetcher('/api/learning?view=snapshot',{cache:'no-store',headers:{'X-Bee-Learner':actor}});
      const data=await response.json();
      if(!active||epoch!==generation)return null;
      if(response.status===401||data.error==='ACCOUNT_CHANGED') {
        invalidate();return null;
      }
      if(!response.ok)throw new Error('Chưa đồng bộ được dữ liệu.');
      let attempt=state.lastResult?.attempt??null;
      if(attemptId) {
        const attemptResponse=await fetcher(`/api/learning?view=attempt&attemptId=${encodeURIComponent(attemptId)}`,{cache:'no-store',headers:{'X-Bee-Learner':actor}});
        if(!active||epoch!==generation)return null;
        if(attemptResponse.status===401||attemptResponse.status===409){invalidate();return null;}
        if(!attemptResponse.ok)throw new Error('Chưa đồng bộ được bài đang chơi.');
        attempt=await attemptResponse.json();
      }
      if(!active||epoch!==generation||data.learner.id!==actor)return null;
      if(data.revision >= (state.snapshot?.revision??0)) {
        publish({snapshot:data,...(state.status==='error'&&!pending?{status:'idle',message:''}:{}),...(attemptId?{lastResult:{snapshot:data,attempt,feedback:null,assistance:null}}:{})});
      }
      return null;
    }catch(error){if(active&&epoch===generation&&state.status!=='saving')publish({status:'error',message:error instanceof Error?error.message:'Chưa đồng bộ được dữ liệu.'});return null;}
  }
  return {
    getState:()=>state,
    subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},
    send:<K extends LearningOperation>(operation:K,input:LearningCommands[K],onSuccess?:(result:MutationResult)=>void)=>{
      if(!state.snapshot||pending||!active)return Promise.resolve(null);
      pending={operation,input,onSuccess,requestId:crypto.randomUUID()};return run();
    },
    retry:()=>pending?run():refresh(),refresh,
    activate:()=>{if(!active){active=true;publish({...suspended,status:'idle'});}},
    dispose:()=>{suspended=state;active=false;generation++;pending=null;publish({snapshot:null,lastResult:null});},
  };
}
