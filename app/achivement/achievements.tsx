"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ActivityIcon as Icon } from "../activity-icon";
import { phonicsPath } from "../home-content";
import styles from "./achievements.module.css";
import { LevelUpModal, type LevelUpHandle } from "./level-up-modal";

// Preview values from template/achivement; no learner progress is persisted here.
const categories = [
  { id: "sessions", title: "Lượt học tích lũy", description: "Mỗi lần đánh dấu flashcard, luyện viết hoặc nộp bài mini game được tính là một lượt.", unit: "lượt học", current: 128, targets: [1, 10, 50, 100, 250, 500], icon: "school", color: "amber" },
  { id: "perfect", title: "Bài học đạt điểm tuyệt đối 100% 🎯", description: "Hoàn thành bài luyện từ vựng hoặc mini game không sai bất kỳ câu nào.", unit: "bài đạt 100%", current: 8, targets: [1, 3, 5, 10, 25, 50], icon: "trophy", color: "sky" },
  { id: "days", title: "Tổng ngày học 🗓️", description: "Cộng dồn ngày có hoạt động học tập, không cần chuỗi liên tiếp.", unit: "ngày học", current: 45, targets: [7, 30, 60, 100, 180, 365], icon: "calendar", color: "purple" },
] as const;

type BadgeIcon = (typeof categories)[number]["icon"];
type Filter = "all" | "unlocked" | "locked";
const totalBadges = categories.reduce((sum, category) => sum + category.targets.length, 0);
const unlockedBadges = categories.reduce((sum, category) => sum + category.targets.filter((target) => target <= category.current).length, 0);
const expBonus = categories.reduce((sum, category) => sum + category.targets.reduce((bonus, target, index) => bonus + (target <= category.current ? (index + 1) * 0.5 : 0), 0), 0);
const studyDays = Array.from({ length: 15 }, (_, index) => index + 4);

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

function StudyCalendar() {
  const [offset, setOffset] = useState(0);
  const date = new Date(Date.UTC(2026, 10 + offset, 1));
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const firstDay = date.getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const isDemoMonth = offset === 0;

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeading}>
        <div><strong aria-live="polite">Tháng {month + 1} năm {year}</strong><small>{isDemoMonth ? studyDays.length : 0} ngày học</small></div>
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
          const studied = isDemoMonth && studyDays.includes(day);
          const today = isDemoMonth && day === 18;
          return <span role="listitem" key={day} className={styles.day} data-studied={studied} data-today={today}
            aria-label={`Ngày ${day}${studied ? ", đã học" : ""}${today ? ", hôm nay trong bản mẫu" : ""}`}>
            {day}{studied && <span aria-hidden="true">{day % 2 ? "🌻" : "🐝"}</span>}{today && <small>Hôm nay</small>}
          </span>;
        })}
      </div>
      <div className={styles.calendarLegend}><span>🌻 Đã học</span><span><i /> Hôm nay (bản mẫu)</span></div>
    </div>
  );
}

export function Achievements() {
  const [filter, setFilter] = useState<Filter>("all");
  const modal = useRef<LevelUpHandle>(null);
  const progress = useRef<HTMLDivElement>(null);

  function openCelebration(button: HTMLButtonElement) {
    modal.current?.open(button);
  }

  return (
    <main className={`page-width ${styles.page}`} lang="vi">
      <nav className={styles.breadcrumb} aria-label="Đường dẫn"><Link href="/">← Trang chủ</Link><span>/</span><span aria-current="page">Thành tích</span></nav>
      <section className={styles.intro} aria-labelledby="achievement-title">
        <div className={styles.hero}>
          <div>
            <div className={styles.eyebrows}><span>Mỗi ngày một chút tiến bộ ✨</span><span>🖤 Kuromi &amp; Bee</span><span>Dữ liệu mẫu</span></div>
            <h1 id="achievement-title">Thành tích của bé <span aria-hidden="true">🏆</span></h1>
            <p>Những nỗ lực nhỏ, những cột mốc đáng nhớ cùng Bạn Ong Vàng chăm chỉ &amp; người bạn Kuromi tinh nghịch!</p>
          </div>
          <div className={styles.actions}>
            <button className={styles.demoButton} type="button" onClick={(event) => openCelebration(event.currentTarget)}>🎉 Mô phỏng Thăng Cấp!</button>
            <Link className={styles.primaryButton} href={phonicsPath}>Tiếp tục học vui <Icon name="arrow_forward" /></Link>
          </div>
        </div>
        <div className={styles.levelCard}>
          <div className={styles.levelSeal}><span>🐰 ✨</span><small>LEVEL</small><strong>5</strong><b>PRO 🐝</b></div>
          <div className={styles.levelInfo}>
            <div className={styles.levelHeading}>
              <div><p className={styles.eyebrow}>⭐ HÀNH TRÌNH HỌC TẬP THẦN KỲ</p><h2>Nhà Thám Hiểm Từ Vựng Siêu Đẳng</h2></div>
              <button type="button" onClick={(event) => openCelebration(event.currentTarget)}>🎊 Xem hoạt họa lên cấp</button>
            </div>
            <span className={styles.levelLabel}>🟢 Cấp độ 5: Vườn Hoa Tri Thức</span>
            <div ref={progress} className={styles.progress} role="progressbar" aria-label="EXP để lên Level 6" aria-valuenow={1450} aria-valuemin={0} aria-valuemax={2000}><span style={{ width: "72.5%" }} /></div>
            <div className={styles.expStats}><span>⚡ <strong>1.450</strong> / 2.000 EXP để lên Level 6</span><b>🌟 Tổng 12.850 EXP</b></div>
          </div>
        </div>
      </section>

      <section aria-labelledby="activity-title">
        <div className={styles.sectionHeading}><h2 id="activity-title">Hoạt động gần đây 📅</h2><p>Chỉ cần 1 bài học nhỏ để thắp sáng chuỗi mỗi ngày!</p></div>
        <div className={styles.activityCard}>
          <div className={styles.milestone}>
            <span className={styles.upNext}>Sắp tới</span><small>CỘT MỐC TIẾP THEO</small><h3>Hoàn thành 10 bài học 100%</h3>
            <Shield icon="trophy" value={10} tone="purple" />
            <p>Huy hiệu siêu cấp &amp; +2% EXP đang chờ đón bé mở khóa!</p>
            <div className={styles.progress} role="progressbar" aria-label="Bài học đạt điểm tuyệt đối" aria-valuenow={8} aria-valuemin={0} aria-valuemax={10}><span style={{ width: "80%" }} /></div><b>Đã hoàn thành 8 / 10</b>
          </div>
          <StudyCalendar />
          <div className={styles.streak}><small>CHUỖI HIỆN TẠI</small><span aria-hidden="true">🔥</span><strong>15 ngày</strong><p>Học hôm nay để tiếp lửa 🔥</p><b>Kỷ lục của bé: 28 ngày</b></div>
        </div>
        <div className={styles.stats}>
          {[{ label: "TỔNG LƯỢT HỌC", value: 128, unit: "lượt vui học", icon: "📚" }, { label: "SỐ NGÀY ĐÃ HỌC", value: 45, unit: "ngày khám phá", icon: "🗓️" }, { label: "CHUỖI DÀI NHẤT", value: 28, unit: "ngày liên tiếp ⭐", icon: "🔥" }].map((stat) => <div key={stat.label}><span aria-hidden="true">{stat.icon}</span><div><small>{stat.label}</small><strong>{stat.value} <span>{stat.unit}</span></strong></div></div>)}
        </div>
      </section>

      <section className={styles.collection} aria-labelledby="collection-title">
        <div className={styles.collectionHeading}><h2 id="collection-title">🏆 Bộ sưu tập thành tựu</h2><span><strong>{unlockedBadges} / {totalBadges}</strong> huy hiệu đã mở khóa</span></div>
        <p className={styles.bonus}>✨ <span><strong>Buff huy hiệu hiện tại: <u>+{expBonus.toLocaleString("vi-VN")}% EXP</u>.</strong> Tất cả huy hiệu đã mở cộng dồn, không giới hạn tổng. Huy hiệu mới có hiệu lực từ bài học tiếp theo!</span></p>
        <div className={styles.filters} role="group" aria-label="Lọc thành tựu">
          {([{ id: "all", label: "Tất cả" }, { id: "unlocked", label: `Đã đạt được (${unlockedBadges})` }, { id: "locked", label: `Chưa mở khóa (${totalBadges - unlockedBadges})` }] as const).map((item) => <button type="button" key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)}>{item.label}</button>)}
        </div>
        <div className={styles.categories} aria-live="polite">
          {categories.map((category) => <section key={category.id} aria-labelledby={`${category.id}-title`}>
            <div className={styles.categoryHeading}><div><h3 id={`${category.id}-title`}>{category.title}</h3><p>{category.description}</p></div><span data-color={category.color}>{category.current} {category.unit}</span></div>
            <div className={styles.badgeGrid}>
              {category.targets.map((target, index) => {
                const unlocked = target <= category.current;
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
          </section>)}
        </div>
        <p className={styles.footnote}>🛡️ Huy hiệu đã đạt được sẽ được giữ vĩnh viễn trong nhật ký học tập của bé. Ngày đạt được tính theo giờ Việt Nam.</p>
      </section>

      <LevelUpModal ref={modal} onDismiss={() => {
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
