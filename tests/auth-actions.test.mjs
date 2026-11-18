import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

function loadActions() {
  const calls = [];
  const session = {
    authenticate: async (username, password) =>
      username === "learner" && password === "valid-password" ? username : null,
    startSession: async (username) => calls.push(["start", username]),
    endSession: async () => calls.push(["end"]),
  };
  const source = readFileSync(new URL("../app/login/actions.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  const requireDependency = (name) => {
    if (name === "./session") return session;
    if (name === "next/navigation") return {
      redirect: (location) => { throw Object.assign(new Error("redirect"), { location }); },
    };
    throw new Error(`Unexpected dependency: ${name}`);
  };
  new Function("require", "exports", outputText)(requireDependency, exports);
  return { ...exports, calls };
}

function credentials(username, password) {
  const form = new FormData();
  form.set("username", username);
  form.set("password", password);
  return form;
}

test("successful login creates a session and redirects to home", async () => {
  const { logIn, calls } = loadActions();
  await assert.rejects(logIn({ username: "" }, credentials("learner", "valid-password")),
    (error) => error.location === "/");
  assert.deepEqual(calls, [["start", "learner"]]);
});

test("invalid login stays on the form without creating a session", async () => {
  const { logIn, calls } = loadActions();
  assert.deepEqual(await logIn({ username: "" }, credentials("learner", "wrong")),
    { username: "learner", error: "invalid" });
  assert.deepEqual(calls, []);
});

test("missing credentials stay on the form without creating a session", async () => {
  const { logIn, calls } = loadActions();
  assert.deepEqual(await logIn({ username: "" }, credentials("", "")),
    { username: "", error: "required" });
  assert.deepEqual(calls, []);
});

test("logout ends the session and redirects to login", async () => {
  const { logOut, calls } = loadActions();
  await assert.rejects(logOut(), (error) => error.location === "/login");
  assert.deepEqual(calls, [["end"]]);
});
