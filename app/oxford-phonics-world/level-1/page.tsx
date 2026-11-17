import type { Metadata } from "next";
import { LevelDetail } from "./level-detail";

export const metadata: Metadata = {
  title: "Level 1: The Alphabet · Learning With Bee",
  description: "Học 26 chữ cái tiếng Anh, nghe từ vựng và chọn trò chơi cùng Ong Vàng.",
};

export default function AlphabetPage() {
  return <LevelDetail />;
}
