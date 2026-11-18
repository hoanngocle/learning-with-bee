import type { Metadata } from "next";
import { WordGame } from "./word-game";
import { Suspense } from "react";
import { LearningScreen } from "../learning/learning-screen";

export const metadata: Metadata = {
  title: "Ghép từ · Learning With Bee",
  description: "Sắp xếp các chữ cái để khám phá từ vựng chủ đề bữa sáng.",
};

export default function WordGamePage() {
  return <Suspense fallback={<p>Đang tải trò chơi…</p>}><LearningScreen screen={WordGame} activityId="opw.l1.scramble.breakfast" /></Suspense>;
}
