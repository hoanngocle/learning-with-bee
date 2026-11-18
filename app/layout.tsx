import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource-variable/nunito-sans/wght.css";
import "./globals.css";
import { SiteShell } from "./site-shell";
import { AccountControls } from "./account-controls";

export const metadata: Metadata = {
  title: "Learning With Bee · Bé học tiếng Anh",
  description:
    "Cùng Ong Vàng và Kuromi khám phá tiếng Anh qua Oxford Phonics World và Let's Go English.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi">
      <body>
        <SiteShell accountControls={<Suspense><AccountControls /></Suspense>}>
          {children}
        </SiteShell>
      </body>
    </html>
  );
}
