DROP TABLE IF EXISTS answers;
CREATE TABLE answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  question_id INTEGER NOT NULL,

  content TEXT NOT NULL,

  created_by_user_id INTEGER,

  is_validated INTEGER NOT NULL DEFAULT 0,
  validated_by_user_id INTEGER,

  is_hidden_by_default INTEGER NOT NULL DEFAULT 1,

  created_at INTEGER NOT NULL,

  FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE,

  FOREIGN KEY (created_by_user_id)
    REFERENCES users(id),

  FOREIGN KEY (validated_by_user_id)
    REFERENCES users(id)
);

