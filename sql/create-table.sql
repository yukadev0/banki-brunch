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
