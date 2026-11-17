import type { Metadata } from "next";
import { LevelSelection } from "./level-selection";

export const metadata: Metadata = {
  title: "Oxford Phonics World · Learning With Bee",
  description: "Khám phá 5 cấp độ phát âm tiếng Anh của Oxford Phonics World.",
};

export default function OxfordPhonicsWorld() {
  return <LevelSelection />;
}
