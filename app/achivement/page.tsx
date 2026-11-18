import type { Metadata } from "next";
import { Achievements } from "./achievements";
import { Suspense } from "react";
import { LearningScreen } from "../learning/learning-screen";

export const metadata: Metadata = {
  title: "Thành tích của bé · Learning With Bee",
  description: "Khám phá hành trình học tập, những cột mốc và bộ sưu tập huy hiệu của bé cùng Ong Vàng và Kuromi.",
};

export default function AchievementPage() {
  return <Suspense fallback={<p>Đang tải thành tích…</p>}><LearningScreen screen={Achievements} /></Suspense>;
}
