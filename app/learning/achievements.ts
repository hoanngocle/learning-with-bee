export const achievementGroups = [
  { id:'sessions', key:'sessions', title:'Lượt học tích lũy', unit:'lượt học', targets:[1,10,50,100,250,500], icon:'school', color:'amber' },
  { id:'perfect', key:'perfect', title:'Bài đạt điểm tuyệt đối', unit:'bài đạt 100%', targets:[1,3,5,10,25,50], icon:'trophy', color:'sky' },
  { id:'days', key:'studyDays', title:'Tổng ngày học', unit:'ngày học', targets:[7,30,60,100,180,365], icon:'calendar', color:'purple' },
] as const;
export const badgeDefinitions = achievementGroups.flatMap(group=>group.targets.map((target,index)=>({
  id:`${group.id}:${target}`, key:group.key, target, bonusBps:50*(index+1),
})));
export function evaluateAchievements(counts: {sessions:number;perfect:number;studyDays:number}, unlockedIds:string[]) {
  const unlocked = new Set(unlockedIds);
  const earned = badgeDefinitions.filter(b=>unlocked.has(b.id) || counts[b.key]>=b.target);
  return {newBadgeIds:earned.filter(b=>!unlocked.has(b.id)).map(b=>b.id), totalBonusBps:earned.reduce((sum,b)=>sum+b.bonusBps,0)};
}
