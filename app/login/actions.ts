"use server";

import { redirect } from "next/navigation";
import { authenticate, endSession, startSession } from "./session";

export type LoginState = {
  username: string;
  error?: "required" | "invalid";
};

export async function logIn(_state: LoginState, formData: FormData): Promise<LoginState> {
  const usernameField = formData.get("username");
  const username = typeof usernameField === "string" ? usernameField.trim() : "";
  const password = formData.get("password");

  if (!username || typeof password !== "string" || !password) {
    return { username: username.slice(0, 64), error: "required" };
  }
  if (username.length > 64 || password.length > 128) {
    return { username: username.slice(0, 64), error: "invalid" };
  }

  const account = await authenticate(username, password);
  if (!account) return { username, error: "invalid" };

  await startSession(account);
  redirect("/login");
}

export async function logOut() {
  await endSession();
  redirect("/login");
}
