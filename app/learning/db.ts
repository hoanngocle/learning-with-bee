import 'server-only';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

export function migrateLearningDb(db: DatabaseSync) {
  db.exec(readFileSync(path.join(process.cwd(), 'app/learning/schema.sql'), 'utf8'));
}
export function openLearningDb(filePath: string) {
  if (filePath !== ':memory:') mkdirSync(path.dirname(path.resolve(filePath)), { recursive: true });
  const db = new DatabaseSync(filePath);
  db.exec('PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL;');
  withTransaction(db, () => migrateLearningDb(db));
  return db;
}
export function withTransaction<T>(db: DatabaseSync, work: () => T): T {
  db.exec('BEGIN IMMEDIATE');
  try { const result = work(); db.exec('COMMIT'); return result; }
  catch (error) { db.exec('ROLLBACK'); throw error; }
}
let database: DatabaseSync | undefined;
export function getLearningDb() {
  if (!database) {
    const configuredPath = process.env.BEE_DATABASE_PATH;
    if (process.env.NODE_ENV === 'production' && (!configuredPath || !process.env.BEE_SESSION_SECRET)) {
      throw new Error('Set BEE_DATABASE_PATH and BEE_SESSION_SECRET before enabling learner storage in production.');
    }
    database = openLearningDb(configuredPath || path.join(process.cwd(), '.data/learning.sqlite'));
  }
  return database;
}
