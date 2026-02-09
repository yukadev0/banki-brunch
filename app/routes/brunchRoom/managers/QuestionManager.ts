import type {
  ClientQuestionInfo,
  ServerMessage,
  UserId,
} from "workers/durableObjects/brunchRoom/types";
import type BrunchRoomApp from "../BrunchRoomApp";

export default class QuestionManager {
  private m_brunchApp: BrunchRoomApp;
  private m_forUserId: UserId | null = null;
  private m_currentQuestion: ClientQuestionInfo | null = null;

  constructor(brunchApp: BrunchRoomApp) {
    this.m_brunchApp = brunchApp;
  }

  public get forUserId(): UserId | null {
    return this.m_forUserId;
  }

  public setForUserId(userId: UserId | null) {
    this.m_forUserId = userId;
  }

  public get currentQuestion(): ClientQuestionInfo | null {
    return this.m_currentQuestion;
  }

  public setCurrentQuestion(question: ClientQuestionInfo | null) {
    this.m_currentQuestion = question;
  }

  public reset() {
    this.m_forUserId = null;
    this.m_currentQuestion = null;
  }

  public handleMessage(data: ServerMessage) {
    switch (data.type) {
      case "question":
        this.m_forUserId = null;
        this.m_currentQuestion = data.question;
        break;
      case "targeted_question":
        this.m_forUserId = data.userId;
        this.m_currentQuestion = data.question;
        break;
    }
  }
}
