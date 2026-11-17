import type { Metadata } from "next";
import { Leaderboard } from "./leaderboard";

export const metadata: Metadata = {
  title: "Bảng xếp hạng · Learning With Bee",
  description: "Khám phá bảng xếp hạng mẫu của năm cấp độ Oxford Phonics World.",
};

export default function LeaderboardPage() {
  return <Leaderboard />;
}
