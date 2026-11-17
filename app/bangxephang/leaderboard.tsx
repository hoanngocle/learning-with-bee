"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityIcon as Icon } from "../activity-icon";
import motion from "../game-motion.module.css";
import { phonicsPath } from "../home-content";
import { miniGamePath } from "../oxford-phonics-world/level-1/game-paths";
import { alphabetPath, levels } from "../oxford-phonics-world/level-content";
import styles from "./leaderboard.module.css";

const levelDetails = [
  { icon: "🔤", players: 428, total: 17, own: 12 },
  { icon: "🐾", players: 315, total: 20, own: 15 },
  { icon: "🍰", players: 260, total: 20, own: 13 },
  { icon: "🚂", players: 184, total: 24, own: 16 },
  { icon: "🐰", players: 142, total: 25, own: 18 },
];

const periods = ["Hôm nay", "Tuần này", "Tất cả"] as const;
type Period = (typeof periods)[number];

const learners = [
  { name: "Khue", detail: "Bé Khuê (Lớp Ong Chăm 01)", avatar: "👧", scores: [17, 18, 20, 21, 24], time: "02:15", badge: "🌟 Ngôi sao chăm chỉ", today: true },
  { name: "manh", detail: "Bé Mạnh (Lớp Ong Chăm 02)", avatar: "👦", scores: [17, 19, 16, 22, 22], time: "03:29", badge: "⚡ Siêu tốc độ", today: false },
  { name: "Minh An", detail: "Bé Minh An (Lớp Ong Con)", avatar: "🧒", scores: [16, 19, 18, 20, 25], time: "02:45", badge: "👏 Bé xuất sắc", today: true },
  { name: "Bảo Nam", detail: "Bé Nam (Hà Nội)", avatar: "👦", scores: [15, 20, 17, 23, 21], time: "03:10", badge: "🌱 Cố gắng vượt bậc", today: true },
  { name: "Thảo Chi", detail: "Bé Chi (Đà Nẵng)", avatar: "👧", scores: [14, 17, 19, 24, 23], time: "03:35", badge: "🎯 Chăm ngoan", today: false },
  { name: "Đăng Khoa", detail: "Bé Khoa (TP. Hồ Chí Minh)", avatar: "👦", scores: [14, 16, 18, 18, 24], time: "03:52", badge: "🚀 Tiến bộ nhanh", today: true },
];

const pastLearners = [
  { name: "Mai Anh", detail: "Bé Mai Anh (Lớp Ong Con)", avatar: "👧", scores: [17, 18, 20, 24, 23], time: "02:05", badge: "🏆 Vượt thử thách" },
  { name: "Gia Huy", detail: "Bé Gia Huy (Lớp Ong Chăm 01)", avatar: "🧒", scores: [16, 20, 20, 22, 25], time: "02:32", badge: "✨ Nhà thám hiểm" },
];

const podiumLabels = ["Ngôi Sao Vàng", "Á Quân", "Hạng Ba"];
const medals = ["🥇", "🥈", "🥉"];

export function Leaderboard() {
  const [levelIndex, setLevelIndex] = useState(0);
  const [period, setPeriod] = useState<Period>("Tuần này");
  const level = levels[levelIndex];
  const levelTitle = level.number === 5 ? "Letter Combinations" : level.title;
  const { total, own } = levelDetails[levelIndex];
  const entries = period === "Tất cả" ? [...learners, ...pastLearners] : learners.filter((learner) => period !== "Hôm nay" || learner.today);
  const rows = entries
    .map((learner) => ({ ...learner, score: learner.scores[levelIndex] }))
    .sort((a, b) => b.score - a.score || a.time.localeCompare(b.time));
  const pointsToPodium = Math.max(0, rows[2].score - own + 1);

  return (
    <main className={`page-width ${styles.page}`} lang="vi">
      <div className={styles.toolbar}>
        <nav className={styles.breadcrumb} aria-label="Đường dẫn">
          <Link className={styles.back} href="/"><Icon name="arrow_back" /> Quay lại Trang chủ</Link>
          <span aria-hidden="true">/</span>
          <Link href={phonicsPath}>Oxford Phonics World</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Bảng Xếp Hạng</span>
        </nav>
        <div className={styles.filters} role="group" aria-label="Thời gian xếp hạng">
          {periods.map((filter) => (
            <button key={filter} type="button" aria-pressed={period === filter} onClick={() => setPeriod(filter)}>
              {filter}
            </button>
          ))}
        </div>
      </div>

      <header className={styles.hero}>
        <div className={styles.trophy}><Icon name="emoji_events" /></div>
        <div>
          <p className={styles.eyebrow}><Icon name="auto_awesome" /> Đường đua tinh anh Phonics</p>
          <h1>Bảng Xếp Hạng Siêu Nhí Phonics</h1>
          <p>Cùng xem bạn nhỏ nào học chăm chỉ và đạt điểm số cao nhất nhé! 🐝</p>
        </div>
        <div className={styles.period}>
          <span><Icon name="timer" /></span>
          <div><small>Kỳ xếp hạng</small><strong>{period}</strong></div>
        </div>
      </header>

      <section className={styles.levelPicker} aria-labelledby="ranking-levels">
        <h2 id="ranking-levels"><Icon name="layers" /> Chọn cấp độ muốn xem xếp hạng</h2>
        <div className={styles.levels} role="group" aria-labelledby="ranking-levels">
          {levels.map(({ number, title }, index) => (
            <button key={number} className={styles.level} type="button" data-level={number}
              aria-pressed={levelIndex === index} onClick={() => setLevelIndex(index)}>
              <span className={styles.levelIcon} aria-hidden="true">{levelDetails[index].icon}</span>
              <strong>Level {number}</strong>
              <span lang="en">{number === 5 ? "Letter Combinations" : title}</span>
              <small>{levelDetails[index].players} bạn nhỏ</small>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.podium} aria-labelledby="podium-title">
        <header>
          <p className={styles.eyebrow}>👑 Vinh danh {period === "Tất cả" ? "mọi thời điểm" : period.toLowerCase()}</p>
          <h2 id="podium-title">Top 3 Siêu Nhân Phonics</h2>
          <p>Điểm số cao nhất và hoàn thành trong thời gian thần tốc!</p>
        </header>
        <ol className={styles.podiumSteps} key={`${levelIndex}-${period}`}>
          {rows.slice(0, 3).map((learner, index) => (
            <li key={learner.name} className={`${styles.podiumEntry} ${motion.pop}`} data-rank={index + 1}>
              {index === 0 && <span className={`${styles.championBadge} ${motion.bounce}`}><Icon name="military_tech" /></span>}
              <span className={styles.podiumAvatar} aria-hidden="true">{learner.avatar}<small>{medals[index]}</small></span>
              <strong className={styles.podiumName}>{learner.name}</strong>
              <small className={styles.podiumDetail}>{learner.detail.split(" (")[0]}</small>
              <div className={styles.step}>
                <span className={styles.stepRank} aria-label={`Hạng ${index + 1}`}>{index + 1}</span>
                <strong className={styles.stepScore}><Icon name="star" /> {learner.score} / {total}</strong>
                <span className={styles.stepTime}><Icon name="timer" /> {learner.time}</span>
                <span className={styles.stepLabel}>{podiumLabels[index]}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.rankings} aria-labelledby="ranking-title">
        <header className={styles.tableHeader}>
          <span><Icon name="menu_book" /></span>
          <div>
            <h2 id="ranking-title">Bảng xếp hạng Level {level.number}: {levelTitle}</h2>
            <p>{level.number === 1 ? "Bài kiểm tra tổng hợp 26 chữ cái Phonics" : level.vi[1]}</p>
          </div>
          <small>Dữ liệu minh họa</small>
        </header>
        <div className={styles.tableScroll} tabIndex={0} role="region" aria-labelledby="ranking-title">
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Hạng</th>
                <th scope="col">Tên học viên</th>
                <th scope="col">Điểm số</th>
                <th scope="col">Thời gian</th>
                <th scope="col">Huy hiệu</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((learner, index) => (
                <tr key={learner.name} data-rank={index + 1}>
                  <td><span className={styles.rank}>{index + 1}</span></td>
                  <th scope="row">
                    <div className={styles.learner}>
                      <span className={styles.avatar} aria-hidden="true">{learner.avatar}</span>
                      <div><strong>{learner.name}</strong><small>{learner.detail}</small></div>
                    </div>
                  </th>
                  <td><strong className={styles.score}>{index < 3 && <Icon name="star" />} {learner.score} / {total}</strong></td>
                  <td><span className={styles.time}>{learner.time}</span></td>
                  <td><span className={styles.achievement}>{learner.badge}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.myRank}>
          <span>12</span>
          <div>
            <h3>Vị trí của bạn: Bé Ong Vàng</h3>
            <p>Điểm số <strong>{own}/{total}</strong> · Thời gian <strong>04:12</strong>{pointsToPodium > 0 && <> · Còn {pointsToPodium} điểm để vượt hạng ba</>}</p>
          </div>
          <Link className={styles.study} href={level.number === 1 ? alphabetPath : phonicsPath}><Icon name="rocket_launch" /> Học tiếp để leo bảng!</Link>
        </div>
      </section>

      <div className={styles.bottom}>
        <aside className={styles.tip}>
          <span><Icon name="emoji_nature" /></span>
          <div><h2>Ong Vàng mách nhỏ cho bé</h2><p>Khi hai bạn có cùng số điểm, bạn hoàn thành bài nhanh hơn sẽ xếp trên. Bé thử chơi lại để cải thiện thời gian nhé!</p></div>
        </aside>
        <nav className={styles.quickLinks} aria-label="Luyện tập">
          <Link href={miniGamePath}><Icon name="videogame_asset" /> Chơi Mini Game Chữ Cái <Icon name="arrow_forward" /></Link>
          <Link href={alphabetPath}><Icon name="menu_book" /> Ôn tập Phonics A - Z <Icon name="arrow_forward" /></Link>
        </nav>
      </div>
    </main>
  );
}
