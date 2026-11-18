import { achievementGroups } from './achievements';
import type { LearnerSnapshot } from './types';
export function achievementView(snapshot:LearnerSnapshot) {
  const pendingRewards=snapshot.rewards.filter(r=>r.kind==='level_up'&&r.status==='pending');
  return {
    unlockedCount:snapshot.badges.filter(b=>b.unlockedAt).length,
    expPercent:Math.min(100,snapshot.profile.xpWithinLevel/snapshot.profile.xpToNext*100),
    nextPerfectTarget:achievementGroups[1].targets.find(t=>t>snapshot.counts.perfect)??50,
    pendingRewards,nextCelebration:pendingRewards.find(r=>!r.celebrationSeen)??null,
  };
}
