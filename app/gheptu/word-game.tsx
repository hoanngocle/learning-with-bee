"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ActivityIcon as Icon } from "../activity-icon";
import motion from "../game-motion.module.css";
import { lessonGamesPath } from "../oxford-phonics-world/level-1/game-paths";
import { speakEnglish } from "../speak-english";
import styles from "./word-game.module.css";

const words = [
  { word: "BREAKFAST", meaning: "Bữa ăn sáng đầy năng lượng", icon: "🍽️", letters: "TERSKABFA" },
  { word: "PANCAKE", meaning: "Bánh xèo ngọt", icon: "🥞", letters: "AKEPNAC" },
  { word: "MILK", meaning: "Sữa tươi ngon", icon: "🥛", letters: "LKMI" },
  { word: "EGG", meaning: "Trứng ốp la", icon: "🍳", letters: "GEG" },
  { word: "TOAST", meaning: "Bánh mì nướng", icon: "🍞", letters: "STOAT" },
  { word: "APPLE", meaning: "Quả táo", icon: "🍎", letters: "PPAEL" },
  { word: "JUICE", meaning: "Nước ép trái cây", icon: "🧃", letters: "ECUJI" },
  { word: "BANANA", meaning: "Quả chuối", icon: "🍌", letters: "ANABNA" },
];

const celebrationEmojis = ["⭐", "🎉", "✨", "🐝", "🌟", "🎊", "⭐", "✨"];

export function WordGame() {
  const [round, setRound] = useState(0);
  const [placed, setPlaced] = useState<number[]>([]);
  const [correct, setCorrect] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);
  const [hints, setHints] = useState(2);
  const [seconds, setSeconds] = useState(102);
  const [feedback, setFeedback] = useState<{ text: string; reward?: number }>();
  const celebration = useRef<HTMLDialogElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const { word, meaning, icon, letters } = words[round];
  const tiles = [...letters];
  const attempt = placed.map((index) => tiles[index]).join("");
  const question = round + 3;
  const lastRound = round === words.length - 1;
  const score = 120 + solvedCount * 20;
  const time = [Math.floor(seconds / 60), seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  useEffect(() => {
    if (correct) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [correct]);

  function updateTiles(next: number[]) {
    setPlaced(next);
    setFeedback(undefined);
  }

  function useHint() {
    if (!hints || correct) return;
    const mismatch = [...word].findIndex((letter, position) => letter !== attempt[position]);
    if (mismatch < 0) return;

    const prefix = placed.slice(0, mismatch);
    const tile = tiles.findIndex((letter, index) => letter === word[mismatch] && !prefix.includes(index));
    updateTiles([...prefix, tile]);
    setHints(hints - 1);
  }

  function checkAnswer() {
    if (placed.length !== word.length) {
      setFeedback({ text: "Bé hãy điền đủ các ô chữ nhé!" });
      return;
    }
    if (attempt !== word) {
      setFeedback({ text: "Chưa đúng rồi, bé thử đổi thứ tự các chữ nhé!" });
      return;
    }
    const earnedPoints = solvedCount <= round;
    setCorrect(true);
    setSolvedCount(Math.max(solvedCount, round + 1));
    setFeedback(earnedPoints
      ? { text: `Chính xác! Bé đã ghép được từ ${word} và nhận 20 điểm. ⭐`, reward: 20 }
      : { text: `Chính xác! Bé đã ghép được từ ${word} một lần nữa. ⭐` });
    celebration.current?.showModal();
  }

  function replayWord() {
    celebration.current?.close();
    setCorrect(false);
    setHints(2);
    updateTiles([]);
  }

  function nextRound() {
    replayWord();
    setRound(lastRound ? 0 : round + 1);
    if (lastRound) {
      setSolvedCount(0);
      setSeconds(102);
    }
  }

  function fillExample() {
    const indices: number[] = [];
    for (const letter of word) {
      indices.push(tiles.findIndex((tile, index) => tile === letter && !indices.includes(index)));
    }
    updateTiles(indices);
  }

  const badgeProgress = Math.min(10, 7 + solvedCount);
  const ready = placed.length === word.length;
  const retry = ready && !!feedback && !correct;

  return (
    <main className={`page-width ${styles.page}`} lang="vi">
      <header className={styles.toolbar}>
        <div className={styles.heading}>
          <Link className={styles.back} href={lessonGamesPath} aria-label="Về mục Trò chơi">
            <Icon name="arrow_back" />
          </Link>
          <div>
            <div className={styles.unitLine}>
              <p className={styles.unit}>Unit 3: Yummy Morning</p>
              <span className={styles.unitDot} aria-hidden="true"><span className={motion.ping} /></span>
            </div>
            <h1>Trò Chơi Sắp Xếp Chữ Cái</h1>
          </div>
        </div>
        <div className={styles.stats}>
          <button className={styles.example} type="button" onClick={fillExample} disabled={correct}>
            <Icon name="auto_fix_high" /> Thử ghép đúng ngay
          </button>
          <span className={styles.question}><Icon name="flag" /> Câu {question} / 10</span>
          <span className={styles.points}><Icon name="stars" /> {score} điểm</span>
          <span className={styles.timer} aria-label={`Thời gian ${time}`}><Icon name="timer" /> {time}</span>
          <button className={styles.hint} type="button" onClick={useHint} disabled={!hints || correct || attempt === word}>
            <Icon name="lightbulb" /> Gợi ý: {hints}
          </button>
        </div>
      </header>

      <div className={styles.columns}>
        <section className={styles.board} aria-labelledby="word-instructions">
          <div className={styles.prompt}>
            <h2 id="word-instructions"><span>{question}</span> Bé hãy sắp xếp lại các chữ cái cho đúng nhé:</h2>
            <button className={styles.listen} type="button" onClick={() => speakEnglish(word.toLowerCase())}>
              <Icon name="volume_up" /> Nghe từ này
            </button>
          </div>

          <figure className={styles.clue}>
            {round === 0 ? (
              <span className={styles.collage} role="img" aria-label="Các món ăn sáng như bánh kếp, bánh mì nướng và sinh tố">
                {Array.from({ length: 9 }, (_, index) => (
                  <span key={index} className={styles.photo}>
                    <span style={{ backgroundPosition: `${index % 3 * 50}% ${Math.floor(index / 3) * 50}%` }} />
                  </span>
                ))}
              </span>
            ) : (
              <span className={`${styles.clueIcon} ${motion.pop}`} key={word} role="img" aria-label={meaning}>{icon}</span>
            )}
            <figcaption><Icon name="restaurant" /> Ý nghĩa: <strong>{meaning}</strong> ({word.length} chữ cái)</figcaption>
          </figure>

          <p className={styles.bankLabel}>Chạm vào chữ cái để đưa vào ô</p>
          <div className={styles.bank} aria-label="Các chữ cái để chọn">
            {tiles.map((letter, index) => (
              <button className={styles.tile} key={index} type="button"
                disabled={correct || placed.includes(index) || placed.length === word.length}
                data-used={placed.includes(index)}
                onClick={() => updateTiles([...placed, index])}>
                {letter}
              </button>
            ))}
          </div>

          <div className={`${styles.answer} ${retry ? motion.shake : ""}`} data-result={correct ? "correct" : retry ? "retry" : undefined}>
            <div className={styles.answerLabel}>
              <p>Từ hoàn chỉnh cần ghép</p>
              <small>Chạm vào chữ đã đặt để thu hồi</small>
            </div>
            <div className={styles.slots}>
              {tiles.map((_, index) => (
                <button key={index} className={styles.slot} type="button"
                  disabled={correct || placed[index] === undefined}
                  aria-label={placed[index] === undefined ? `Ô trống ${index + 1}` : `Thu hồi chữ ${tiles[placed[index]]} ở ô ${index + 1}`}
                  data-filled={placed[index] !== undefined}
                  onClick={() => updateTiles(placed.filter((_, position) => position !== index))}>
                  {placed[index] !== undefined && <span className={motion.pop} key={placed[index]}>{tiles[placed[index]]}</span>}
                </button>
              ))}
            </div>
          </div>

          <p className={`${styles.feedback} ${motion.pop}`} data-correct={correct} role="status" hidden={!feedback}>{feedback?.text}</p>
          <div className={styles.actions}>
            <button className={styles.reset} type="button" onClick={() => updateTiles([])} disabled={correct || !placed.length}>
              <Icon name="replay" /> Xếp lại từ đầu
            </button>
            {correct ? (
              <button ref={nextButton} className={styles.next} type="button" onClick={nextRound}>
                {lastRound ? "Chơi lại" : "Câu tiếp theo"} <Icon name="arrow_forward" />
              </button>
            ) : (
              <button className={`${styles.check} ${ready && !feedback ? motion.bounce : ""}`} type="button" onClick={checkAnswer}>
                <Icon name="task_alt" /> Kiểm tra kết quả
              </button>
            )}
          </div>
        </section>

        <aside className={styles.sidebar} aria-label="Gợi ý và từ vựng">
          <section className={styles.coach}>
            <div className={styles.coachTitle}>
              <span><Icon name="emoji_nature" /></span>
              <h2>Bạn Ong Vàng mách nhỏ</h2>
            </div>
            <p className={styles.coachTip}>
              Bé hãy bắt đầu bằng chữ <strong>{word[0]}</strong> và kết thúc bằng chữ <strong>{word.at(-1)}</strong>. Thử ghép chữ đầu tiên xem nào!
            </p>
            {round === 0 && (
              <ul className={styles.coachList}>
                <li><Icon name="check_circle" /> Gồm 2 âm tiết: BREAK + FAST</li>
                <li><Icon name="check_circle" /> Phiên âm quốc tế: <span>/ˈbrek.fəst/</span></li>
              </ul>
            )}
          </section>

          <section className={styles.vocabulary}>
            <div className={styles.vocabTitle}><h2>Từ vựng chủ đề Bữa Sáng</h2><span>3 từ</span></div>
            <ul>
              {words.slice(1, 4).map(({ word, meaning, icon }) => (
                <li key={word}>
                  <span aria-hidden="true">{icon}</span>
                  <div><strong lang="en">{word[0] + word.slice(1).toLowerCase()}</strong><small>{meaning}</small></div>
                  <button type="button" aria-label={`Nghe từ ${word.toLowerCase()}`} onClick={() => speakEnglish(word.toLowerCase())}>
                    <Icon name="volume_up" />
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className={styles.badge}>
            <span><Icon name="military_tech" /></span>
            <div><h2>Huy hiệu Nhà Thám Hiểm Từ</h2><p>Đã ghép đúng {badgeProgress}/10 từ hôm nay</p></div>
            <strong>{badgeProgress * 10}%</strong>
          </section>
        </aside>
      </div>

      <dialog className={styles.celebration} ref={celebration} aria-labelledby="word-celebration-title"
        onClose={() => nextButton.current?.focus({ preventScroll: true })}>
        <div className={styles.celebrationEffects} aria-hidden="true">
          {celebrationEmojis.map((emoji, index) => (
            <span key={index} style={{
              "--offset": `${10 + index * 11}%`,
              "--delay": `${(index % 4) * .17}s`,
            } as CSSProperties}>{emoji}</span>
          ))}
        </div>
        <div className={`${styles.celebrationCard} ${motion.pop}`}>
          <span className={`${styles.celebrationMedal} ${motion.bounce}`}><Icon name="military_tech" /></span>
          <h2 id="word-celebration-title">Bé đã ghép đúng từ!</h2>
          <p className={styles.celebrationWord} lang="en">{word}</p>
          {feedback?.reward && <p className={styles.reward}>⭐ +{feedback.reward} điểm</p>}
          <div className={styles.actions}>
            <button className={styles.reset} type="button" onClick={replayWord}><Icon name="replay" /> Xếp lại từ này</button>
            <button className={styles.check} type="button" onClick={nextRound}>{lastRound ? "Chơi lại" : "Câu tiếp theo"} <Icon name="arrow_forward" /></button>
          </div>
        </div>
      </dialog>
    </main>
  );
}
