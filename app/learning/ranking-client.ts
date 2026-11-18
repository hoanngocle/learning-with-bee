import type { LeaderboardResult } from './types';
export function createRankingClient(initial:LeaderboardResult,viewerId:string|null,fetcher:typeof fetch=fetch) {
  let state:{results:Record<string,LeaderboardResult>;errors:Record<string,boolean>;accountChanged:boolean}={results:{'1:week':initial},errors:{},accountChanged:false};
  const listeners=new Set<()=>void>();let generation=0,active=true;
  const publish=(patch:Partial<typeof state>)=>{state={...state,...patch};listeners.forEach(listener=>listener());};
  return {
    getState:()=>state,subscribe:(listener:()=>void)=>{listeners.add(listener);return ()=>{listeners.delete(listener);};},
    activate:()=>{active=true;},dispose:()=>{active=false;generation++;},
    refresh:async(period:'today'|'week'|'all')=>{
      if(!active||state.accountChanged)return;
      const epoch=generation,key=`1:${period}`;
      try{
        const response=await fetcher(`/api/learning?view=leaderboard&level=1&period=${period}`,{cache:'no-store',headers:viewerId?{'X-Bee-Learner':viewerId}:{}});
        if(!active||epoch!==generation)return;
        if(response.status===401||response.status===409){generation++;publish({results:{},errors:{},accountChanged:true});return;}
        if(!response.ok)throw new Error('ranking');
        const result=await response.json() as LeaderboardResult;
        if(!active||epoch!==generation)return;
        publish({results:{...state.results,[key]:result},errors:{...state.errors,[key]:false}});
      }catch{if(active&&epoch===generation)publish({errors:{...state.errors,[key]:true}});}
    },
  };
}
