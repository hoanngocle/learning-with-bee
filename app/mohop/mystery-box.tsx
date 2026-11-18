"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ActivityIcon as Icon } from "../activity-icon";
import motion from "../game-motion.module.css";
import { lessonGamesPath } from "../oxford-phonics-world/level-1/game-paths";
import { alphabetPath } from "../oxford-phonics-world/level-content";
import { speakEnglish } from "../speak-english";
import styles from "./mystery-box.module.css";

import { boxPictures as pictures, mysteryBoxes as boxes } from "../learning/game-content";
import { useGame, type GameInitial } from "../learning/use-game";
import { SaveStatus } from "../learning/save-status";



const choiceColors = ["green", "purple", "blue", "mint"];
type Picture = (typeof pictures)[number]["id"];

export function MysteryBox(initial: GameInitial) {
  const game = useGame("opw.l1.box.breakfast", initial);
  const [selected, setSelected] = useState(() => Math.max(0, initial.initialAttempt?.questions.findIndex(q => !q.solved) ?? 0));
  const [localOpened, setOpened] = useState<number[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [choice, setChoice] = useState<Picture>();
  const [showHint, setShowHint] = useState(false);
  const opened = game.signedIn ? game.attempt?.questions.flatMap((q, index) => q.solved ? [index] : []) ?? [] : localOpened;
  const pending = game.status === "saving" || !game.ready;
  const box = boxes[selected];
  const picture = pictures.find(({ id }) => id === box.answer);
  const solved = opened.includes(selected);
  const boxNumber = selected + 1;
  const next = [...boxes.keys()]
    .slice(selected + 1)
    .concat([...boxes.keys()].slice(0, selected))
    .find((index) => !opened.includes(index));
  const offset = (selected + 2) % pictures.length;
  const options = [...pictures.slice(offset), ...pictures.slice(0, offset)];
  const answered = game.attempt?.questions.filter(q => q.answered).length ?? 0;
  const accuracy = game.signedIn ? answered ? Math.round((game.attempt?.correctFirst ?? 0) / answered * 100) : 0 : opened.length + mistakes ? Math.round(opened.length / (opened.length + mistakes) * 100) : 0;

  function selectBox(index: number) {
    setSelected(index);
    setChoice(undefined);
    setShowHint(false);
  }

  async function choosePicture(id: Picture) {
    if (solved || pending) return;
    if (game.signedIn && !await game.answer(game.attempt!.questions[selected].id, id)) return;
    setChoice(id);
    if (id === box.answer) {
      setOpened((current) => [...current, selected]);
    } else {
      setMistakes((current) => current + 1);
    }
  }

  async function resetGame() {
    if (game.signedIn && !await game.restart()) return;
    setOpened([]);
    setMistakes(0);
    selectBox(0);
  }

  return (
    <main className={styles.page} lang="vi">
      <div className="page-width"><SaveStatus signedIn={game.signedIn} status={game.status} message={game.message} retry={game.retry} /></div>
      {game.attempt?.status === "completed" && <div className="learning-summary">🎉 Đã giải đủ {boxes.length} hộp! Điểm lượt này: {game.attempt.gameScore}/120. ⭐ Tài khoản: {game.snapshot?.profile.stars}.</div>}
      <div className={styles.strip}>
        <div className={`page-width ${styles.stripInner}`}>
          <nav className={styles.breadcrumb} aria-label="Đường dẫn">
            <Link href={alphabetPath}><Icon name="arrow_back" /> Level 1: Oxford Phonics</Link>
            <span aria-hidden="true">/</span>
            <Link href={lessonGamesPath}><Icon name="videogame_asset" /> Trò chơi</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Mở Hộp Bí Mật</span>
          </nav>
          <div className={styles.stats}>
            <span><Icon name="stars" /> Điểm <strong>{game.signedIn ? game.attempt?.gameScore ?? 0 : opened.length * 10}</strong></span>
            <span><Icon name="inventory_2" /> Đã mở <strong>{opened.length}/{boxes.length}</strong></span>
            <span><Icon name="verified" /> Tỉ lệ đúng <strong>{accuracy}%</strong></span>
          </div>
        </div>
      </div>

      <div className={`page-width ${styles.content}`}>
        <header className={styles.hero}>
          <span className={styles.gift} aria-hidden="true">🎁</span>
          <div className={styles.intro}>
            <div><h1>Trò Chơi Mở Hộp Bí Mật</h1><span>Unit 2: Ee &amp; Ff Phonics</span></div>
            <p>Bé hãy chọn một chiếc hộp, lắng nghe gợi ý và chạm vào bức tranh đúng để nhận sao thưởng nhé!</p>
          </div>
          <div className={styles.bee}><span aria-hidden="true">🐝</span><p><strong>Ong Vàng mách nhỏ!</strong> Bé có thể nghe lại câu hỏi trước khi chọn hình.</p></div>
        </header>

        <section aria-labelledby="box-grid-title">
          <div className={styles.sectionHeading}>
            <h2 id="box-grid-title">1. Lưới Hộp Bí Mật</h2>
            <p>Chọn một chiếc hộp để bắt đầu câu đố</p>
          </div>
          <div className={styles.boxes}>
            {boxes.map(({ sentence, color }, index) => {
              const isOpen = opened.includes(index);
              const isSelected = index === selected;
              return (
                <button key={index} className={styles.box} data-color={color} type="button"
                  aria-label={`Hộp số ${index + 1}${isOpen ? ", đã giải" : ""}`} aria-pressed={isSelected}
                  disabled={pending} onClick={() => selectBox(index)}>
                  {(isOpen || isSelected) && (
                    <span className={`${styles.boxTag} ${isSelected ? motion.bounce : ""}`}>{isOpen ? "Đúng" : "Đang mở"}</span>
                  )}
                  {isOpen
                    ? <><small lang="en">{sentence}</small><Icon name="check_circle" /></>
                    : <><strong>{index + 1}</strong><small>{isSelected ? "Thử thách" : "Chưa mở"}</small></>}
                </button>
              );
            })}
          </div>
        </section>

        <section className={styles.challenge} aria-labelledby="box-challenge-title">
          <div className={styles.sectionHeading}>
            <h2 id="box-challenge-title">2. Thử Thách Hộp Số {boxNumber}: Đoán Hình Cùng Ong Vàng</h2>
            <p className={styles.instruction}><Icon name="touch_app" /> Chạm vào hình vẽ chính xác</p>
          </div>
          <div className={styles.playArea}>
            <article className={styles.clue}>
              <div className={styles.clueHeader}>
                <span><Icon name="lock_open" /> Hộp Bí Mật #{String(boxNumber).padStart(2, "0")}</span>
                <button type="button" aria-label="Nghe câu gợi ý" onClick={() => speakEnglish(box.sentence)}><Icon name="volume_up" /></button>
              </div>
              <div className={`${styles.sentence} ${motion.pop}`} key={selected}>
                <p>Câu gợi ý tiếng Anh</p>
                <h3 lang="en">{box.sentence}</h3>
                <span>Dịch nghĩa: <strong>“{box.translation}”</strong></span>
              </div>
              <button className={styles.read} type="button" onClick={() => speakEnglish(box.sentence)}>
                <Icon name="record_voice_over" /> Nghe cô giáo đọc mẫu
              </button>
            </article>

            <div className={styles.options} aria-label="Các bức tranh có thể chọn">
              {options.map(({ id, label, caption }, index) => {
                const letter = "ABCD"[index];
                const result = solved && box.answer === id ? "correct" : choice === id ? "incorrect" : undefined;
                const animation = choice === id ? (solved ? motion.pop : motion.shake) : "";
                return (
                  <button key={id} type="button" className={`${styles.option} ${animation}`} data-color={choiceColors[index]}
                    data-result={result}
                    aria-label={`Đáp án ${letter}: ${caption}`} disabled={pending || solved} onClick={() => choosePicture(id)}>
                    <span className={styles.optionTitle}><strong>{letter}</strong><small lang="en">{label}</small></span>
                    <span className={styles.optionImage}>
                      <Image src={`/games/${id}.webp`} alt="" width={293} height={190} unoptimized />
                    </span>
                    <span className={styles.caption}>{caption}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div role="status" className={`${styles.feedback} ${solved ? motion.pop : ""}`} data-correct={solved} hidden={!solved && !choice}>
            {solved ? (
              <><strong>{choice ? "Chính xác rồi! Bé nhận được 10 điểm. ⭐" : "Bé đã giải đúng hộp này. ⭐"}</strong>
                <p>{box.sentence} — {picture?.caption}.</p></>
            ) : <><strong>Chưa đúng rồi, bé thử lại nhé!</strong><p>Nghe lại câu hỏi rồi chọn một bức tranh khác.</p></>}
          </div>
          <p id="bee-hint" className={`${styles.hint} ${motion.pop}`} role="status" hidden={!showHint}>🐝 {picture?.hint}</p>
          <div className={styles.actions}>
            <button className={styles.listen} type="button" onClick={() => speakEnglish(box.sentence)}><Icon name="volume_up" /> Nghe lại câu hỏi</button>
            <button className={styles.hintButton} type="button" disabled={pending || solved} aria-controls="bee-hint" aria-expanded={showHint} onClick={async () => {
              if (!showHint && game.signedIn) { await game.assist(game.attempt!.questions[selected].id, "hint", () => setShowHint(true)); return; }
              setShowHint(!showHint);
            }}>
              <span aria-hidden="true">🐝</span> Bạn Ong Vàng gợi ý
            </button>
            {next !== undefined ? (
              <button className={styles.next} type="button" onClick={() => selectBox(next)}>Đổi sang Hộp Số {next + 1} <Icon name="casino" /></button>
            ) : solved ? (
              <button className={styles.next} type="button" onClick={resetGame}>Chơi lại <Icon name="replay" /></button>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
