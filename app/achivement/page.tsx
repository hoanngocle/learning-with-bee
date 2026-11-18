import type { Metadata } from "next";
import { Achievements } from "./achievements";

export const metadata: Metadata = {
  title: "Thành tích của bé · Learning With Bee",
  description: "Khám phá hành trình học tập, những cột mốc và bộ sưu tập huy hiệu của bé cùng Ong Vàng và Kuromi.",
};

export default function AchievementPage() {
  return <Achievements />;
}
