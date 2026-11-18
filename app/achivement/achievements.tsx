"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ActivityIcon as Icon } from "../activity-icon";
import { phonicsPath } from "../home-content";
import styles from "./achievements.module.css";
import { LevelUpModal, type LevelUpHandle } from "./level-up-modal";

import { achievementGroups as categories } from "../learning/achievements";
import { achievementView } from "../learning/achievement-view";
import { useLearner } from "../learning/use-learner";
import { SaveStatus } from "../learning/save-status";
import type { LearnerSnapshot } from "../learning/types";

type BadgeIcon = (typeof categories)[number]["icon"];
type Filter = "all" | "unlocked" | "locked";
const totalBadges = categories.reduce((sum, category) => sum + category.targets.length, 0);

function Shield({ icon, value, tone = "gold" }: { icon: BadgeIcon | "level"; value: number; tone?: string }) {
  return (
    <div className={styles.shield} data-tone={tone} aria-hidden="true">
      <svg viewBox="0 0 100 120" fill="none">
        <path d="M50 8 82 22v44c0 22-32 46-32 46S18 88 18 66V22L50 8Z" fill="var(--shield-fill)" stroke="var(--shield-color)" strokeWidth="3" />
        {icon === "school" && <g fill="var(--shield-color)"><path d="m50 37 23 11-23 11-23-11 23-11Z" /><rect x="36" y="53" width="28" height="12" rx="4" /></g>}
        {icon === "trophy" && <g fill="var(--shield-color)" stroke="var(--shield-color)" strokeWidth="2.5"><path d="M38 38h24c0 13-8 21-12 21s-12-8-12-21Z" /><path d="M35 40c-8-2-8 10 2 12m28-12c8-2 8 10-2 12" fill="none" /><path d="M50 59v9m-9 2h18" /></g>}
        {icon === "calendar" && <g stroke="var(--shield-color)" strokeWidth="3"><rect x="35" y="40" width="30" height="25" rx="4" fill="var(--shield-color)" /><path d="M42 37v7m16-7v7M41 50h3m5 0h3m5 0h3m-19 7h3m5 0h3m5 0h3" stroke="var(--shield-fill)" /></g>}
        {icon === "level" && <><circle cx="50" cy="52" r="21" fill="white" stroke="#244f97" strokeWidth="2" /><text x="50" y="60" textAnchor="middle" fill="#244f97" fontSize="26" fontWeight="900">{value}</text></>}
      </svg>
      {icon !== "level" && <span>{value}</span>}
    </div>
  );
}

function StudyCalendar({ today, userId, studyDayCount }: { today: string; userId: string; studyDayCount: number }) {
  const [offset, setOffset] = useState(0);
  const date = new Date(Date.UTC(Number(today.slice(0,4)), Number(today.slice(5,7)) - 1 + offset, 1));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const firstDay = date.getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const [calendarData, setCalendarData] = useState<Record<string, string[]>>({});
  const [calendarError, setCalendarError] = useState(false);
  const studyDays = (calendarData[prefix] ?? []).map(day => Number(day.slice(-2)));
  useEffect(() => {
    const abort = new AbortController();
    fetch(`/api/learning?view=calendar&year=${year}&month=${month + 1}`, { cache: "no-store", signal: abort.signal, headers: { "X-Bee-Learner": userId } })
      .then(async response => { if (!response.ok) throw new Error("calendar"); return response.json(); })
      .then(data => { setCalendarData(current => ({ ...current, [prefix]: data.studyDates })); setCalendarError(false); })
      .catch(error => { if (error.name !== "AbortError") setCalendarError(true); });
    return () => abort.abort();
  }, [year, month, prefix, userId, studyDayCount]);

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeading}>
        <div><strong aria-live="polite">Tháng {month + 1} năm {year}</strong><small>{studyDays.length} ngày học</small></div>
        <div className={styles.monthControls}>
          <button type="button" aria-label="Tháng trước" onClick={() => setOffset(offset - 1)}>‹</button>
          <button type="button" aria-label="Tháng sau" onClick={() => setOffset(offset + 1)}>›</button>
        </div>
      </div>
      <div className={styles.calendarGrid} role="list" aria-label={`Lịch học tháng ${month + 1} năm ${year}`}>
        {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => <span className={styles.weekday} key={day} aria-hidden="true">{day}</span>)}
        {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
        {Array.from({ length: days }, (_, index) => {
          const day = index + 1;
          const studied = studyDays.includes(day);
          const isToday = `${prefix}-${String(day).padStart(2,"0")}` === today;
          return <span role="listitem" key={day} className={styles.day} data-studied={studied} data-today={isToday}
            aria-label={`Ngày ${day}${studied ? ", đã học" : ""}${isToday ? ", hôm nay" : ""}`}>
            {day}{studied && <span aria-hidden="true">{day % 2 ? "🌻" : "🐝"}</span>}{isToday && <small>Hôm nay</small>}
          </span>;
        })}
      </div>
      {calendarError && <p role="status">Chưa tải được lịch học. Hãy tải lại trang.</p>}
      <div className={styles.calendarLegend}><span>🌻 Đã học</span><span><i /> Hôm nay</span></div>
    </div>
  );
}

export function Achievements({ initialSnapshot }: { initialSnapshot: LearnerSnapshot | null }) {
  const learner = useLearner(initialSnapshot);
  const snapshot = learner.snapshot;
  const view = snapshot ? achievementView(snapshot) : null;
  const [selectedRewardId, setSelectedRewardId] = useState(() => initialSnapshot ? achievementView(initialSnapshot).nextCelebration?.id ?? null : null);
  const selectedReward = snapshot?.rewards.find(r => r.id === selectedRewardId) ?? null;
  const [filter, setFilter] = useState<Filter>("all");
  const modal = useRef<LevelUpHandle>(null);
  const progress = useRef<HTMLDivElement>(null);

  function openCelebration(button: HTMLButtonElement) {
    modal.current?.open(button);
  }

  if (!snapshot || !view) return <main className={`page-width ${styles.page}`}><h1>Thành tích của bé</h1><SaveStatus signedIn={false} status={learner.status} message={learner.message} retry={learner.retry} /></main>;
  const unlockedBadges = view.unlockedCount;
  const expBonus = snapshot.profile.bonusBps / 100;
  return (
    <main className={`page-width ${styles.page}`} lang="vi">
      <SaveStatus signedIn status={learner.status} message={learner.message} retry={learner.retry} />
      <nav className={styles.breadcrumb} aria-label="Đường dẫn"><Link href="/">← Trang chủ</Link><span>/</span><span aria-current="page">Thành tích</span></nav>
      <section className={styles.intro} aria-labelledby="achievement-title">
        <div className={styles.hero}>
          <div>
            <div className={styles.eyebrows}><span>Mỗi ngày một chút tiến bộ ✨</span><span>🖤 Kuromi &amp; Bee</span><span>{snapshot.learner.displayName}</span></div>
            <h1 id="achievement-title">Thành tích của bé <span aria-hidden="true">🏆</span></h1>
            <p>Những nỗ lực nhỏ, những cột mốc đáng nhớ cùng Bạn Ong Vàng chăm chỉ &amp; người bạn Kuromi tinh nghịch!</p>
          </div>
          <div className={styles.actions}>
            <Link className={styles.demoButton} href="/bangxephang">🏆 Bảng xếp hạng</Link>
            <Link className={styles.primaryButton} href={phonicsPath}>Tiếp tục học vui <Icon name="arrow_forward" /></Link>
          </div>
        </div>
        <div className={styles.levelCard}>
          <div className={styles.levelSeal}><span>🐰 ✨</span><small>LEVEL</small><strong>{snapshot.profile.level}</strong><b>BEE 🐝</b></div>
          <div className={styles.levelInfo}>
            <div className={styles.levelHeading}>
              <div><p className={styles.eyebrow}>⭐ HÀNH TRÌNH HỌC TẬP THẦN KỲ</p><h2>Nhà Thám Hiểm Từ Vựng Siêu Đẳng</h2></div>
              <span>⭐ {snapshot.profile.stars} sao</span>
            </div>
            <span className={styles.levelLabel}>🟢 Cấp tài khoản {snapshot.profile.level}</span>
            <div ref={progress} className={styles.progress} role="progressbar" aria-label={`EXP để lên cấp ${snapshot.profile.level + 1}`} aria-valuenow={snapshot.profile.xpWithinLevel} aria-valuemin={0} aria-valuemax={snapshot.profile.xpToNext}><span style={{ width: `${view.expPercent}%` }} /></div>
            <div className={styles.expStats}><span>⚡ <strong>{snapshot.profile.xpWithinLevel}</strong> / {snapshot.profile.xpToNext} EXP để lên cấp {snapshot.profile.level + 1}</span><b>🌟 Tổng {snapshot.profile.totalXp} EXP</b></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="activity-title">
        <div className={styles.sectionHeading}><h2 id="activity-title">Hoạt động gần đây 📅</h2><p>Chỉ cần 1 bài học nhỏ để thắp sáng chuỗi mỗi ngày!</p></div>
        <div className={styles.activityCard}>
          <div className={styles.milestone}>
            <span className={styles.upNext}>Sắp tới</span><small>CỘT MỐC TIẾP THEO</small><h3>Hoàn thành {view.nextPerfectTarget} bài học 100%</h3>
            <Shield icon="trophy" value={view.nextPerfectTarget} tone="purple" />
            <p>Hoàn thành đúng lần đầu, không dùng gợi ý để mở huy hiệu!</p>
            <div className={styles.progress} role="progressbar" aria-label="Bài học đạt điểm tuyệt đối" aria-valuenow={Math.min(snapshot.counts.perfect, view.nextPerfectTarget)} aria-valuemin={0} aria-valuemax={view.nextPerfectTarget}><span style={{ width: `${Math.min(100, snapshot.counts.perfect / view.nextPerfectTarget * 100)}%` }} /></div><b>Đã hoàn thành {snapshot.counts.perfect} / {view.nextPerfectTarget}</b>
          </div>
          <StudyCalendar today={snapshot.studyDate} userId={snapshot.learner.id} studyDayCount={snapshot.counts.studyDays} />
          <div className={styles.streak}><small>CHUỖI HIỆN TẠI</small><span aria-hidden="true">🔥</span><strong>{snapshot.counts.currentStreak} ngày</strong><p>Học hôm nay để tiếp lửa 🔥</p><b>Kỷ lục của bé: {snapshot.counts.longestStreak} ngày</b></div>
        </div>
        <div className={styles.stats}>
          {[{ label: "TỔNG LƯỢT HỌC", value: snapshot.counts.sessions, unit: "lượt vui học", icon: "📚" }, { label: "SỐ NGÀY ĐÃ HỌC", value: snapshot.counts.studyDays, unit: "ngày khám phá", icon: "🗓️" }, { label: "CHUỖI DÀI NHẤT", value: snapshot.counts.longestStreak, unit: "ngày liên tiếp ⭐", icon: "🔥" }].map((stat) => <div key={stat.label}><span aria-hidden="true">{stat.icon}</span><div><small>{stat.label}</small><strong>{stat.value} <span>{stat.unit}</span></strong></div></div>)}
        </div>
      </section>

      <section className={styles.collection} aria-labelledby="collection-title">
        <div className={styles.collectionHeading}><h2 id="collection-title">🏆 Bộ sưu tập thành tựu</h2><span><strong>{unlockedBadges} / {totalBadges}</strong> huy hiệu đã mở khóa</span></div>
        <p className={styles.bonus}>✨ <span><strong>Buff huy hiệu hiện tại: <u>+{expBonus.toLocaleString("vi-VN")}% EXP</u>.</strong> Tất cả huy hiệu đã mở cộng dồn, không giới hạn tổng. Huy hiệu mới có hiệu lực từ bài học tiếp theo!</span></p>
        <div className={styles.filters} role="group" aria-label="Lọc thành tựu">
          {([{ id: "all", label: "Tất cả" }, { id: "unlocked", label: `Đã đạt được (${unlockedBadges})` }, { id: "locked", label: `Chưa mở khóa (${totalBadges - unlockedBadges})` }] as const).map((item) => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <div className={styles.categories} aria-live="polite">
          {categories.map((base) => { const category = { ...base, current: snapshot.counts[base.key] }; return <section key={category.id} aria-labelledby={`${category.id}-title`}>
            <div className={styles.categoryHeading}><div><h3 id={`${category.id}-title`}>{category.title}</h3><p>{category.id === "days" ? "Các ngày có hoạt động hoàn thành, theo giờ Việt Nam." : category.id === "perfect" ? "Đúng mọi câu lần đầu, không gợi ý hay đáp án mẫu." : "Mỗi hoạt động hoàn thành tính tối đa một lượt mỗi ngày."}</p></div><span data-color={category.color}>{category.current} {category.unit}</span></div>
            <div className={styles.badgeGrid}>
              {category.targets.map((target, index) => {
                const unlocked = snapshot.badges.some(b => b.id === `${category.id}:${target}` && b.unlockedAt);
                if (filter === "unlocked" && !unlocked || filter === "locked" && unlocked) return null;
                const next = !unlocked && (index === 0 || category.targets[index - 1] <= category.current);
                const tone = unlocked ? index === 3 ? "purple" : category.id === "perfect" && index === 2 ? "sky" : "gold" : next ? category.color : "locked";
                return <article className={styles.badgeCard} data-locked={!unlocked} data-next={next} key={target}>
                  <Shield icon={category.icon} value={target} tone={tone} />
                  <h4>{target} {category.unit}</h4><p>+{((index + 1) * 0.5).toLocaleString("vi-VN")}% EXP</p>
                  <span className={styles.badgeStatus}>{unlocked ? "✓ Đã đạt" : `${category.current}/${target} • ${next ? "Đang mở" : "Khóa"}`}</span>
                </article>;
              })}
            </div>
          </section>; })}
        </div>
        <p className={styles.footnote}>🛡️ Huy hiệu đã đạt được sẽ được giữ vĩnh viễn trong nhật ký học tập của bé. Ngày đạt được tính theo giờ Việt Nam.</p>
      </section>

      <section className="learning-summary" aria-label="Phần thưởng chưa nhận">
        <h2>🎁 Thưởng lên cấp chưa nhận ({view.pendingRewards.length})</h2>
        {!view.pendingRewards.length && <p>Hoàn thành hoạt động để tích EXP và lên cấp.</p>}
        {view.pendingRewards.map(reward => <button key={reward.id} type="button" disabled={learner.status === "saving"} onClick={event => {
          const button = event.currentTarget; setSelectedRewardId(reward.id); requestAnimationFrame(() => openCelebration(button));
        }}>Cấp {reward.level}: +{reward.stars} sao · Nhận thưởng</button>)}
      </section>
      <LevelUpModal ref={modal} reward={selectedReward} busy={learner.status === "saving"}
        onAcknowledge={() => { if (selectedReward && !selectedReward.celebrationSeen) void learner.send("acknowledgeCelebration", { rewardId: selectedReward.id }); }}
        onClaim={async () => !!(selectedReward && await learner.send("claimReward", { rewardId: selectedReward.id }))} onDismiss={() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        progress.current?.animate([
          { boxShadow: "0 0 0 4px #f19b33", transform: "scale(1.02)" },
          { boxShadow: "0 0 0 4px #f19b33", transform: "scale(1.02)", offset: .75 },
          { boxShadow: "0 0 0 0 transparent", transform: "scale(1)" },
        ], { duration: 1200, easing: "ease-out" });
      }} />
    </main>
  );
}
