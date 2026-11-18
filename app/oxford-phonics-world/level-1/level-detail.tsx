"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import motion from "../../game-motion.module.css";
import { phonicsPath } from "../../home-content";
import { useLocale } from "../../site-shell";
import { useEnglishSpeech } from "../../use-english-speech";
import { SelectionIcon } from "../selection-icon";
import { GameChooser } from "./game-chooser";
import { alphabet, lessonContent } from "./lesson-content";
import styles from "./level-detail.module.css";
import { learningLetters } from "../../learning/catalog";
import { useLearner } from "../../learning/use-learner";
import { SaveStatus } from "../../learning/save-status";
import type { LearnerSnapshot } from "../../learning/types";

const levelTitle = "Level 1: The Alphabet";
type PronunciationControl = "art" | "listen" | "slow";

export function LevelDetail({ initialSnapshot = null }: { initialSnapshot?: LearnerSnapshot | null }) {
  const learner = useLearner(initialSnapshot);
  const resumeLetter = Math.max(0, learningLetters.findIndex(l => l.id === initialSnapshot?.resume?.letterId));
  const resumeWord = Math.max(0, learningLetters[resumeLetter].words.findIndex(w => w.id === initialSnapshot?.resume?.wordId));
  const locale = useLocale();
  const copy = lessonContent[locale];
  const [letterIndex, setLetterIndex] = useState(resumeLetter);
  const [wordIndex, setWordIndex] = useState(resumeWord);
  const [explored, setExplored] = useState(() => new Set<number>());
  const [audioCue, setAudioCue] = useState<{ control: PronunciationControl; sequence: number }>();
  const { speak, stop, audioError } = useEnglishSpeech();
  const { letter, words } = alphabet[letterIndex];
  const { word, emoji, meaning, phonetic, image } = words[wordIndex];
  const letterPair = `${letter} ${letter.toLowerCase()}`;
  // X is practiced at the end of “fox”.
  const focusIndex = word.toLowerCase().indexOf(letter.toLowerCase());
  const listenCue = audioCue?.control === "listen" ? audioCue.sequence : 0;
  const slowCue = audioCue?.control === "slow" ? audioCue.sequence : 0;
  const activeWord = learningLetters[letterIndex].words[wordIndex];
  const saving = learner.status === "saving";
  const learned = learner.snapshot?.learnedWordIds.includes(activeWord.id);
  const reviewed = learner.snapshot?.reviewedTodayWordIds.includes(activeWord.id);

  function selectLetter(index: number) {
    setLetterIndex(index);
    setWordIndex(0);
    setExplored((previous) => previous.has(index) ? previous : new Set(previous).add(index));
    setAudioCue(undefined);
    stop();
    if (learner.snapshot) void learner.send("markWord", { wordId: learningLetters[index].words[0].id, state: "seen" });
  }

  function selectWord(index: number) {
    setWordIndex(index);
    setAudioCue(undefined);
    speak(words[index].word);
    if (learner.snapshot) void learner.send("markWord", { wordId: learningLetters[letterIndex].words[index].id, state: "seen" });
  }

  function pronounce(control: PronunciationControl, rate?: number) {
    setAudioCue((previous) => ({ control, sequence: (previous?.sequence ?? 0) + 1 }));
    speak(word, rate);
  }

  return (
    <main className={`page-width ${styles.detail}`}>
      <div className={styles.topBar}>
        <nav aria-label={copy.breadcrumb}>
          <ol className={styles.trail}>
            <li><Link href={phonicsPath}>Oxford Phonics World</Link></li>
            <li aria-hidden="true">›</li>
            <li className={styles.trailCurrent} aria-current="page" lang="en">{levelTitle}</li>
          </ol>
        </nav>
        <p className={styles.progress}>
          <span className={styles.progressDot} aria-hidden="true"><span className={motion.ping} key={explored.size} /></span>
          {copy.progress(learner.snapshot?.seenLetterIds.length ?? explored.size)} <span aria-hidden="true">⭐</span>
        </p>
      </div>
      <SaveStatus signedIn={!!learner.snapshot} status={learner.status} message={learner.message} retry={learner.retry} />
      {learner.snapshot && <p>{learner.snapshot.learnedWordIds.length}/101 từ đã học · {learner.snapshot.completedLetterIds.length}/26 chữ hoàn thành · ⭐ {learner.snapshot.profile.stars}</p>}

      <section className={styles.vocabulary} aria-labelledby="vocabulary-title" id="vocabulary-card">
        <div className={styles.vocabHeader}>
          <div className={styles.vocabHeading}>
            <span className={styles.schoolIcon} aria-hidden="true">🎓</span>
            <div>
              <p className={styles.caption}>Oxford Phonics World 1</p>
              <h1 id="vocabulary-title">{copy.vocabulary}: <span lang="en">{letterPair}</span></h1>
            </div>
          </div>
          <p className={`${styles.pill} ${styles.vocabCount}`}>
            <span className={`${styles.progressDot} ${motion.pulse}`} aria-hidden="true" key={letter} />{copy.letter} {letterIndex + 1} / {alphabet.length}
          </p>
        </div>

        <div className={styles.flashcard}>
          <button className={styles.art} type="button" aria-label={`${copy.listen}: ${word}`} onClick={() => pronounce("art")}>
            <span className={styles.artTop} aria-hidden="true"><strong>{letterPair}</strong><span className={motion.spin}>✨</span></span>
            <span className={`${styles.artFrame} ${motion.pop}`} aria-hidden="true" key={word}>
              {image ? <Image className={styles.wordImage} src={image} alt="" width={240} height={240} sizes="240px" /> : emoji}
            </span>
          </button>

          <div className={styles.flashcardCopy}>
            <div aria-live="polite" aria-atomic="true">
              <div className={motion.pop} key={word}>
                <p className={styles.wordLine} lang="en">
                  <strong>{word.slice(0, focusIndex)}<span>{word[focusIndex]}</span>{word.slice(focusIndex + 1)}</strong>
                  <span>{phonetic}</span>
                </p>
                <p className={styles.meaning}>{copy.meaning}: <strong lang="vi">{meaning}</strong></p>
              </div>
            </div>
            <div className={styles.audioActions}>
              <button className={`${styles.control} ${styles.listen}`} type="button" disabled={!learner.snapshot || saving || reviewed}
                onClick={() => void learner.send("markWord", { wordId: activeWord.id, state: "learned" })}>
                {reviewed ? "✓ Đã ôn hôm nay" : learned ? "Ôn lại từ này" : "Đã học từ này"}
              </button>
              <button className={`${styles.control} ${styles.listen}`} type="button" onClick={() => pronounce("listen")}>
                <span className={listenCue ? styles.audioCue : undefined} key={listenCue} aria-hidden="true">🔊</span> {copy.listen}
              </button>
              <button className={`${styles.control} ${styles.slow}`} type="button" onClick={() => pronounce("slow", 0.55)}>
                <span className={`${styles.audioIcon} ${slowCue ? styles.audioCue : ""}`} key={slowCue}>
                  <SelectionIcon name="play_circle" size={20} />
                </span>
                {copy.slow}
              </button>
            </div>
            {audioError && (
              <p className={styles.audioError} role="status">
                {copy.audioUnavailable}
              </p>
            )}
            <div className={styles.wordPicker}>
              <p className={styles.wordProgress} aria-live="polite">{copy.wordProgress(wordIndex + 1, words.length)}</p>
              <div className={styles.wordGrid} role="group" aria-label={copy.wordsForLetter(letter)}>
                {words.map((item, index) => (
                  <button className={styles.wordTile} key={item.word} type="button" disabled={saving} aria-pressed={index === wordIndex} onClick={() => selectWord(index)}>
                    {item.image ? (
                      <Image className={styles.wordThumbnail} src={item.image} alt="" width={80} height={80} sizes="80px" />
                    ) : <span className={styles.wordEmoji} aria-hidden="true">{item.emoji}</span>}
                    <strong lang="en">{item.word}</strong>
                    <span lang="vi">{item.meaning}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.vocabNavigation}>
              <button className={styles.control} type="button" disabled={saving || letterIndex === 0} onClick={() => selectLetter(letterIndex - 1)}>
                <span aria-hidden="true">‹</span> {copy.previous}
              </button>
              <button className={styles.control} type="button" disabled={saving || letterIndex === alphabet.length - 1} onClick={() => selectLetter(letterIndex + 1)}>
                {copy.next} <span aria-hidden="true">›</span>
              </button>
            </div>
          </div>
        </div>
        <div className={styles.letterPicker}>
          <p id="letter-instructions">{copy.intro}</p>
          <div className={styles.letterGrid} role="group" aria-labelledby="letter-instructions">
            {alphabet.map((item, index) => (
              <button
                className={styles.letterTile}
                key={item.letter}
                type="button"
                disabled={saving}
                lang="en"
                aria-pressed={index === letterIndex}
                onClick={() => {
                  selectLetter(index);
                  speak(`${item.letter}, ${item.word}`);
                }}
              >
                {index === letterIndex && <span className={`${styles.selectedMark} ${motion.bounce}`} aria-hidden="true">✓</span>}
                <span className={styles.uppercase}>{item.letter}</span>
                <span className={styles.tileEmoji} aria-hidden="true">
                  {item.image ? <Image className={styles.letterImage} src={item.image} alt="" width={48} height={48} sizes="48px" /> : item.emoji}
                </span>
                <span className={styles.tileWord}>{item.word}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <GameChooser locale={locale} letter={letter} />
    </main>
  );
}
