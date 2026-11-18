'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { createLearnerClient } from './client';
import type { LearnerSnapshot } from './types';

export function useLearner(initial:LearnerSnapshot|null) {
  const [client]=useState(()=>createLearnerClient(initial));
  const state=useSyncExternalStore(client.subscribe,client.getState,client.getState);
  useEffect(()=>{
    client.activate();
    const refresh=()=>{if(document.visibilityState==='visible')void client.refresh();};
    refresh();window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);
    const timer=setInterval(refresh,30000);
    return ()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);client.dispose();};
  },[client]);
  return {...state,send:client.send,retry:client.retry,refresh:client.refresh};
}
