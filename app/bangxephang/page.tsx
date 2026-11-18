import type { Metadata } from "next";
import { Leaderboard } from "./leaderboard";
import { Suspense } from "react";
import { getLearningContext } from "../learning/queries";
import { getLearningDb } from "../learning/db";
import { getLeaderboard } from "../learning/leaderboard";
import { connection } from "next/server";

export const metadata: Metadata = {
  title: "Bảng xếp hạng · Learning With Bee",
  description: "Kết quả bài kiểm tra Oxford Phonics World theo điểm và thời gian hoàn thành.",
};

export default function LeaderboardPage() {
  return <Suspense fallback={<p>Đang tải bảng xếp hạng…</p>}><RankingData /></Suspense>;
}
async function RankingData() {
  await connection();
  const context = await getLearningContext();
  const viewerId = context?.learner.id ?? null;
  const initialData = getLeaderboard(context?.db ?? getLearningDb(), { period: "week", level: 1, now: new Date(), viewerId });
  return <Leaderboard key={viewerId ?? "guest"} initialData={initialData} viewerId={viewerId} />;
}
