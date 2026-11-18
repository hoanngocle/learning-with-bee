import type { Metadata } from "next";
import { Suspense } from "react";
import { alphabet } from "../oxford-phonics-world/level-1/lesson-content";
import { AlphabetMiniGame, MiniGameLoading } from "./mini-game";
import styles from "./mini-game.module.css";
import { loadLearner } from "../learning/queries";

export const metadata: Metadata = {
  title: "Mini game chữ cái · Learning With Bee",
  description: "Nghe câu hỏi và chọn hình đúng để ôn từ vựng Oxford Phonics World.",
};

type SearchParams = Promise<{ letter?: string | string[] }>;

async function GameForLetter({ searchParams }: { searchParams: SearchParams }) {
  const { letter } = await searchParams;
  const selected = typeof letter === "string" ? letter.toUpperCase() : "A";
  const letterIndex = Math.max(0, alphabet.findIndex((item) => item.letter === selected));

  const data = await loadLearner(`opw.l1.quiz.${alphabet[letterIndex].letter.toLowerCase()}`);
  return <AlphabetMiniGame key={`${data.initialSnapshot?.learner.id ?? 'guest'}-${letterIndex}`} letterIndex={letterIndex} {...data} />;
}

export default function MiniGamePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <main className={`page-width ${styles.page}`}>
      <Suspense fallback={<MiniGameLoading />}>
        <GameForLetter searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
