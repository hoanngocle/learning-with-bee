"use client";

import Link from "next/link";
import { useRef } from "react";
import { ActivityIcon } from "../../activity-icon";
import motion from "../../game-motion.module.css";
import type { Locale } from "../../home-content";
import { lessonGamesId, miniGamePath } from "./game-paths";
import styles from "./game-chooser.module.css";

const choices = [
  {
    href: "/oxford-phonics-world/level-1/assessment",
    icon: "📝",
    theme: "blue",
    vi: ["Kiểm tra 26 chữ cái", "Làm bài tổng hợp và xem bảng xếp hạng."],
    en: ["Alphabet assessment", "Take the 26-question test and join the leaderboard."],
  },
  {
    href: miniGamePath,
    icon: "🎧",
    theme: "blue",
    vi: ["Mini game chữ cái", "Nghe câu hỏi và chọn hình đúng."],
    en: ["Alphabet mini game", "Listen to the question and pick the right picture."],
  },
  {
    href: "/gheptu",
    icon: "🔤",
    theme: "orange",
    vi: ["Ghép từ", "Sắp xếp các chữ cái để tạo thành từ."],
    en: ["Word scramble", "Put the letters in order to make a word."],
  },
  {
    href: "/mohop",
    icon: "🎁",
    theme: "purple",
    vi: ["Mở hộp bí mật", "Chọn hộp và giải câu đố bằng hình ảnh."],
    en: ["Mystery box", "Open a box and solve a picture clue."],
  },
] as const;

const labels = {
  vi: {
    title: "Trò chơi",
    intro: "Luyện nghe và ôn từ vựng cùng Ong Vàng.",
    play: "Chơi game",
    choose: "Chọn trò chơi",
    close: "Đóng hộp chọn trò chơi",
  },
  en: {
    title: "Games",
    intro: "Practice listening and vocabulary with Busy Bee.",
    play: "Play games",
    choose: "Choose a game",
    close: "Close game chooser",
  },
};

export function GameChooser({ locale, letter }: { locale: Locale; letter: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const copy = labels[locale];

  return (
    <section className={styles.section} id={lessonGamesId} aria-labelledby="lesson-games-title">
      <div className={styles.heading}>
        <span className={styles.badge}><ActivityIcon name="videogame_asset" /></span>
        <div>
          <h2 id="lesson-games-title">{copy.title}</h2>
          <p>{copy.intro}</p>
        </div>
      </div>
      <button className={styles.play} type="button" aria-haspopup="dialog" aria-controls="game-chooser"
        onClick={(event) => {
          event.currentTarget.focus({ preventScroll: true });
          dialog.current?.showModal();
        }}>
        {copy.play} <ActivityIcon name="arrow_forward" />
      </button>

      <dialog id="game-chooser" ref={dialog} className={styles.dialog} aria-labelledby="game-chooser-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}>
        <div className={`${styles.dialogBody} ${motion.pop}`}>
          <h2 id="game-chooser-title">{copy.choose}</h2>
          <button className={styles.close} type="button" aria-label={copy.close} onClick={() => dialog.current?.close()}>
            <span aria-hidden="true">×</span>
          </button>
          <ul className={styles.choices}>
            {choices.map((game) => {
              const [title, description] = game[locale];
              const href = game.href === miniGamePath ? `${miniGamePath}?letter=${letter}` : game.href;

              return (
                <li key={game.href}>
                  <Link href={href} className={styles.choice} data-theme={game.theme} onNavigate={() => dialog.current?.close()}>
                    <span className={styles.choiceIcon} aria-hidden="true">{game.icon}</span>
                    <div><strong>{title}</strong><p>{description}</p></div>
                    <ActivityIcon name="arrow_forward" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </dialog>
    </section>
  );
}
