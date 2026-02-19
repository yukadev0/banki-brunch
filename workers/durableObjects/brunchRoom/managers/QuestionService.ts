import { drizzle } from "drizzle-orm/d1";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { BrunchRoom } from "../index";
import type { ServerQuestionInfo } from "../types";

export default class QuestionService {
  private m_brunchRoom: BrunchRoom;
  private m_db: ReturnType<typeof drizzle>;
  private m_askedQuestionIds: Set<number> = new Set();
  private m_currentQuestion: ServerQuestionInfo | null = null;

  constructor(brunchRoom: BrunchRoom, db: ReturnType<typeof drizzle>) {
    this.m_db = db;
    this.m_brunchRoom = brunchRoom;
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

  public async handleGetQuestion(server: WebSocket) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    const queueManager = this.m_brunchRoom.getQueueManager();
    const nextViewer = queueManager.getNextViewer();

    if (!nextViewer) {
      const question = await this.getRandomExcluding();

      if (question) {
        this.currentQuestion = question;
        const hintManager = this.m_brunchRoom.getHintManager();
        hintManager.clearHints();
        this.m_brunchRoom.broadcastQuestion(null, null);
      } else {
        this.m_brunchRoom.sendToClient(server, {
          type: "no_matching_question",
        });
      }
      return;
    }

    const question = await this.getRandomQuestion(nextViewer.preferredTags);

    if (question) {
      this.currentQuestion = question;
      const hintManager = this.m_brunchRoom.getHintManager();
      hintManager.clearHints();
      this.m_brunchRoom.notifyHintListToPresenter();
      this.m_brunchRoom.broadcastActiveHints();
      queueManager.advanceQueue();
      this.m_brunchRoom.broadcastQueueUpdate();
      this.m_brunchRoom.broadcastQuestion(nextViewer.id, nextViewer.name);
    } else {
      this.m_brunchRoom.sendToClient(server, { type: "no_matching_question" });
    }
  }

  public async handleSkipUser(server: WebSocket) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    const queueManager = this.m_brunchRoom.getQueueManager();
    queueManager.advanceQueue();
    this.m_brunchRoom.broadcastQueueUpdate();
    await this.handleGetQuestion(server);
  }

  public handleResetQuestions(server: WebSocket) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    this.resetAskedQuestions();
  }
}
