import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { createLoader } from './helpers/load-learning.mjs';

test('session resolves canonical Bee account and rejects tampered or malformed expiry', async () => {
  const secret = 'isolated-session-test-secret';
  const previous = process.env.BEE_SESSION_SECRET;
  process.env.BEE_SESSION_SECRET = secret;
  let token;
  const session = createLoader({
    'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) },
    'next/server': { connection: async () => {} },
  })('app/login/session.ts');
  try {
    assert.equal(typeof session.getSessionAccount, 'function');
    const signed = (username, expiry) => {
      const payload = `${Buffer.from(username).toString('base64url')}.${expiry}`;
      return `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
    };
    assert.equal(await session.getSessionAccount(), null);
    token = signed('bee', Date.now() + 60000);
    assert.equal((await session.getSessionAccount()).username, 'bee');
    assert.equal(await session.getDisplayName(), (await session.getSessionAccount()).displayName);
    for (const invalid of [token + 'x', signed('bee', 1), signed('bee', 'NaN'), signed('bee', 'Infinity'), signed('unknown', Date.now() + 60000)]) {
      token = invalid;
      assert.equal(await session.getSessionAccount(), null);
    }
  } finally {
    if (previous === undefined) delete process.env.BEE_SESSION_SECRET;
    else process.env.BEE_SESSION_SECRET = previous;
  }
});

test('session expiry waits for a real request even when cookies resolve during prerendering', async (t) => {
  const previous = process.env.BEE_SESSION_SECRET;
  const secret = 'request-time-session-test-secret';
  process.env.BEE_SESSION_SECRET = secret;
  let connected = false;
  const now = Date.now();
  const payload = `${Buffer.from('bee').toString('base64url')}.${now + 60000}`;
  const token = `${payload}.${createHmac('sha256', secret).update(payload).digest('base64url')}`;
  const session = createLoader({
    'next/headers': { cookies: async () => ({ get: () => ({ value: token }) }) },
    'next/server': { connection: async () => { connected = true; } },
  })('app/login/session.ts');
  const clock = t.mock.method(Date, 'now', () => {
    assert.equal(connected, true, 'Expiry must not read the clock during prerendering');
    return now;
  });
  try {
    assert.equal((await session.getSessionAccount()).username, 'bee');
  } finally {
    clock.mock.restore();
    if (previous === undefined) delete process.env.BEE_SESSION_SECRET;
    else process.env.BEE_SESSION_SECRET = previous;
  }
});

test('unconfigured local sessions survive separate page/API bundles and module reloads', async () => {
  const previous = process.env.BEE_SESSION_SECRET;
  delete process.env.BEE_SESSION_SECRET;
  let token;
  const mocks = {
    'next/headers': { cookies: async () => ({
      get: () => token ? { value: token } : undefined,
      set: (_name, value) => { token = value; },
    }) },
    'next/server': { connection: async () => {} },
  };
  try {
    const login = createLoader(mocks)('app/login/session.ts');
    const api = createLoader(mocks)('app/login/session.ts');
    await login.startSession('bee');
    assert.equal((await api.getSessionAccount())?.username, 'bee');
    const reloadedPage = createLoader(mocks)('app/login/session.ts');
    assert.equal((await reloadedPage.getSessionAccount())?.username, 'bee');
    await api.endSession();
    assert.equal(await reloadedPage.getSessionAccount(), null);
  } finally {
    if (previous === undefined) delete process.env.BEE_SESSION_SECRET;
    else process.env.BEE_SESSION_SECRET = previous;
  }
});
