import type { Metadata } from "next";
import { MysteryBox } from "./mystery-box";

export const metadata: Metadata = {
  title: "Mở hộp bí mật · Learning With Bee",
  description: "Chọn một hộp bí mật, nghe câu tiếng Anh và tìm bức tranh phù hợp.",
};

export default function MysteryBoxPage() {
  return <MysteryBox />;
}
