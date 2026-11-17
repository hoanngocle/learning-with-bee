"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Icon } from "../material-icon";
import { useLocale } from "../site-shell";
import { logIn, logOut } from "./actions";
import styles from "./login.module.css";

const translations = {
  vi: {
    title: "Đăng nhập",
    welcome: "Chào mừng bạn quay trở lại với Learning With Bee!",
    username: "Tên đăng nhập",
    usernamePlaceholder: "Nhập tên của bạn…",
    password: "Mật khẩu",
    passwordPlaceholder: "Nhập mật khẩu…",
    showPassword: "Hiện mật khẩu",
    hidePassword: "Ẩn mật khẩu",
    pending: "Đang đăng nhập…",
    required: "Bạn hãy nhập tên đăng nhập và mật khẩu.",
    invalid: "Tên đăng nhập hoặc mật khẩu chưa đúng.",
    greeting: (name: string) => `Chào ${name}!`,
    signedIn: "Bạn đã đăng nhập vào Learning With Bee.",
    home: "Về trang chủ",
    logOut: "Đăng xuất",
  },
  en: {
    title: "Log in",
    welcome: "Welcome back to Learning With Bee!",
    username: "Username",
    usernamePlaceholder: "Enter your username…",
    password: "Password",
    passwordPlaceholder: "Enter your password…",
    showPassword: "Show password",
    hidePassword: "Hide password",
    pending: "Logging in…",
    required: "Enter your username and password.",
    invalid: "The username or password is incorrect.",
    greeting: (name: string) => `Hi, ${name}!`,
    signedIn: "You’re logged in to Learning With Bee.",
    home: "Back to home",
    logOut: "Log out",
  },
};

export function LoginPanel({ displayName }: { displayName: string | null }) {
  const copy = translations[useLocale()];

  return (
    <>
      <div className={styles.intro}>
        <h1>{displayName === null ? copy.title : copy.greeting(displayName)}</h1>
        <p>{displayName === null ? copy.welcome : copy.signedIn}</p>
      </div>
      {displayName === null ? (
        <LoginForm copy={copy} />
      ) : (
        <form action={logOut} className={styles.form}>
          <Link href="/" className={styles.primary}>{copy.home}</Link>
          <button type="submit" className={styles.logout}>{copy.logOut}</button>
        </form>
      )}
    </>
  );
}

function LoginForm({ copy }: { copy: (typeof translations)["vi"] }) {
  const [state, action, pending] = useActionState(logIn, { username: "" });
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={action} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="login-username"><Icon name="person" />{copy.username}</label>
        <div className={styles.inputWrap}>
          <Icon name="account_circle" />
          <input
            id="login-username"
            name="username"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder={copy.usernamePlaceholder}
            defaultValue={state.username}
            maxLength={64}
            required
          />
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor="login-password"><Icon name="lock" />{copy.password}</label>
        <div className={styles.inputWrap}>
          <Icon name="key" />
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={copy.passwordPlaceholder}
            maxLength={128}
            required
          />
          <button
            type="button"
            className={styles.toggle}
            aria-label={showPassword ? copy.hidePassword : copy.showPassword}
            onClick={() => setShowPassword((visible) => !visible)}
          >
            <Icon name={showPassword ? "visibility_off" : "visibility"} />
          </button>
        </div>
      </div>

      {state.error && <p className={styles.error} role="alert">{copy[state.error]}</p>}
      <button type="submit" className={styles.primary} disabled={pending}>
        {pending ? copy.pending : copy.title}
      </button>
    </form>
  );
}
