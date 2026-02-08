import { drizzle } from "drizzle-orm/d1";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { ServerQuestionInfo } from "./types";

export class QuestionService {
  private db: ReturnType<typeof drizzle>;
  private askedQuestionIds: Set<number> = new Set();
  private _currentQuestion: ServerQuestionInfo | null = null;

  constructor(db: ReturnType<typeof drizzle>) {
    this.db = db;
  }

  get currentQuestion(): ServerQuestionInfo | null {
    return this._currentQuestion;
  }

  set currentQuestion(question: {
    id: number;
    title: string;
    content: string;
  }) {
    this._currentQuestion = {
      content: question.content,
      id: question.id,
      title: question.title,
    };
    this.askedQuestionIds.add(question.id);
  }

  hasAskedQuestion(id: number) {
    return this.askedQuestionIds.has(id);
  }

  getAskedQuestionIds() {
    return Array.from(this.askedQuestionIds);
  }

  resetAskedQuestions() {
    this.askedQuestionIds.clear();
  }

  clearCurrentQuestion() {
    this._currentQuestion = null;
  }

  async getRandomQuestion(preferredTags: string[] = []) {
    if (!this.db) {
      throw new Error("Database not configured");
    }

    const excludedIds = Array.from(this.askedQuestionIds);

    if (preferredTags.length === 0) {
      return await QuestionsRepository.getRandomExcluding(this.db, excludedIds);
    }

    return await QuestionsRepository.getByTags(
      this.db,
      preferredTags,
      excludedIds,
    );
  }

  async getRandomExcluding() {
    if (!this.db) {
      throw new Error("Database not configured");
    }

    return await QuestionsRepository.getRandomExcluding(
      this.db,
      Array.from(this.askedQuestionIds),
    );
  }
}
