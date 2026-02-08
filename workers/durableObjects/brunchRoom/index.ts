import { DurableObject } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { HintManager } from "./hintManager";
import { PollManager } from "./pollManager";
import { QuestionService } from "./questionService";
import { SessionManager } from "./sessionManager";
import type {
  AddCustomHintMessage,
  CastVoteMessage,
  ClientMessage,
  ClientQuestionInfo,
  DeleteHintMessage,
  GetRandomQuestionForUserMessage,
  IdentifyMessage,
  RequestTagChangeMessage,
  ServerMessage,
  SetTagPreferencesMessage,
  ToggleHintMessage,
  UserInfo,
} from "./types";

export class BrunchRoom extends DurableObject<Env> {
  private pollManager: PollManager;
  private hintManager: HintManager;
  private sessionManager: SessionManager;
  private questionService: QuestionService;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);

    this.pollManager = new PollManager();
    this.sessionManager = new SessionManager();
    this.hintManager = new HintManager(env.question_ai);

    const db = drizzle(env.banki_brunch_db);
    this.questionService = new QuestionService(db);
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
        case "toggle_lurking":
          this.handleToggleLurking(server);
          break;
        case "change_role":
          this.handleChangeRole(server);
          break;
        case "get_question":
          await this.handleGetQuestion(server);
          break;
        case "start_poll":
          this.handleStartPoll(server);
          break;
        case "cast_vote":
          this.handleCastVote(server, data);
          break;
        case "end_poll":
          this.handleEndPoll(server);
          break;
        case "set_tag_preferences":
          this.handleSetTagPreferences(server, data);
          break;
        case "request_tag_change":
          this.handleRequestTagChange(server, data);
          break;
        case "get_random_question_for_user":
          await this.handleGetRandomQuestionForUser(server, data);
          break;
        case "skip_user":
          await this.handleSkipUser(server);
          break;
        case "reset_questions":
          this.handleResetQuestions(server);
          break;
        case "generate_hint":
          await this.handleGenerateHint(server);
          break;
        case "add_custom_hint":
          this.handleAddCustomHint(server, data as AddCustomHintMessage);
          break;
        case "delete_hint":
          this.handleDeleteHint(server, data as DeleteHintMessage);
          break;
        case "toggle_hint":
          this.handleToggleHint(server, data as ToggleHintMessage);
          break;
        case "show_selected_hints":
          this.handleShowSelectedHints(server);
          break;
        default:
          console.warn("Unknown message type:", (data as ClientMessage).type);
      }
    } catch (err) {
      console.error("Error handling message:", err);
    }
  }

  private handleIdentify(server: WebSocket, data: IdentifyMessage) {
    const session = this.sessionManager.getSessionByUserId(data.id);

    if (session) {
      try {
        session.close(1000, "Reconnected");
      } catch {}
      this.sessionManager.deleteSession(session);
    }

    const userInfo: UserInfo = {
      id: data.id,
      role: "viewer",
      name: data.name,
      image: data.image,
      isLurking: true,
      preferredTags: data.preferredTags || [],
    };

    this.sessionManager.setUserInfo(server, userInfo);
    this.broadcastUserList();

    const currentQuestion = this.questionService.currentQuestion;
    const clientQuestion: ClientQuestionInfo | null = currentQuestion
      ? {
          content: currentQuestion.content,
          title: currentQuestion.title,
        }
      : null;

    if (clientQuestion) {
      this.sendToClient(server, { type: "question", question: clientQuestion });
    }

    if (this.sessionManager.hasQueue()) {
      this.broadcastQueueUpdate();
    }

    if (this.pollManager.isActive()) {
      const pollUpdate = this.pollManager.getPollUpdate(userInfo.id);
      this.sendToClient(server, pollUpdate);
    }

    if (userInfo.role === "presenter") {
      this.sendToClient(server, {
        type: "hints_list",
        hints: this.hintManager.hints,
      });
    }

    const activeHints = this.hintManager.getActiveHints();
    this.sendToClient(server, {
      type: "active_hints",
      hints: activeHints,
    });
  }

  private handleToggleLurking(server: WebSocket) {
    const userInfo = this.sessionManager.getUserInfo(server);
    if (!userInfo) return;

    userInfo.isLurking = !userInfo.isLurking;
    this.sessionManager.setUserInfo(server, userInfo);
    if (userInfo.role !== "presenter") {
      this.sessionManager.updateViewerQueue();
      this.broadcastQueueUpdate();
    }
    this.broadcastUserList();
  }

  private handleChangeRole(server: WebSocket) {
    const userInfo = this.sessionManager.getUserInfo(server);
    if (!userInfo) return;

    if (userInfo.role === "viewer") {
      const presenter = this.sessionManager.getCurrentPresenter();
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

    this.sessionManager.setUserInfo(server, userInfo);
    this.sessionManager.updateViewerQueue();
    this.broadcastUserList();
  }

  private async handleGetQuestion(server: WebSocket) {
    if (!this.sessionManager.isPresenter(server)) return;

    const nextViewer = this.sessionManager.getNextViewer();

    if (!nextViewer) {
      const question = await this.questionService.getRandomExcluding();

      if (question) {
        this.questionService.currentQuestion = question;
        this.hintManager.clearHints();
        this.broadcastQuestion(null, null);
      } else {
        this.sendToClient(server, { type: "no_matching_question" });
      }
      return;
    }

    const question = await this.questionService.getRandomQuestion(
      nextViewer.preferredTags,
    );

    if (question) {
      this.questionService.currentQuestion = question;
      this.hintManager.clearHints();
      this.notifyHintListToPresenter();
      this.broadcastActiveHints();
      this.sessionManager.advanceQueue();
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
    const currentQuestion = this.questionService.currentQuestion;
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
    data: SetTagPreferencesMessage,
  ) {
    const userInfo = this.sessionManager.getUserInfo(server);
    if (!userInfo) return;

    userInfo.preferredTags = data.tags;
    this.sessionManager.setUserInfo(server, userInfo);
    this.broadcastUserList();
  }

  private handleRequestTagChange(
    server: WebSocket,
    data: RequestTagChangeMessage,
  ) {
    if (!this.sessionManager.isPresenter(server)) return;

    const socket = this.sessionManager.getSessionByUserId(data.userId);
    if (socket) {
      this.sendToClient(socket, { type: "tag_change_requested" });
    }
  }

  private async handleGetRandomQuestionForUser(
    server: WebSocket,
    data: GetRandomQuestionForUserMessage,
  ) {
    if (!this.sessionManager.isPresenter(server)) return;

    const question = await this.questionService.getRandomExcluding();

    if (question) {
      const targetUser = this.sessionManager.getUserById(data.userId);

      this.questionService.currentQuestion = question;
      this.hintManager.clearHints();
      this.notifyHintListToPresenter();
      this.broadcastActiveHints();
      this.sessionManager.advanceQueue();
      this.broadcastQueueUpdate();
      this.broadcastQuestion(targetUser?.id || null, targetUser?.name || null);
    }
  }

  private async handleSkipUser(server: WebSocket) {
    if (!this.sessionManager.isPresenter(server)) return;

    this.sessionManager.advanceQueue();
    this.broadcastQueueUpdate();
    await this.handleGetQuestion(server);
  }

  private handleResetQuestions(server: WebSocket) {
    if (!this.sessionManager.isPresenter(server)) return;
    this.questionService.resetAskedQuestions();
  }

  private handleStartPoll(server: WebSocket) {
    if (!this.sessionManager.isPresenter(server)) return;
    if (!this.questionService.currentQuestion) return;

    this.pollManager.startPoll();
    this.broadcastPollUpdate();
  }

  private handleCastVote(server: WebSocket, data: CastVoteMessage) {
    const userInfo = this.sessionManager.getUserInfo(server);
    if (!userInfo) return;

    this.pollManager.castVote(userInfo.id, data.option);
    this.broadcastPollUpdate();
  }

  private handleEndPoll(server: WebSocket) {
    if (!this.sessionManager.isPresenter(server)) return;
    this.pollManager.endPoll();
    this.broadcast({ type: "poll_ended" });
  }

  private async handleGenerateHint(server: WebSocket) {
    if (!this.sessionManager.isPresenter(server)) return;

    this.sendToClient(server, { type: "hint_generating" });

    const result = await this.hintManager.generateHint(
      this.questionService.currentQuestion,
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

  private handleAddCustomHint(server: WebSocket, data: AddCustomHintMessage) {
    if (!this.sessionManager.isPresenter(server)) return;

    const result = this.hintManager.addCustomHint(data.content);

    if (result.success) {
      this.notifyHintListToPresenter();
    } else {
      this.sendToClient(server, {
        type: "hint_error",
        error: result.error || "Failed to add hint",
      });
    }
  }

  private handleDeleteHint(server: WebSocket, data: DeleteHintMessage) {
    if (!this.sessionManager.isPresenter(server)) return;

    const activeHintCount = this.hintManager.getActiveHints().length;

    this.hintManager.deleteHint(data.hintId);
    this.notifyHintListToPresenter();

    if (activeHintCount > 0) {
      this.broadcastActiveHints();
    }
  }

  private handleToggleHint(server: WebSocket, data: ToggleHintMessage) {
    if (!this.sessionManager.isPresenter(server)) return;

    this.hintManager.toggleHint(data.hintId);
    this.notifyHintListToPresenter();
    this.broadcastActiveHints();
  }

  private handleShowSelectedHints(server: WebSocket) {
    if (!this.sessionManager.isPresenter(server)) return;
    this.broadcastActiveHints();
  }

  private handleClose(server: WebSocket, event: CloseEvent) {
    const userInfo = this.sessionManager.getUserInfo(server);
    this.sessionManager.deleteSession(server);

    if (userInfo?.role === "presenter") {
      this.resetPresenterState();
    }

    this.sessionManager.updateViewerQueue();
    this.broadcastUserList();
  }

  private handleError(server: WebSocket, error: Event) {
    console.error("WebSocket error in DO:", error);
    const userInfo = this.sessionManager.getUserInfo(server);
    this.sessionManager.deleteSession(server);

    if (userInfo?.role === "presenter") {
      this.resetPresenterState();
    }

    this.sessionManager.updateViewerQueue();
    this.broadcastUserList();
  }

  private resetPresenterState() {
    this.questionService.clearCurrentQuestion();
    this.questionService.resetAskedQuestions();
    this.hintManager.clearHints();
    this.pollManager.resetPoll();

    this.notifyHintListToPresenter();
    this.broadcastActiveHints();
    this.broadcastPollUpdate();
  }

  private broadcast(message: ServerMessage) {
    const sessions = this.sessionManager.sessions;
    sessions.forEach((_, session) => {
      this.sendToClient(session, message);
    });
  }

  private broadcastUserList() {
    const users = this.sessionManager.getAllUsers();
    this.broadcast({
      type: "users_snapshot",
      users: users,
    });
  }

  private broadcastQueueUpdate() {
    const queueState = this.sessionManager.getQueueState();
    this.broadcast({
      type: "queue_update",
      queue: queueState.queue,
      currentIndex: queueState.currentIndex,
    });
  }

  private broadcastPollUpdate() {
    const sessions = this.sessionManager.sessions;

    for (const [session, userInfo] of sessions) {
      const message = this.pollManager.getPollUpdate(userInfo.id);
      this.sendToClient(session, message);
    }
  }

  private notifyHintListToPresenter() {
    const presenter = this.sessionManager.getCurrentPresenter();
    if (presenter) {
      this.sendToClient(presenter.session, {
        type: "hints_list",
        hints: this.hintManager.hints,
      });
    }
  }

  private broadcastActiveHints() {
    this.broadcast({
      type: "active_hints",
      hints: this.hintManager.getActiveHints(),
    });
  }

  private sendToClient(server: WebSocket, message: ServerMessage) {
    try {
      const payload = this.createPayload(message);
      server.send(payload);
    } catch (err) {
      console.error("Error sending to client:", err);
      this.sessionManager.deleteSession(server);
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
