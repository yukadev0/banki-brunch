CREATE TABLE question_votes (
  question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote'))
);

CREATE TABLE answer_votes (
  answer_id INTEGER NOT NULL REFERENCES answers (id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user (id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('upvote', 'downvote'))
);

CREATE TABLE tags (
  name TEXT PRIMARY KEY
);