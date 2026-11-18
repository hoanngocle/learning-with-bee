'use client';
import Link from 'next/link';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { ActivityIcon as Icon } from '../activity-icon';
import { levels, alphabetPath } from '../oxford-phonics-world/level-content';
import type { LeaderboardResult } from '../learning/types';
import styles from './leaderboard.module.css';
import { createRankingClient } from '../learning/ranking-client';

const periods=[{id:'today',label:'Hôm nay'},{id:'week',label:'Tuần này'},{id:'all',label:'Tất cả'}] as const;
const assessmentPath=`${alphabetPath}/assessment`;
export function formatDuration(ms:number) { const seconds=Math.floor(ms/1000);return `${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`; }
export function Leaderboard({initialData,viewerId}:{initialData:LeaderboardResult;viewerId:string|null}) {
  const [levelIndex,setLevelIndex]=useState(0),[period,setPeriod]=useState<'today'|'week'|'all'>('week');
  const [client]=useState(()=>createRankingClient(initialData,viewerId));
  const {results,errors,accountChanged}=useSyncExternalStore(client.subscribe,client.getState,client.getState);
  const level=levels[levelIndex],queryKey=`${level.number}:${period}`;
  const data=results[queryKey],rankingRows=data?.rows??[],own=data?.own??null;
  const label=periods.find(p=>p.id===period)!.label;
  useEffect(()=>{
    client.activate();
    const synchronize=()=>{if(document.visibilityState==='visible'&&level.number===1)void client.refresh(period);};
    synchronize();window.addEventListener('focus',synchronize);document.addEventListener('visibilitychange',synchronize);
    const timer=setInterval(synchronize,30000);
    return ()=>{clearInterval(timer);window.removeEventListener('focus',synchronize);document.removeEventListener('visibilitychange',synchronize);client.dispose();};
  },[level.number,period,client]);
  const pointsToPodium=own&&rankingRows.length>=3?Math.max(0,rankingRows[2].score-own.score+1):null;
  if(accountChanged)return <main className={`page-width ${styles.page}`}><h1>Phiên tài khoản đã thay đổi</h1><p>Hãy tải lại trang để xem bảng hạng của phiên hiện tại.</p><button type="button" onClick={()=>location.reload()}>Tải lại trang</button></main>;
  return <main className={`page-width ${styles.page}`} lang="vi">
    <div className={styles.toolbar}>
      <nav className={styles.breadcrumb} aria-label="Đường dẫn"><Link href="/">← Trang chủ</Link><span>/</span><Link href={alphabetPath}>Oxford Phonics</Link><span>/</span><span>Bảng xếp hạng</span></nav>
      <div className={styles.filters} role="group" aria-label="Thời gian xếp hạng">{periods.map(p=><button key={p.id} type="button" aria-pressed={period===p.id} onClick={()=>setPeriod(p.id)}>{p.label}</button>)}</div>
    </div>
    <header className={styles.hero}><div className={styles.trophy}><Icon name="emoji_events" /></div><div><p className={styles.eyebrow}>Đường đua Phonics</p><h1>Bảng Xếp Hạng Siêu Nhí Phonics</h1><p>Kết quả bài kiểm tra tổng hợp, xếp theo điểm rồi thời gian hoàn thành.</p></div><div className={styles.period}><span>🏆</span><div><small>Kỳ xếp hạng</small><strong>{label}</strong></div></div></header>
    <section className={styles.levelPicker} aria-label="Cấp độ xếp hạng"><h2>Chọn cấp độ</h2><div className={styles.levels} role="group" aria-label="Cấp độ">
      {levels.map((l,index)=><button key={l.number} className={styles.level} type="button" data-level={l.number} aria-pressed={levelIndex===index} onClick={()=>setLevelIndex(index)}><span className={styles.levelIcon}>{l.emoji}</span><strong>Level {l.number}</strong><span>{l.title}</span><small>{l.number===1?`${results[`1:${period}`]?.rows.length??0} học viên trong kỳ`:'Chưa có bài kiểm tra'}</small></button>)}
    </div></section>
    {level.number!==1?<section className="learning-summary"><h2>Nội dung đang được chuẩn bị</h2><p>Level {level.number} chưa có bài kiểm tra và kết quả xếp hạng.</p></section>:<>
      {errors[queryKey]&&<p role="status">Chưa tải được bảng hạng mới. Hãy tải lại trang để đồng bộ.</p>}
      {!data&&<p role="status">Đang tải kết quả…</p>}
      {!!rankingRows.length&&<section className={styles.podium} aria-labelledby="podium-title"><header><p className={styles.eyebrow}>{label}</p><h2 id="podium-title">Các bạn dẫn đầu</h2></header>
        <ol className={styles.podiumSteps}>{rankingRows.slice(0,3).map((learner,index)=><li key={learner.userId} className={styles.podiumEntry} data-rank={learner.rank}><span className={styles.podiumAvatar}>{['🥇','🥈','🥉'][index]}</span><strong className={styles.podiumName}>{learner.displayName}</strong><div className={styles.step}><span className={styles.stepRank}>{learner.rank}</span><strong className={styles.stepScore}>{learner.score}/26</strong><span className={styles.stepTime}>{formatDuration(learner.durationMs)}</span></div></li>)}</ol>
      </section>}
      <section className={styles.rankings} aria-labelledby="ranking-title"><header className={styles.tableHeader}><span>📚</span><div><h2 id="ranking-title">Level 1: The Alphabet</h2><p>26 câu · {label} · Giờ Việt Nam</p></div><small>Dữ liệu học tập thực</small></header>
        {!rankingRows.length&&data?<p className="learning-summary">Chưa có kết quả trong kỳ này. Bé có thể tham gia bài kiểm tra đầu tiên!</p>:<div className={styles.tableScroll} tabIndex={0} role="region" aria-label="Kết quả xếp hạng"><table className={styles.table}><thead><tr><th scope="col">Hạng</th><th scope="col">Học viên</th><th scope="col">Điểm</th><th scope="col">Thời gian</th></tr></thead><tbody>{rankingRows.map(learner=><tr key={learner.userId} data-rank={learner.rank}><td><span className={styles.rank}>{learner.rank}</span></td><th scope="row">{learner.displayName}{learner.userId===viewerId?' (Bạn)':''}</th><td><strong className={styles.score}>{learner.score}/26</strong></td><td>{formatDuration(learner.durationMs)}</td></tr>)}</tbody></table></div>}
        <div className={styles.myRank}><span>{own?.rank??'—'}</span><div><h3>{own?`Vị trí của bạn: ${own.rank}`:'Bé chưa tham gia trong kỳ này'}</h3>{own&&<p>{own.score}/26 · {formatDuration(own.durationMs)}{pointsToPodium!==null&&pointsToPodium>0&&own.score<26&&own.score+pointsToPodium<=26?` · Thêm ${pointsToPodium} điểm để vượt hạng ba`:own.rank>3?' · Thử cải thiện điểm hoặc thời gian nhé!':''}</p>}</div><Link className={styles.study} href={assessmentPath}>Làm bài kiểm tra →</Link></div>
      </section>
    </>}
    <nav className={styles.quickLinks} aria-label="Luyện tập"><Link href={assessmentPath}>📝 Kiểm tra 26 chữ cái</Link><Link href={alphabetPath}>📚 Ôn tập A–Z</Link></nav>
  </main>;
}
