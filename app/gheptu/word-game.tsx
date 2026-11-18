"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ActivityIcon as Icon } from "../activity-icon";
import motion from "../game-motion.module.css";
import { lessonGamesPath } from "../oxford-phonics-world/level-1/game-paths";
import { speakEnglish } from "../speak-english";
import styles from "./word-game.module.css";

import { scrambleWords as words } from "../learning/game-content";
import { useGame, type GameInitial } from "../learning/use-game";
import { SaveStatus } from "../learning/save-status";

const celebrationEmojis = ["⭐", "🎉", "✨", "🐝", "🌟", "🎊", "⭐", "✨"];

export function WordGame(initial: GameInitial) {
  const game = useGame("opw.l1.scramble.breakfast", initial);
  const [round, setRound] = useState(() => Math.max(0, initial.initialAttempt?.questions.findIndex(q => !q.solved) ?? 0));
  const [placed, setPlaced] = useState<number[]>([]);
  const [localCorrect, setCorrect] = useState(false);
  const [localSolvedCount, setSolvedCount] = useState(0);
  const [localHints, setHints] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const [feedback, setFeedback] = useState<{ text: string; reward?: number }>();
  const celebration = useRef<HTMLDialogElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const { word, meaning, icon, letters } = words[round];
  const progress = game.attempt?.questions[round];
  const correct = game.signedIn ? !!progress?.solved : localCorrect;
  const solvedCount = game.signedIn ? game.attempt?.questions.filter(q => q.solved).length ?? 0 : localSolvedCount;
  const hints = game.signedIn ? Math.max(0, 2 - (progress?.hintCount ?? 0)) : localHints;
  const pending = game.status === "saving" || !game.ready;
  const tiles = [...letters];
  const attempt = placed.map((index) => tiles[index]).join("");
  const question = round + 1;
  const lastRound = round === words.length - 1;
  const score = game.signedIn ? game.attempt?.gameScore ?? 0 : solvedCount * 20;
  const time = [Math.floor(seconds / 60), seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");

  useEffect(() => {
    if (game.attempt?.status === "completed") return;
    const timer = window.setInterval(() => setSeconds((value) => game.attempt ? Math.max(0, Math.floor((Date.now() - Date.parse(game.attempt.startedAt)) / 1000)) : value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [game.attempt]);

  function updateTiles(next: number[]) {
    setPlaced(next);
    setFeedback(undefined);
  }

  async function useHint() {
    if (!hints || correct || pending) return;
    const mismatch = [...word].findIndex((letter, position) => letter !== attempt[position]);
    if (mismatch < 0) return;

    const prefix = placed.slice(0, mismatch);
    const tile = tiles.findIndex((letter, index) => letter === word[mismatch] && !prefix.includes(index));
    const applyHint = () => { updateTiles([...prefix, tile]); if (!game.signedIn) setHints(hints - 1); };
    if (game.signedIn) { if (progress) await game.assist(progress.id, "hint", applyHint); }
    else applyHint();
  }

  async function checkAnswer() {
    if (pending) return;
    if (placed.length !== word.length) {
      setFeedback({ text: "Bé hãy điền đủ các ô chữ nhé!" });
      return;
    }
    const result = game.signedIn && progress ? await game.answer(progress.id, attempt) : null;
    if (game.signedIn && !result) return;
    if (game.signedIn ? result?.feedback !== "correct" : attempt !== word) {
      setFeedback({ text: "Chưa đúng rồi, bé thử đổi thứ tự các chữ nhé!" });
      return;
    }
    const earnedPoints = game.signedIn ? (result!.snapshot.profile.stars - game.snapshot!.profile.stars) > 0 : solvedCount <= round;
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

  async function nextRound() {
    if (pending) return;
    if (lastRound && game.signedIn && !await game.restart()) return;
    replayWord();
    setRound(lastRound ? 0 : round + 1);
    if (lastRound) {
      setSolvedCount(0);
      setSeconds(0);
    }
  }

  async function fillExample() {
    if (pending) return;
    const indices: number[] = [];
    for (const letter of word) {
      indices.push(tiles.findIndex((tile, index) => tile === letter && !indices.includes(index)));
    }
    if (game.signedIn) { if (progress) await game.assist(progress.id, "reveal", () => updateTiles(indices)); }
    else updateTiles(indices);
  }

  const badgeProgress = solvedCount;
  const ready = placed.length === word.length;
  const retry = ready && !!feedback && !correct;

  return (
    <main className={`page-width ${styles.page}`} lang="vi">
      <SaveStatus signedIn={game.signedIn} status={game.status} message={game.message} retry={game.retry} />
      {game.attempt?.status === "completed" && <div className="learning-summary">🎉 Hoàn thành {words.length} từ! Điểm lượt này: {score}/160. ⭐ Tài khoản: {game.snapshot?.profile.stars}. Chơi lại không cấp lại thưởng nội dung.</div>}
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
          <span className={styles.question}><Icon name="flag" /> Câu {question} / {words.length}</span>
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
                disabled={pending || correct || placed.includes(index) || placed.length === word.length}
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
                disabled={pending || correct || placed[index] === undefined}
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
              <button className={`${styles.check} ${ready && !feedback ? motion.bounce : ""}`} type="button" disabled={pending} onClick={checkAnswer}>
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
              Bé hãy nghe từ, rồi chạm từng chữ cái để ghép. Nếu cần trợ giúp, dùng nút Gợi ý ở phía trên.
            </p>
            {round === 0 && (
              <ul className={styles.coachList}>
                <li><Icon name="check_circle" /> Chạm vào chữ đã đặt để thu hồi.</li>
                <li><Icon name="check_circle" /> Đáp án mẫu giúp luyện tập nhưng không được tính điểm.</li>
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
            <div><h2>Tiến trình lượt chơi</h2><p>Đã ghép đúng {badgeProgress}/{words.length} từ</p></div>
            <strong>{Math.round(badgeProgress / words.length * 100)}%</strong>
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
            <button className={styles.reset} type="button" disabled={pending} onClick={async () => {
              if (game.signedIn) { if (!await game.restart()) return; setRound(0); setSolvedCount(0); setSeconds(0); }
              replayWord();
            }}><Icon name="replay" /> {game.signedIn ? "Chơi lại cả bài" : "Xếp lại từ này"}</button>
            <button className={styles.check} type="button" onClick={nextRound}>{lastRound ? "Chơi lại" : "Câu tiếp theo"} <Icon name="arrow_forward" /></button>
          </div>
        </div>
      </dialog>
    </main>
  );
}
