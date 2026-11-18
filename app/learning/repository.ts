import 'server-only';
import { randomUUID } from 'node:crypto';
import type { DatabaseSync, SQLInputValue } from 'node:sqlite';
import type { Learner } from './types';

export function row<T>(db: DatabaseSync, sql: string, ...parameters: SQLInputValue[]): T | undefined {
  const result=db.prepare(sql).get(...parameters);
  return result ? { ...result } as T : undefined;
}
export function rows<T>(db: DatabaseSync, sql: string, ...parameters: SQLInputValue[]): T[] {
  return db.prepare(sql).all(...parameters).map(result=>({ ...result })) as T[];
}
export function ensureLearner(db: DatabaseSync, account: { username: string; displayName: string }): Learner {
  const username = account.username.toLowerCase();
  const id = username === 'bee' ? 'usr_bee' : `usr_${randomUUID()}`;
  db.prepare('INSERT OR IGNORE INTO users(id,username,display_name,created_at) VALUES (?,?,?,?)')
    .run(id, username, account.displayName, new Date().toISOString());
  const user = row<Learner>(db, 'SELECT id,username,display_name AS displayName FROM users WHERE username=?', username)!;
  db.prepare('INSERT OR IGNORE INTO learner_profiles(user_id) VALUES (?)').run(user.id);
  return { ...user };
}
