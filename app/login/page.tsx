import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginPanel } from "./login-panel";
import { getDisplayName } from "./session";
import styles from "./login.module.css";

export const metadata: Metadata = {
  title: "Đăng nhập · Learning With Bee",
};

async function AccountPanel() {
  const displayName = await getDisplayName();
  if (displayName !== null) redirect("/");
  return <LoginPanel />;
}

export default function LoginPage() {
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <span className={styles.mascot} aria-hidden="true">🐝</span>
        <Suspense>
          <AccountPanel />
        </Suspense>
      </div>
    </main>
  );
}
