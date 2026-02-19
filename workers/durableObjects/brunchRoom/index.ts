import { DurableObject } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import HintManager from "./managers/HintManager";
import PollManager from "./managers/PollManager";
import QuestionService from "./managers/QuestionService";
import QueueManager from "./managers/QueueManager";
import ReactionManager from "./managers/ReactionManager";
import SessionManager from "./managers/SessionManager";
import type {
  ClientMessage,
  ClientQuestionInfo,
  Identify,
  RequestAddCustomHint,
  RequestCastVote,
  RequestDeleteHint,
  RequestReaction,
  RequestSetTagPreferences,
  RequestTagChange,
  RequestToggleHintVisibility,
  ServerMessage,
  UserInfo,
} from "./types";

export class BrunchRoom extends DurableObject<Env> {
  private m_pollManager: PollManager;
  private m_hintManager: HintManager;
  private m_queueManager: QueueManager;
  private m_sessionManager: SessionManager;
  private m_questionService: QuestionService;
  private m_reactionManager: ReactionManager;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    this.m_pollManager = new PollManager(this);
    this.m_sessionManager = new SessionManager(this);
    this.m_reactionManager = new ReactionManager(this);
    this.m_hintManager = new HintManager(this, env.question_ai);
    this.m_questionService = new QuestionService(
      this,
      drizzle(env.banki_brunch_db),
    );
    this.m_queueManager = new QueueManager(this);
  }

  public getPollManager() {
    return this.m_pollManager;
  }

  public getHintManager() {
    return this.m_hintManager;
  }

  public getSessionManager() {
    return this.m_sessionManager;
  }

  public getQuestionService() {
    return this.m_questionService;
  }

  public getQueueManager() {
    return this.m_queueManager;
  }

  async fetch(request: Request) {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    this.setupEventListeners(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private setupEventListeners(server: WebSocket) {
    server.addEventListener("message", (event) =>
      this.handleMessage(server, event),
    );
    server.addEventListener("close", (event) =>
      this.m_sessionManager.handleClose(server),
    );
    server.addEventListener("error", (error) =>
      this.m_sessionManager.handleError(server, error),
    );
  }

  private async handleMessage(server: WebSocket, event: MessageEvent) {
    try {
      const data = this.parseMessage(event.data);
      if (!data) return;

      switch (data.type) {
        case "identify":
          this.m_sessionManager.handleIdentify(server, data as Identify);
          break;
        case "request_toggle_lurking":
          this.m_sessionManager.handleToggleLurking(server);
          break;
        case "request_change_role":
          this.m_sessionManager.handleChangeRole(server);
          break;
        case "request_question":
          await this.m_questionService.handleGetQuestion(server);
          break;
        case "request_start_poll":
          this.m_pollManager.handleStartPoll(server);
          break;
        case "request_cast_vote":
          this.m_pollManager.handleCastVote(server, data as RequestCastVote);
          break;
        case "request_end_poll":
          this.m_pollManager.handleEndPoll(server);
          break;
        case "request_set_tag_preferences":
          this.m_sessionManager.handleSetTagPreferences(
            server,
            data as RequestSetTagPreferences,
          );
          break;
        case "request_tag_change":
          this.m_sessionManager.handleRequestTagChange(
            server,
            data as RequestTagChange,
          );
          break;
        case "request_skip_user":
          await this.m_questionService.handleSkipUser(server);
          break;
        case "request_reset_questions":
          this.m_questionService.handleResetQuestions(server);
          break;
        case "request_generate_hint":
          await this.m_hintManager.handleGenerateHint(server);
          break;
        case "request_add_custom_hint":
          this.m_hintManager.handleAddCustomHint(
            server,
            data as RequestAddCustomHint,
          );
          break;
        case "request_delete_hint":
          this.m_hintManager.handleDeleteHint(
            server,
            data as RequestDeleteHint,
          );
          break;
        case "request_toggle_hint_visibility":
          this.m_hintManager.handleToggleHint(
            server,
            data as RequestToggleHintVisibility,
          );
          break;
        case "request_reaction":
          this.m_reactionManager.handleReaction(
            server,
            data as RequestReaction,
          );
          break;
        default:
          console.warn("Unknown message type:", (data as ClientMessage).type);
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }

  public broadcast(message: ServerMessage) {
    const sessions = this.m_sessionManager.sessions;
    sessions.forEach((_, session) => {
      this.sendToClient(session, message);
    });
  }

  public broadcastUserList() {
    const users = this.m_sessionManager.getAllUsers();
    this.broadcast({
      type: "users_snapshot",
      users: users,
    });
  }

  public broadcastQueueUpdate() {
    const queueState = this.m_queueManager.getQueueState();
    this.broadcast({
      type: "queue_update",
      queue: queueState,
    });
  }

  public broadcastPollUpdate() {
    const sessions = this.m_sessionManager.sessions;

    for (const [session, userInfo] of sessions) {
      const message = this.m_pollManager.getPollUpdate(userInfo.id);
      this.sendToClient(session, message);
    }
  }

  public notifyHintListToPresenter() {
    const presenter = this.m_sessionManager.getCurrentPresenter();
    if (presenter) {
      this.sendToClient(presenter.session, {
        type: "hints_list_snapshot",
        hints: [...this.m_hintManager.getHints()],
      });
    }
  }

  public broadcastActiveHints() {
    this.broadcast({
      type: "active_hints_snapshot",
      hints: this.m_hintManager.getActiveHints(),
    });
  }

  public broadcastQuestion(
    forUserId: string | null,
    forUserName: string | null,
  ) {
    const currentQuestion = this.m_questionService.currentQuestion;
    if (!currentQuestion) return;

    const clientQuestion: ClientQuestionInfo = {
      content: currentQuestion.content,
      title: currentQuestion.title,
    };

    if (forUserId && forUserName) {
      this.broadcast({
        type: "targeted_question",
        userId: forUserId,
        question: clientQuestion,
      });
    } else {
      this.broadcast({
        type: "question",
        question: clientQuestion,
      });
    }
  }

  public sendToClient(server: WebSocket, message: ServerMessage) {
    try {
      const payload = this.createPayload(message);
      server.send(payload);
    } catch (err) {
      console.error("Error sending to client:", err);
      this.m_sessionManager.deleteSession(server);
    }
  }

  public sendInitialStateToClient(server: WebSocket, userInfo: UserInfo) {
    const currentQuestion = this.m_questionService.currentQuestion;
    const clientQuestion: ClientQuestionInfo | null = currentQuestion
      ? {
          content: currentQuestion.content,
          title: currentQuestion.title,
        }
      : null;

    if (clientQuestion) {
      this.sendToClient(server, { type: "question", question: clientQuestion });
    }

    if (this.m_queueManager.hasQueue()) {
      this.broadcastQueueUpdate();
    }

    if (this.m_pollManager.isActive()) {
      const pollUpdate = this.m_pollManager.getPollUpdate(userInfo.id);
      this.sendToClient(server, pollUpdate);
    }

    if (userInfo.role === "presenter") {
      this.sendToClient(server, {
        type: "hints_list_snapshot",
        hints: [...this.m_hintManager.getHints()],
      });
    }

    if (this.m_hintManager.getActiveHints().length > 0) {
      this.sendToClient(server, {
        type: "active_hints_snapshot",
        hints: this.m_hintManager.getActiveHints(),
      });
    }
  }

  public resetPresenterState() {
    this.m_questionService.clearCurrentQuestion();
    this.m_questionService.resetAskedQuestions();
    this.m_hintManager.clearHints();
    this.m_pollManager.resetPoll();

    this.notifyHintListToPresenter();
    this.broadcastActiveHints();
    this.broadcastPollUpdate();
  }

  private parseMessage(data: unknown) {
    try {
      return JSON.parse(data as string) as ClientMessage;
    } catch {
      return null;
    }
  }

  private createPayload(message: ServerMessage) {
    return JSON.stringify({
      ...message,
    });
  }
}
