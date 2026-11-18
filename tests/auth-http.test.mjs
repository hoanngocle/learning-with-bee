import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { test } from "node:test";
import { setTimeout as delay } from "node:timers/promises";

// Run against a production build, with an isolated session key and no real credentials.
test("authenticated users leave login, and header logout clears the cookie and opens login", async () => {
  const listener = createServer();
  await new Promise((resolve) => listener.listen(0, "127.0.0.1", resolve));
  const port = listener.address().port;
  await new Promise((resolve) => listener.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const secret = randomBytes(32).toString("hex");
  const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--port", String(port)], {
    env: { ...process.env, BEE_SESSION_SECRET: secret },
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  });
  let output = "";
  server.stdout.on("data", (data) => { output += data.toString(); });
  server.stderr.on("data", (data) => { output += data.toString(); });

  try {
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) throw new Error("Test server exited before startup");
      try {
        const response = await fetch(origin);
        await response.text();
        if (response.ok) { ready = true; break; }
      } catch { /* Wait for the local server. */ }
      await delay(100);
    }
    assert.ok(ready, `Test server starts: ${output}`);

    const guestLogin = await (await fetch(`${origin}/login`)).text();
    assert.match(guestLogin, /id="login-username"/);
    assert.doesNotMatch(guestLogin, /class="site-header"/);
    const guestHome = await (await fetch(origin)).text();
    assert.match(guestHome, /aria-label="Đăng nhập"/);
    assert.doesNotMatch(guestHome, /aria-label="Đăng xuất"/);

    const [account] = JSON.parse(readFileSync(new URL("../app/login/accounts.json", import.meta.url), "utf8"));
    const payload = `${Buffer.from(account.username).toString("base64url")}.${Date.now() + 60_000}`;
    const signature = createHmac("sha256", secret).update(payload).digest("base64url");
    const cookie = `bee_session=${payload}.${signature}`;
    const loginResponse = await fetch(`${origin}/login`, { headers: { cookie }, redirect: "manual" });
    const loginHtml = await loginResponse.text();
    assert.ok(loginResponse.headers.get("location") === "/" || /NEXT_REDIRECT;replace;\/;307;/.test(loginHtml),
      "Opening login with a valid session redirects to home");
    assert.doesNotMatch(loginHtml, /id="login-username"/);

    const home = await (await fetch(origin, { headers: { cookie } })).text();
    assert.match(home, /aria-label="Đăng xuất"/);
    assert.doesNotMatch(home, /aria-label="Đăng nhập"/);
    const action = home.match(/name="(\$ACTION_ID_[^"]+)"/);
    assert.ok(action, "Header renders a logout form");
    const form = new FormData();
    form.set(action[1], "");
    const logout = await fetch(origin, {
      method: "POST", headers: { cookie, origin }, body: form, redirect: "manual",
    });
    await logout.text();
    assert.equal(logout.status, 303);
    assert.equal(logout.headers.get("location"), "/login");
    assert.match(logout.headers.get("set-cookie"), /bee_session=;/);
    assert.match(logout.headers.get("set-cookie"), /Max-Age=0/i);
    const signedOutLogin = await (await fetch(`${origin}/login`)).text();
    assert.match(signedOutLogin, /id="login-username"/);
  } finally {
    server.kill();
    await new Promise((resolve) => {
      if (server.exitCode !== null) resolve();
      else server.once("exit", resolve);
    });
  }
});
