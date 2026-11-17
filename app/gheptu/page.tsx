import type { Metadata } from "next";
import { WordGame } from "./word-game";

export const metadata: Metadata = {
  title: "Ghép từ · Learning With Bee",
  description: "Sắp xếp các chữ cái để khám phá từ vựng chủ đề bữa sáng.",
};

export default function WordGamePage() {
  return <WordGame />;
}
