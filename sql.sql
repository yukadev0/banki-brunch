PRAGMA foreign_keys = ON;

-- Drop tables if they exist
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS questions;

-- Create questions table
CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'pending',
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  interview_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') * 1000 AS INTEGER)),

  FOREIGN KEY (created_by_user_id)
    REFERENCES user(id)
    ON DELETE CASCADE
);

-- Create answers table
CREATE TABLE answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_by_user_id TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  downvotes INTEGER NOT NULL DEFAULT 0,
  is_validated INTEGER NOT NULL DEFAULT 0,
  validated_by_user_id TEXT,
  is_hidden_by_default INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (CAST(strftime('%s','now') * 1000 AS INTEGER)),

  FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE,

  FOREIGN KEY (created_by_user_id)
    REFERENCES user(id),

  FOREIGN KEY (validated_by_user_id)
    REFERENCES user(id)
);

-- Optional indexes for performance
CREATE INDEX idx_answers_question_id ON answers(question_id);
CREATE INDEX idx_answers_created_by_user_id ON answers(created_by_user_id);
CREATE INDEX idx_answers_validated_by_user_id ON answers(validated_by_user_id);


PRAGMA foreign_keys = ON;

DROP TABLE IF EXISTS verification;
DROP TABLE IF EXISTS account;
DROP TABLE IF EXISTS session;
DROP TABLE IF EXISTS user;

CREATE TABLE user (
  id TEXT PRIMARY KEY,

  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,

  image TEXT,

  created_at INTEGER NOT NULL
    DEFAULT (CAST(unixepoch('subsecond') * 1000 AS INTEGER)),

  updated_at INTEGER NOT NULL
    DEFAULT (CAST(unixepoch('subsecond') * 1000 AS INTEGER))
);

CREATE TABLE session (
  id TEXT PRIMARY KEY,

  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,

  created_at INTEGER NOT NULL
    DEFAULT (CAST(unixepoch('subsecond') * 1000 AS INTEGER)),

  updated_at INTEGER NOT NULL,

  ip_address TEXT,
  user_agent TEXT,

  user_id TEXT NOT NULL,

  FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE
);

CREATE INDEX session_userId_idx ON session(user_id);

CREATE TABLE account (
  id TEXT PRIMARY KEY,

  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,

  user_id TEXT NOT NULL,

  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,

  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,

  scope TEXT,
  password TEXT,

  created_at INTEGER NOT NULL
    DEFAULT (CAST(unixepoch('subsecond') * 1000 AS INTEGER)),

  updated_at INTEGER NOT NULL,

  FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE
);

CREATE INDEX account_userId_idx ON account(user_id);

CREATE TABLE verification (
  id TEXT PRIMARY KEY,

  identifier TEXT NOT NULL,
  value TEXT NOT NULL,

  expires_at INTEGER NOT NULL,

  created_at INTEGER NOT NULL
    DEFAULT (CAST(unixepoch('subsecond') * 1000 AS INTEGER)),

  updated_at INTEGER NOT NULL
    DEFAULT (CAST(unixepoch('subsecond') * 1000 AS INTEGER))
);

CREATE INDEX verification_identifier_idx
  ON verification(identifier);
