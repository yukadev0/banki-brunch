CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  created_by_user_id INTEGER NOT NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);
