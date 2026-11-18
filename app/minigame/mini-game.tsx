"use client";

import Link from "next/link";
import { useState } from "react";
import { ActivityIcon } from "../activity-icon";
import motion from "../game-motion.module.css";
import { lessonGamesPath } from "../oxford-phonics-world/level-1/game-paths";
import { getQuestion, lessonContent, questionCount } from "../oxford-phonics-world/level-1/lesson-content";
import { useLocale } from "../site-shell";
import { useEnglishSpeech } from "../use-english-speech";
import styles from "./mini-game.module.css";
import { useGame, type GameInitial } from "../learning/use-game";
import { SaveStatus } from "../learning/save-status";
import { alphabet } from "../oxford-phonics-world/level-1/lesson-content";

export function MiniGameLoading() {
  const locale = useLocale();
  return <p role="status">{locale === "vi" ? "Đang mở trò chơi…" : "Opening the game…"}</p>;
}

export function AlphabetMiniGame({ letterIndex, ...initial }: GameInitial & { letterIndex: number }) {
  const game = useGame(`opw.l1.quiz.${alphabet[letterIndex].letter.toLowerCase()}`, initial);
  const locale = useLocale();
  const copy = lessonContent[locale];
  const { speak, stop, audioLoading, audioError } = useEnglishSpeech();
  const [round, setRound] = useState(() => Math.max(0, initial.initialAttempt?.questions.findIndex(q => !q.solved) ?? 0));
  const [answer, setAnswer] = useState<string>();
  const { target, options } = getQuestion(letterIndex, round);
  const correct = game.signedIn ? !!game.attempt?.questions[round]?.solved : answer === target.word;
  const pending = game.status === "saving" || !game.ready;
  const lastRound = round === questionCount - 1;

  function changeRound(nextRound: number) {
    stop();
    setRound(nextRound);
    setAnswer(undefined);
  }

  return (
    <>
      <SaveStatus signedIn={game.signedIn} status={game.status} message={game.message} retry={game.retry} />
      {game.attempt?.status === "completed" && <div className="learning-summary">🎉 Hoàn thành {game.attempt.questionCount} câu! Điểm lượt này: {game.attempt.gameScore}/30. Sao tài khoản: {game.snapshot?.profile.stars}. Chơi lại để ôn, thưởng nội dung chỉ nhận một lần.</div>}
      <Link className={styles.back} href={lessonGamesPath}>
        <ActivityIcon name="arrow_back" /> {locale === "vi" ? "Về mục Trò chơi" : "Back to Games"}
      </Link>
      <section className={styles.game} aria-labelledby="game-title">
        <header className={styles.gameHeader}>
          <div className={styles.gameBadges}>
            <h1 className={styles.gameLabel} id="game-title">{copy.game}</h1>
            <span className={styles.pill}>{copy.reward}</span>
          </div>
          <p className={styles.round} aria-live="polite">{copy.question} {round + 1} / {questionCount}</p>
        </header>

        <div className={styles.gameCard}>
          <div className={`${styles.question} ${motion.pop}`} key={round}>
            <p className={styles.caption}>{copy.gameCaption}</p>
            <div className={styles.questionLine}>
              <h2 lang="en">Which one is <span className={styles.targetWord}>“{target.word}”</span>?</h2>
              <button
                className={styles.questionAudio}
                type="button"
                aria-label={copy.hearQuestion}
                onClick={() => speak(`Which one is ${target.word}?`)}
              >
                <ActivityIcon name="volume_up" />
              </button>
            </div>
            <p>{copy.gameIntro}</p>
          </div>

          <div className={styles.options}>
            {options.map(({ word, emoji, meaning }) => (
              <button
                key={word}
                className={`${styles.option} ${answer === word ? (correct ? motion.pop : motion.shake) : ""}`}
                type="button"
                aria-pressed={answer === word}
                aria-disabled={correct}
                data-result={answer === word ? (correct ? "correct" : "retry") : undefined}
                disabled={pending || correct}
                onClick={async () => {
                  if (correct) return;
                  if (game.signedIn) {
                    const result = await game.answer(game.attempt!.questions[round].id, word);
                    if (!result) return;
                  }
                  setAnswer(word);
                }}
              >
                <span className={styles.optionArt} aria-hidden="true">{emoji}</span>
                <strong lang="en">{word}</strong>
                <span className={styles.optionMeaning} lang="vi">{meaning}</span>
              </button>
            ))}
          </div>

          <p className={styles.feedback} data-correct={correct} role="status">
            {answer && (correct ? copy.correct : copy.retry)}
          </p>
          {(audioLoading || audioError) && (
            <p className={audioError ? styles.audioError : undefined} role="status">
              {audioLoading ? copy.audioLoading : copy.audioUnavailable}
            </p>
          )}

          <div className={styles.gameFooter}>
            {correct && <p className={`${styles.celebration} ${motion.bounce}`}>{copy.celebration}</p>}
            <div className={styles.gameActions}>
              <button className={`${styles.control} ${styles.replay}`} type="button" disabled={pending} onClick={async () => {
                if (game.signedIn && !await game.restart()) return;
                changeRound(0);
              }}>
                <ActivityIcon name="replay" /> {copy.replay}
              </button>
              <button
                className={`${styles.control} ${styles.advance}`}
                type="button"
                aria-disabled={!correct}
                disabled={pending || !correct}
                onClick={async () => {
                  if (correct) {
                    if (lastRound && game.signedIn && !await game.restart()) return;
                    changeRound(lastRound ? 0 : round + 1);
                  }
                }}
              >
                {lastRound ? copy.newRound : copy.nextQuestion} <ActivityIcon name="arrow_forward" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
