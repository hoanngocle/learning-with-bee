import 'server-only';
import type { DatabaseSync } from 'node:sqlite';
import { rows } from './repository';
import { periodStart, shiftDate, toStudyDate } from './study-calendar';
import { LearningError, type LeaderboardResult } from './types';

export function getLeaderboard(db:DatabaseSync,input:{period:'today'|'week'|'all';level:number;now:Date;viewerId:string|null}):LeaderboardResult {
  if(!['today','week','all'].includes(input.period)) throw new LearningError('INVALID_INPUT');
  if(input.level!==1) return {rows:[],own:null};
  const start=periodStart(input.period,input.now);
  const end=input.period==='all'?'9999-12-31T00:00:00.000Z':new Date(`${shiftDate(toStudyDate(new Date(start)),input.period==='week'?7:1)}T00:00:00+07:00`).toISOString();
  const candidates=rows<{userId:string;displayName:string;score:number;durationMs:number;completedAt:string}>(db,
    `SELECT a.user_id AS userId,u.display_name AS displayName,a.score,a.duration_ms AS durationMs,a.completed_at AS completedAt
     FROM attempts a JOIN users u ON a.user_id=u.id WHERE a.activity_id='opw.l1.assessment' AND a.status='completed'
     AND a.completed_at>=? AND a.completed_at<? ORDER BY a.score DESC,a.duration_ms ASC,a.completed_at ASC,a.user_id ASC`,start,end);
  const seen=new Set<string>();
  const ranking=candidates.filter(c=>{if(seen.has(c.userId))return false;seen.add(c.userId);return true;})
    .map((c,index)=>({userId:c.userId,displayName:c.displayName,score:c.score,total:26,durationMs:c.durationMs,rank:index+1}));
  const own=ranking.find(r=>r.userId===input.viewerId);
  return {rows:ranking,own:own?{rank:own.rank,score:own.score,durationMs:own.durationMs}:null};
}
