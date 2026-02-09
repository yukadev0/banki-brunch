import { drizzle } from "drizzle-orm/d1";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { ServerQuestionInfo } from "../types";

export default class QuestionService {
  private m_db: ReturnType<typeof drizzle>;
  private m_askedQuestionIds: Set<number> = new Set();
  private m_currentQuestion: ServerQuestionInfo | null = null;

  constructor(db: ReturnType<typeof drizzle>) {
    this.m_db = db;
  }

  public get currentQuestion(): ServerQuestionInfo | null {
    return this.m_currentQuestion;
  }

  public set currentQuestion(question: {
    id: number;
    title: string;
    content: string;
  }) {
    this.m_currentQuestion = {
      content: question.content,
      id: question.id,
      title: question.title,
    };
    this.m_askedQuestionIds.add(question.id);
  }

  public resetAskedQuestions() {
    this.m_askedQuestionIds.clear();
  }

  public clearCurrentQuestion() {
    this.m_currentQuestion = null;
  }

  public async getRandomQuestion(preferredTags: string[] = []) {
    if (!this.m_db) {
      throw new Error("Database not configured");
    }

    const excludedIds = Array.from(this.m_askedQuestionIds);

    if (preferredTags.length === 0) {
      return await QuestionsRepository.getRandomExcluding(
        this.m_db,
        excludedIds,
      );
    }

    return await QuestionsRepository.getByTags(
      this.m_db,
      preferredTags,
      excludedIds,
    );
  }

  public async getRandomExcluding() {
    if (!this.m_db) {
      throw new Error("Database not configured");
    }

    return await QuestionsRepository.getRandomExcluding(
      this.m_db,
      Array.from(this.m_askedQuestionIds),
    );
  }
}
