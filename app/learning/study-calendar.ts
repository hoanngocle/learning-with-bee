const formatter = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'});
export function toStudyDate(now:Date) { return formatter.format(now); }
export function shiftDate(date:string,days:number) { return new Date(Date.parse(`${date}T00:00:00Z`)+days*86400000).toISOString().slice(0,10); }
export function summarizeStudyDays(input:string[],now:Date) {
  const dates=[...new Set(input)].sort();
  let longestStreak=0,run=0,previous='';
  for(const day of dates) { run=previous && shiftDate(previous,1)===day ? run+1 : 1; longestStreak=Math.max(longestStreak,run); previous=day; }
  const set=new Set(dates); let cursor=toStudyDate(now), currentStreak=0;
  if(!set.has(cursor)) cursor=shiftDate(cursor,-1);
  while(set.has(cursor)) { currentStreak++; cursor=shiftDate(cursor,-1); }
  return {total:dates.length,currentStreak,longestStreak};
}
export function periodStart(period:'today'|'week'|'all',now:Date) {
  if(period==='all') return '1970-01-01T00:00:00.000Z';
  let day=toStudyDate(now);
  if(period==='week') { const weekday=new Date(`${day}T00:00:00Z`).getUTCDay(); day=shiftDate(day,-((weekday+6)%7)); }
  return new Date(`${day}T00:00:00+07:00`).toISOString();
}
