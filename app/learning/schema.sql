CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY);
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS learner_profiles (
 user_id TEXT PRIMARY KEY REFERENCES users(id), total_xp INTEGER NOT NULL DEFAULT 0 CHECK(total_xp>=0),
 stars INTEGER NOT NULL DEFAULT 0 CHECK(stars>=0), revision INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS word_progress (
 user_id TEXT NOT NULL REFERENCES users(id), word_id TEXT NOT NULL, seen_at TEXT NOT NULL, learned_at TEXT,
 PRIMARY KEY(user_id,word_id)
);
CREATE TABLE IF NOT EXISTS word_reviews (
 user_id TEXT NOT NULL REFERENCES users(id), word_id TEXT NOT NULL, local_date TEXT NOT NULL, reviewed_at TEXT NOT NULL,
 PRIMARY KEY(user_id,word_id,local_date)
);
CREATE TABLE IF NOT EXISTS resume_positions (
 user_id TEXT NOT NULL REFERENCES users(id), course_id TEXT NOT NULL, letter_id TEXT NOT NULL, word_id TEXT NOT NULL,
 updated_at TEXT NOT NULL, PRIMARY KEY(user_id,course_id)
);
CREATE TABLE IF NOT EXISTS attempts (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), activity_id TEXT NOT NULL,
 content_version INTEGER NOT NULL DEFAULT 1, rule_version INTEGER NOT NULL DEFAULT 1,
 status TEXT NOT NULL CHECK(status IN ('in_progress','completed','abandoned')),
 started_at TEXT NOT NULL, completed_at TEXT, bonus_bps_snapshot INTEGER NOT NULL,
 score INTEGER NOT NULL DEFAULT 0, duration_ms INTEGER, perfect INTEGER NOT NULL DEFAULT 0
);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_attempt ON attempts(user_id,activity_id) WHERE status='in_progress';
CREATE INDEX IF NOT EXISTS assessment_results ON attempts(activity_id,status,completed_at);
CREATE TABLE IF NOT EXISTS attempt_questions (
 attempt_id TEXT NOT NULL REFERENCES attempts(id), question_id TEXT NOT NULL, ordinal INTEGER NOT NULL,
 target_id TEXT NOT NULL, answered INTEGER NOT NULL DEFAULT 0, first_answer_correct INTEGER,
 solved_at TEXT, hint_count INTEGER NOT NULL DEFAULT 0, revealed INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(attempt_id,question_id)
);
CREATE TABLE IF NOT EXISTS answer_events (
 id TEXT PRIMARY KEY, attempt_id TEXT NOT NULL REFERENCES attempts(id), question_id TEXT NOT NULL,
 request_id TEXT NOT NULL, selected_id TEXT NOT NULL, correct INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS mutation_receipts (
 user_id TEXT NOT NULL REFERENCES users(id), request_id TEXT NOT NULL, operation TEXT NOT NULL,
 payload_hash TEXT NOT NULL, response_json TEXT NOT NULL, PRIMARY KEY(user_id,request_id)
);
CREATE TABLE IF NOT EXISTS reward_ledger (
 id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), source_key TEXT NOT NULL,
 kind TEXT NOT NULL CHECK(kind IN ('mastery','level_up')), base_xp INTEGER NOT NULL, bonus_bps INTEGER NOT NULL,
 xp_delta INTEGER NOT NULL CHECK(xp_delta>=0), stars_delta INTEGER NOT NULL CHECK(stars_delta>=0),
 level INTEGER, status TEXT NOT NULL CHECK(status IN ('pending','claimed')), created_at TEXT NOT NULL,
 claimed_at TEXT, celebration_seen INTEGER NOT NULL DEFAULT 0, UNIQUE(user_id,source_key)
);
CREATE TABLE IF NOT EXISTS user_achievements (
 user_id TEXT NOT NULL REFERENCES users(id), badge_id TEXT NOT NULL, unlocked_at TEXT NOT NULL, local_date TEXT NOT NULL,
 PRIMARY KEY(user_id,badge_id)
);
CREATE TABLE IF NOT EXISTS study_days (
 user_id TEXT NOT NULL REFERENCES users(id), local_date TEXT NOT NULL, PRIMARY KEY(user_id,local_date)
);
CREATE TABLE IF NOT EXISTS daily_completions (
 user_id TEXT NOT NULL REFERENCES users(id), activity_id TEXT NOT NULL, local_date TEXT NOT NULL,
 perfect INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(user_id,activity_id,local_date)
);
INSERT OR IGNORE INTO schema_migrations VALUES (1);
