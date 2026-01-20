DROP TABLE IF EXISTS question_tags;

CREATE TABLE question_tags (
  question_id INTEGER PRIMARY KEY,
  tags TEXT NOT NULL DEFAULT '[]',

  FOREIGN KEY(question_id)
    REFERENCES questions(id)
    ON DELETE CASCADE
);

CREATE TRIGGER IF NOT EXISTS create_question_tags_after_question_insert
AFTER INSERT ON questions
FOR EACH ROW
BEGIN
  INSERT INTO question_tags (question_id, tags)
  VALUES (NEW.id, '[]');
END;
