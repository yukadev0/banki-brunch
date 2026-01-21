DROP TABLE IF EXISTS answer_votes;

CREATE TABLE answer_votes (
  answer_id INTEGER NOT NULL,
  question_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  vote_type TEXT NOT NULL CHECK(vote_type IN ('upvote', 'downvote')),

  FOREIGN KEY (user_id)
    REFERENCES user(id)
    ON DELETE CASCADE

  FOREIGN KEY (answer_id)
    REFERENCES answers(id)
    ON DELETE CASCADE

  FOREIGN KEY (question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE
);