import { DurableObject } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import HintManager from "./managers/HintManager";
import PollManager from "./managers/PollManager";
import QuestionService from "./managers/QuestionService";
import SessionManager from "./managers/SessionManager";
import type {
  ClientMessage,
  ClientQuestionInfo,
  Identify,
  RequestAddCustomHint,
  RequestCastVote,
  RequestDeleteHint,
  RequestSetTagPreferences,
  RequestTagChange,
  RequestToggleHintVisibility,
  ServerMessage,
  UserInfo,
} from "./types";

export class BrunchRoom extends DurableObject<Env> {
  private m_pollManager: PollManager;
  private m_hintManager: HintManager;
  private m_sessionManager: SessionManager;
  private m_questionService: QuestionService;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    this.m_pollManager = new PollManager();
    this.m_sessionManager = new SessionManager();
    this.m_hintManager = new HintManager(env.question_ai);

    const db = drizzle(env.banki_brunch_db);
    this.m_questionService = new QuestionService(db);
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
      this.handleClose(server, event),
    );
    server.addEventListener("error", (error) =>
      this.handleError(server, error),
    );
  }

  private async handleMessage(server: WebSocket, event: MessageEvent) {
    try {
      const data = this.parseMessage(event.data);
      if (!data) return;

      switch (data.type) {
        case "identify":
          this.handleIdentify(server, data);
          break;
        case "request_toggle_lurking":
          this.handleToggleLurking(server);
          break;
        case "request_change_role":
          this.handleChangeRole(server);
          break;
        case "request_question":
          await this.handleGetQuestion(server);
          break;
        case "request_start_poll":
          this.handleStartPoll(server);
          break;
        case "request_cast_vote":
          this.handleCastVote(server, data);
          break;
        case "request_end_poll":
          this.handleEndPoll(server);
          break;
        case "request_set_tag_preferences":
          this.handleSetTagPreferences(server, data);
          break;
        case "request_tag_change":
          this.handleRequestTagChange(server, data);
          break;
        case "request_skip_user":
          await this.handleSkipUser(server);
          break;
        case "request_reset_questions":
          this.handleResetQuestions(server);
          break;
        case "request_generate_hint":
          await this.handleGenerateHint(server);
          break;
        case "request_add_custom_hint":
          this.handleAddCustomHint(server, data);
          break;
        case "request_delete_hint":
          this.handleDeleteHint(server, data);
          break;
        case "request_toggle_hint_visibility":
          this.handleToggleHint(server, data);
          break;
        default:
          console.warn("Unknown message type:", (data as ClientMessage).type);
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }

  private handleIdentify(server: WebSocket, data: Identify) {
    const session = this.m_sessionManager.getSessionByUserId(data.id);

    if (session) {
      try {
        session.close(1000, "Reconnected");
      } catch {}
      this.m_sessionManager.deleteSession(session);
    }

    const userInfo: UserInfo = {
      id: data.id,
      role: "viewer",
      name: data.name,
      image: data.image,
      isLurking: true,
      preferredTags: data.preferredTags || [],
    };

    this.m_sessionManager.setUserInfo(server, userInfo);
    this.broadcastUserList();

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

    if (this.m_sessionManager.hasQueue()) {
      this.broadcastQueueUpdate();
    }

    if (this.m_pollManager.isActive()) {
      const pollUpdate = this.m_pollManager.getPollUpdate(userInfo.id);
      this.sendToClient(server, pollUpdate);
    }

    if (userInfo.role === "presenter") {
      this.sendToClient(server, {
        type: "hints_list_snapshot",
        hints: this.m_hintManager.getHintsClone(),
      });
    }

    if (this.m_hintManager.getActiveHints().length > 0) {
      this.sendToClient(server, {
        type: "active_hints_snapshot",
        hints: this.m_hintManager.getActiveHints(),
      });
    }
  }

  private handleToggleLurking(server: WebSocket) {
    const userInfo = this.m_sessionManager.getUserInfo(server);
    if (!userInfo) return;

    userInfo.isLurking = !userInfo.isLurking;
    this.m_sessionManager.setUserInfo(server, userInfo);
    if (userInfo.role !== "presenter") {
      this.m_sessionManager.updateViewerQueue();
      this.broadcastQueueUpdate();
    }
    this.broadcastUserList();
  }

  private handleChangeRole(server: WebSocket) {
    const userInfo = this.m_sessionManager.getUserInfo(server);
    if (!userInfo) return;

    if (userInfo.role === "viewer") {
      const presenter = this.m_sessionManager.getCurrentPresenter();
      if (presenter) {
        this.sendToClient(server, {
          type: "role_change_rejected",
          reason: "presenter_exists",
        });
        return;
      }
    }

    const newRole = userInfo.role === "viewer" ? "presenter" : "viewer";
    userInfo.role = newRole;

    if (newRole === "presenter") {
      this.notifyHintListToPresenter();
    }

    this.m_sessionManager.setUserInfo(server, userInfo);
    this.m_sessionManager.updateViewerQueue();
    this.broadcastQueueUpdate();
    this.broadcast({
      type: "user_role_changed",
      id: userInfo.id,
      role: newRole,
    });
  }

  private async handleGetQuestion(server: WebSocket) {
    if (!this.m_sessionManager.isPresenter(server)) return;

    const nextViewer = this.m_sessionManager.getNextViewer();

    if (!nextViewer) {
      const question = await this.m_questionService.getRandomExcluding();

      if (question) {
        this.m_questionService.currentQuestion = question;
        this.m_hintManager.clearHints();
        this.broadcastQuestion(null, null);
      } else {
        this.sendToClient(server, { type: "no_matching_question" });
      }
      return;
    }

    const question = await this.m_questionService.getRandomQuestion(
      nextViewer.preferredTags,
    );

    if (question) {
      this.m_questionService.currentQuestion = question;
      this.m_hintManager.clearHints();
      this.notifyHintListToPresenter();
      this.broadcastActiveHints();
      this.m_sessionManager.advanceQueue();
      this.broadcastQueueUpdate();
      this.broadcastQuestion(nextViewer.id, nextViewer.name);
    } else {
      this.sendToClient(server, { type: "no_matching_question" });
    }
  }

  private broadcastQuestion(
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

  private handleSetTagPreferences(
    server: WebSocket,
    data: RequestSetTagPreferences,
  ) {
    const userInfo = this.m_sessionManager.getUserInfo(server);
    if (!userInfo) return;

    userInfo.preferredTags = data.tags;
    this.m_sessionManager.setUserInfo(server, userInfo);
    this.broadcastUserList();
  }

  private handleRequestTagChange(server: WebSocket, data: RequestTagChange) {
    if (!this.m_sessionManager.isPresenter(server)) return;

    const socket = this.m_sessionManager.getSessionByUserId(data.userId);
    if (socket) {
      this.sendToClient(socket, { type: "tag_change_requested" });
    }
  }

  private async handleSkipUser(server: WebSocket) {
    if (!this.m_sessionManager.isPresenter(server)) return;

    this.m_sessionManager.advanceQueue();
    this.broadcastQueueUpdate();
    await this.handleGetQuestion(server);
  }

  private handleResetQuestions(server: WebSocket) {
    if (!this.m_sessionManager.isPresenter(server)) return;
    this.m_questionService.resetAskedQuestions();
  }

  private handleStartPoll(server: WebSocket) {
    if (!this.m_sessionManager.isPresenter(server)) return;
    if (!this.m_questionService.currentQuestion) return;

    this.m_pollManager.startPoll();
    this.broadcastPollUpdate();
  }

  private handleCastVote(server: WebSocket, data: RequestCastVote) {
    const userInfo = this.m_sessionManager.getUserInfo(server);
    if (!userInfo) return;

    this.m_pollManager.castVote(userInfo.id, data.option);
    this.broadcastPollUpdate();
  }

  private handleEndPoll(server: WebSocket) {
    if (!this.m_sessionManager.isPresenter(server)) return;
    this.m_pollManager.endPoll();
    this.broadcast({ type: "poll_ended" });
  }

  private async handleGenerateHint(server: WebSocket) {
    if (!this.m_sessionManager.isPresenter(server)) return;

    this.sendToClient(server, { type: "hint_generating" });

    const result = await this.m_hintManager.generateHint(
      this.m_questionService.currentQuestion,
    );

    if (result.success) {
      this.notifyHintListToPresenter();
      this.sendToClient(server, { type: "hint_generated" });
    } else {
      this.sendToClient(server, {
        type: "hint_error",
        error: result.error || "Failed to generate hint",
      });
    }
  }

  private handleAddCustomHint(server: WebSocket, data: RequestAddCustomHint) {
    if (!this.m_sessionManager.isPresenter(server)) return;

    const result = this.m_hintManager.addCustomHint(data.content);

    if (result.success) {
      this.notifyHintListToPresenter();
    } else {
      this.sendToClient(server, {
        type: "hint_error",
        error: result.error || "Failed to add hint",
      });
    }
  }

  private handleDeleteHint(server: WebSocket, data: RequestDeleteHint) {
    if (!this.m_sessionManager.isPresenter(server)) return;

    const activeHintCount = this.m_hintManager.getActiveHints().length;

    this.m_hintManager.deleteHint(data.hintId);
    this.notifyHintListToPresenter();

    if (activeHintCount > 0) {
      this.broadcastActiveHints();
    }
  }

  private handleToggleHint(
    server: WebSocket,
    data: RequestToggleHintVisibility,
  ) {
    if (!this.m_sessionManager.isPresenter(server)) return;

    this.m_hintManager.toggleHint(data.hintId);
    this.notifyHintListToPresenter();
    this.broadcastActiveHints();
  }

  private handleClose(server: WebSocket, event: CloseEvent) {
    const userInfo = this.m_sessionManager.getUserInfo(server);
    this.m_sessionManager.deleteSession(server);

    if (userInfo?.role === "presenter") {
      this.resetPresenterState();
    }

    this.m_sessionManager.updateViewerQueue();
    this.broadcastUserList();
  }

  private handleError(server: WebSocket, error: Event) {
    console.error("WebSocket error in DO:", error);
    const userInfo = this.m_sessionManager.getUserInfo(server);
    this.m_sessionManager.deleteSession(server);

    if (userInfo?.role === "presenter") {
      this.resetPresenterState();
    }

    this.m_sessionManager.updateViewerQueue();
    this.broadcastUserList();
  }

  private resetPresenterState() {
    this.m_questionService.clearCurrentQuestion();
    this.m_questionService.resetAskedQuestions();
    this.m_hintManager.clearHints();
    this.m_pollManager.resetPoll();

    this.notifyHintListToPresenter();
    this.broadcastActiveHints();
    this.broadcastPollUpdate();
  }

  private broadcast(message: ServerMessage) {
    const sessions = this.m_sessionManager.sessions;
    sessions.forEach((_, session) => {
      this.sendToClient(session, message);
    });
  }

  private broadcastUserList() {
    const users = this.m_sessionManager.getAllUsers();
    this.broadcast({
      type: "users_snapshot",
      users: users,
    });
  }

  private broadcastQueueUpdate() {
    const queueState = this.m_sessionManager.getQueueState();
    this.broadcast({
      type: "queue_update",
      queue: queueState,
    });
  }

  private broadcastPollUpdate() {
    const sessions = this.m_sessionManager.sessions;

    for (const [session, userInfo] of sessions) {
      const message = this.m_pollManager.getPollUpdate(userInfo.id);
      this.sendToClient(session, message);
    }
  }

  private notifyHintListToPresenter() {
    const presenter = this.m_sessionManager.getCurrentPresenter();
    if (presenter) {
      this.sendToClient(presenter.session, {
        type: "hints_list_snapshot",
        hints: this.m_hintManager.getHintsClone(),
      });
    }
  }

  private broadcastActiveHints() {
    this.broadcast({
      type: "active_hints_snapshot",
      hints: this.m_hintManager.getActiveHints(),
    });
  }

  private sendToClient(server: WebSocket, message: ServerMessage) {
    try {
      const payload = this.createPayload(message);
      server.send(payload);
    } catch (err) {
      console.error("Error sending to client:", err);
      this.m_sessionManager.deleteSession(server);
    }
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
