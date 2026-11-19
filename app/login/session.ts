import "server-only";

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { connection } from "next/server";
import accounts from "./accounts.json";

const COOKIE_NAME = "bee_session";
const SESSION_DURATION = 60 * 60 * 24 * 7;
const sessionRuntime = globalThis as typeof globalThis & { beeSessionSecret?: Buffer };
const deriveKey = promisify(scrypt);
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
} as const;

function equalBytes(left: Buffer, right: Buffer) {
  return left.length === right.length && timingSafeEqual(left, right);
}

function sign(payload: string) {
  // Share the local key across route bundles and development module reloads.
  const sessionSecret = process.env.BEE_SESSION_SECRET || (sessionRuntime.beeSessionSecret ??= randomBytes(32));
  return createHmac("sha256", sessionSecret).update(payload).digest("base64url");
}

export async function authenticate(username: string, password: string) {
  const account = accounts.find((entry) => entry.username.toLowerCase() === username.toLowerCase());
  const hash = await deriveKey(password, account?.salt ?? "", 64) as Buffer;

  if (!account || !equalBytes(hash, Buffer.from(account.passwordHash, "hex"))) return null;
  return account.username;
}

export async function startSession(username: string) {
  const encodedName = Buffer.from(username).toString("base64url");
  const payload = `${encodedName}.${Date.now() + SESSION_DURATION * 1000}`;
  (await cookies()).set(COOKIE_NAME, `${payload}.${sign(payload)}`, {
    ...cookieOptions,
    maxAge: SESSION_DURATION,
  });
}

export async function getSessionAccount() {
  // Development prerenders can resolve cookies; expiry still needs a real request.
  await connection();
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [encodedName, expires, signature, extra] = token.split(".");
  if (!encodedName || !expires || !signature || extra !== undefined) return null;

  const expected = sign(`${encodedName}.${expires}`);
  if (!Number.isFinite(Number(expires)) || !equalBytes(Buffer.from(expected), Buffer.from(signature)) || Number(expires) <= Date.now()) {
    return null;
  }

  const username = Buffer.from(encodedName, "base64url").toString();
  const account = accounts.find((account) => account.username === username);
  return account ? { username: account.username, displayName: account.displayName } : null;
}

export async function getDisplayName() {
  return (await getSessionAccount())?.displayName ?? null;
}

export async function endSession() {
  (await cookies()).set(COOKIE_NAME, "", { ...cookieOptions, maxAge: 0 });
}
