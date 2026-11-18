import type { Metadata } from "next";
import { MysteryBox } from "./mystery-box";
import { Suspense } from "react";
import { LearningScreen } from "../learning/learning-screen";

export const metadata: Metadata = {
  title: "Mở hộp bí mật · Learning With Bee",
  description: "Chọn một hộp bí mật, nghe câu tiếng Anh và tìm bức tranh phù hợp.",
};

export default function MysteryBoxPage() {
  return <Suspense fallback={<p>Đang tải trò chơi…</p>}><LearningScreen screen={MysteryBox} activityId="opw.l1.box.breakfast" /></Suspense>;
}
