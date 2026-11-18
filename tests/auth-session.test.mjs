import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { test } from 'node:test';
import { createLoader } from './helpers/load-learning.mjs';

test('session resolves canonical Bee account and rejects tampered or malformed expiry', async () => {
  const secret = 'isolated-session-test-secret';
  const previous = process.env.BEE_SESSION_SECRET;
  process.env.BEE_SESSION_SECRET = secret;
  let token;
  const session = createLoader({ 'next/headers': { cookies: async () => ({ get: () => token ? { value: token } : undefined }) } })('app/login/session.ts');
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
