'use client';
import { useEffect } from 'react';
import { useLearner } from './use-learner';
import type { AttemptDto, LearnerSnapshot, MutationResult } from './types';

export type GameInitial={initialSnapshot:LearnerSnapshot|null;initialAttempt:AttemptDto|null};
export function useGame(activityId:string,initial:GameInitial) {
  const learner=useLearner(initial.initialSnapshot);
  const attempt=learner.snapshot?(learner.lastResult?.attempt??initial.initialAttempt):null;
  const signedIn=!!learner.snapshot;
  const { send, status, refresh }=learner;
  useEffect(()=>{
    if(signedIn&&!attempt&&status==='idle')void send('startAttempt',{activityId});
  },[activityId,signedIn,attempt,status,send]);
  const attemptId=attempt?.id;
  useEffect(()=>{
    if(!attemptId)return;
    const synchronize=()=>{if(document.visibilityState==='visible')void refresh(attemptId);};
    synchronize();window.addEventListener('focus',synchronize);
    return ()=>window.removeEventListener('focus',synchronize);
  },[attemptId,refresh]);
  return {...learner,attempt,signedIn,ready:!signedIn||!!attempt,
    answer:(questionId:string,selectedId:string)=>attempt?learner.send('answerQuestion',{attemptId:attempt.id,questionId,selectedId}):Promise.resolve(null),
    assist:(questionId:string,kind:'hint'|'reveal',onSuccess?:(result:MutationResult)=>void)=>attempt?learner.send('useAssistance',{attemptId:attempt.id,questionId,kind},onSuccess):Promise.resolve(null),
    restart:async()=>{
      if(attempt){const result=await learner.send('abandonAttempt',{attemptId:attempt.id});if(!result)return null;}
      return learner.send('startAttempt',{activityId});
    },
  };
}
