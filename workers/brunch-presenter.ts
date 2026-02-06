import { DurableObject } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { QuestionsRepository } from "~/repositories/question/repository";
import type {
  AddCustomHintMessage,
  CastVoteMessage,
  ClientMessage,
  ClientQuestionInfo,
  DeleteHintMessage,
  GetRandomQuestionForUserMessage,
  Hint,
  IdentifyMessage,
  RequestTagChangeMessage,
  ServerQuestionInfo,
  SetTagPreferencesMessage,
  ToggleHintMessage,
  UserInfo,
} from "../app/types/brunch-presenter.types";

export class BrunchPresenter extends DurableObject<Env> {
  private sessions: Map<WebSocket, UserInfo> = new Map();
  private currentQuestion: ServerQuestionInfo | null = null;
  private pollOptions: string[] = ["A", "B", "C", "D"];
  private pollVotes: Map<string, string> = new Map();
  private isPollActive: boolean = false;
  private viewerQueue: string[] = [];
  private currentQueueIndex: number = 0;
  private askedQuestionIds: Set<number> = new Set();
  private hints: Hint[] = [];
  private readonly MAX_HINTS = 3;

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
    if (this.getUserById(data.id)) {
      this.sendToClient(server, {
        type: "duplicate_session",
      });
      server.close(1008, "Duplicate session detected");
      return;
    }

    const userInfo: UserInfo = {
      id: data.id,
      role: "viewer",
      name: data.name,
      image: data.image,
      isLurking: true,
      preferredTags: data.preferredTags || [],
    };

    this.sessions.set(server, userInfo);
    this.broadcastUserList();

    const clientQuestion: ClientQuestionInfo | null = this.currentQuestion
      ? {
          content: this.currentQuestion.content,
          title: this.currentQuestion.title,
        }
      : null;

    this.sendToClient(server, { type: "question", question: clientQuestion });

    if (this.viewerQueue.length > 0) {
      this.broadcastQueueUpdate();
    }

    if (this.isPollActive) {
      const votes: Record<string, number> = {};
      for (const option of this.pollOptions) {
        votes[option] = 0;
      }
      for (const vote of this.pollVotes.values()) {
        if (votes[vote] !== undefined) {
          votes[vote]++;
        }
      }
      this.sendToClient(server, {
        type: "poll_update",
        options: this.pollOptions,
        votes: votes,
        totalVotes: this.pollVotes.size,
        userVote: null,
      });
    }

    if (userInfo.role === "presenter") {
      this.sendToClient(server, {
        type: "hints_list",
        hints: this.hints,
        canGenerateMore: this.hints.length < this.MAX_HINTS,
      });
    }

    const activeHints = this.hints.filter((h) => h.isVisible);
    this.sendToClient(server, {
      type: "active_hints",
      hints: activeHints,
    });
  }

  private handleToggleLurking(server: WebSocket) {
    const userInfo = this.sessions.get(server);
    if (!userInfo) return;

    userInfo.isLurking = !userInfo.isLurking;
    this.sessions.set(server, userInfo);
    if (userInfo.role !== "presenter") {
      this.updateViewerQueue();
    }
    this.broadcastUserList();
  }

  private handleChangeRole(server: WebSocket) {
    const userInfo = this.sessions.get(server);
    if (!userInfo) return;

    if (userInfo.role === "viewer") {
      const existingPresenter = this.getCurrentPresenter();
      if (existingPresenter) {
        this.sendToClient(server, {
          type: "role_change_rejected",
          reason: "presenter_exists",
          currentPresenterId: existingPresenter.id,
          currentPresenterName: existingPresenter.name,
        });
        return;
      }
    }

    const newRole = userInfo.role === "viewer" ? "presenter" : "viewer";
    userInfo.role = newRole;

    if (newRole === "presenter") {
      this.broadcastHintsList();
    }

    this.sessions.set(server, userInfo);
    this.updateViewerQueue();
    this.broadcastUserList();
  }

  async handleGetQuestion(server: WebSocket) {
    if (!this.isPresenter(server)) return;

    const nextViewer = this.getNextViewer();

    if (!nextViewer) {
      const db = drizzle(this.env.banki_brunch_db);
      const question = await QuestionsRepository.getRandomExcluding(
        db,
        Array.from(this.askedQuestionIds),
      );

      if (question) {
        this.setCurrentQuestion(question);
        this.broadcastQuestion(null, null);
      } else {
        this.handleNoMatchingQuestion(server);
      }
      return;
    }

    const db = drizzle(this.env.banki_brunch_db);

    if (nextViewer.preferredTags.length === 0) {
      const question = await QuestionsRepository.getRandomExcluding(
        db,
        Array.from(this.askedQuestionIds),
      );

      if (question) {
        this.setCurrentQuestion(question);
        this.advanceQueue();
        this.broadcastQuestion(nextViewer.id, nextViewer.name);
      } else {
        this.handleNoMatchingQuestion(server, nextViewer);
      }
      return;
    }

    const question = await QuestionsRepository.getByTags(
      db,
      nextViewer.preferredTags,
      Array.from(this.askedQuestionIds),
    );

    if (question) {
      this.setCurrentQuestion(question);
      this.advanceQueue();
      this.broadcastQuestion(nextViewer.id, nextViewer.name);
    } else {
      this.handleNoMatchingQuestion(server, nextViewer);
    }
  }

  private handleNoMatchingQuestion(
    server: WebSocket,
    userInfo: UserInfo | null = null,
  ) {
    if (userInfo) {
      this.sendToClient(server, {
        type: "no_matching_question",
        forUserId: userInfo.id,
        forUserName: userInfo.name,
        requestedTags: userInfo.preferredTags,
      });
    } else {
      this.sendToClient(server, {
        type: "no_matching_question",
      });
    }
  }

  private setCurrentQuestion(question: {
    id: number;
    title: string;
    content: string;
  }) {
    this.currentQuestion = {
      content: question.content,
      id: question.id,
      title: question.title,
    };
    this.askedQuestionIds.add(question.id);
    this.hints = [];
    this.broadcastHintsList();
    this.broadcastActiveHints();
  }

  private broadcastQuestion(
    forUserId: string | null,
    forUserName: string | null,
  ) {
    if (!this.currentQuestion) return;

    const clientQuestion: ClientQuestionInfo = {
      content: this.currentQuestion.content,
      title: this.currentQuestion.title,
    };

    this.broadcast({
      type: "question",
      question: clientQuestion,
      forUserId: forUserId || undefined,
      forUserName: forUserName || undefined,
    });
  }

  private handleSetTagPreferences(
    server: WebSocket,
    data: SetTagPreferencesMessage,
  ) {
    const userInfo = this.sessions.get(server);
    if (!userInfo) return;

    userInfo.preferredTags = data.tags;
    this.sessions.set(server, userInfo);
    this.broadcastUserList();
  }

  private handleRequestTagChange(
    server: WebSocket,
    data: RequestTagChangeMessage,
  ) {
    if (!this.isPresenter(server)) return;

    const socket = this.getSessionByUserId(data.targetUserId);
    if (socket) {
      this.sendToClient(socket, { type: "tag_change_requested" });
    }
  }

  private async handleGetRandomQuestionForUser(
    server: WebSocket,
    data: GetRandomQuestionForUserMessage,
  ) {
    if (!this.isPresenter(server)) return;

    const db = drizzle(this.env.banki_brunch_db);
    const question = await QuestionsRepository.getRandomExcluding(
      db,
      Array.from(this.askedQuestionIds),
    );

    if (question) {
      let targetUser = this.getUserById(data.targetUserId);

      this.setCurrentQuestion(question);
      this.advanceQueue();
      this.broadcastQuestion(targetUser?.id || null, targetUser?.name || null);
    }
  }

  private async handleSkipUser(server: WebSocket) {
    if (!this.isPresenter(server)) return;

    this.advanceQueue();
    await this.handleGetQuestion(server);
  }

  private handleResetQuestions(server: WebSocket) {
    const userInfo = this.sessions.get(server);
    if (userInfo && userInfo.role === "presenter") {
      this.askedQuestionIds.clear();
    }
  }

  private updateViewerQueue() {
    const activeViewers = Array.from(this.sessions.values())
      .filter((user) => user.role === "viewer" && !user.isLurking)
      .map((user) => user.id);

    const newQueue = this.viewerQueue.filter((id) =>
      activeViewers.includes(id),
    );

    for (const id of activeViewers) {
      if (!newQueue.includes(id)) {
        newQueue.push(id);
      }
    }

    const currentId = this.viewerQueue[this.currentQueueIndex];

    this.viewerQueue = newQueue;

    this.currentQueueIndex = this.viewerQueue.indexOf(currentId);
    if (this.currentQueueIndex === -1) {
      this.currentQueueIndex = 0;
    }

    this.broadcastQueueUpdate();
  }

  private getNextViewer(): UserInfo | null {
    if (this.viewerQueue.length === 0) return null;

    const startIndex = this.currentQueueIndex;
    let index = startIndex;

    do {
      const id = this.viewerQueue[index];
      const user = this.getUserById(id);

      if (user && user.role === "viewer" && !user.isLurking) {
        this.currentQueueIndex = index;
        return user;
      }

      index = (index + 1) % this.viewerQueue.length;
    } while (index !== startIndex);

    return null;
  }

  private advanceQueue() {
    if (this.viewerQueue.length === 0) return;

    this.currentQueueIndex =
      (this.currentQueueIndex + 1) % this.viewerQueue.length;
    this.broadcastQueueUpdate();
  }

  private broadcastQueueUpdate() {
    this.broadcast({
      type: "queue_update",
      queue: this.viewerQueue,
      currentIndex: this.currentQueueIndex,
    });
  }

  private resetPoll() {
    this.pollVotes.clear();
    this.isPollActive = false;
  }

  private handleStartPoll(server: WebSocket) {
    if (!this.isPresenter(server)) return;
    if (!this.currentQuestion) return;

    this.resetPoll();
    this.isPollActive = true;
    this.broadcastPollUpdate();
  }

  private handleCastVote(server: WebSocket, data: CastVoteMessage) {
    if (!this.isPollActive) return;
    if (!this.pollOptions.includes(data.option)) return;

    const userInfo = this.sessions.get(server);
    if (!userInfo) return;

    if (this.pollVotes.get(userInfo.id) === data.option) {
      this.pollVotes.delete(userInfo.id);
    } else {
      this.pollVotes.set(userInfo.id, data.option);
    }

    this.broadcastPollUpdate();
  }

  private handleEndPoll(server: WebSocket) {
    if (!this.isPresenter(server)) return;

    this.isPollActive = false;
    this.broadcastPollUpdate();
  }

  private broadcastPollUpdate() {
    const votes: Record<string, number> = {};
    for (const option of this.pollOptions) {
      votes[option] = 0;
    }
    for (const vote of this.pollVotes.values()) {
      if (votes[vote] !== undefined) {
        votes[vote]++;
      }
    }

    for (const [session, userInfo] of this.sessions) {
      const userVote = this.pollVotes.get(userInfo.id) || null;
      this.sendToClient(session, {
        type: "poll_update",
        options: this.pollOptions,
        votes: votes,
        totalVotes: this.pollVotes.size,
        userVote: userVote,
      });
    }
  }

  private handleClose(server: WebSocket, event: CloseEvent) {
    this.sessions.delete(server);

    const userInfo = this.sessions.get(server);
    if (userInfo?.role === "presenter") {
      this.resetPresenterState();
    }

    this.updateViewerQueue();
    this.broadcastUserList();
  }

  private handleError(server: WebSocket, error: Event) {
    console.error("WebSocket error in DO:", error);
    this.sessions.delete(server);

    const userInfo = this.sessions.get(server);
    if (userInfo?.role === "presenter") {
      this.resetPresenterState();
    }

    this.updateViewerQueue();
    this.broadcastUserList();
  }

  private resetPresenterState() {
    this.currentQuestion = null;
    this.askedQuestionIds.clear();
    this.hints = [];
    this.resetPoll();

    this.broadcast({ type: "question", question: null });
    this.broadcastHintsList();
    this.broadcastActiveHints();
    this.broadcastPollUpdate();
  }

  private broadcast(message: object) {
    this.sessions.forEach((_, session) => {
      this.sendToClient(session, message);
    });
  }

  private broadcastUserList() {
    const users = Array.from(this.sessions.values());
    this.broadcast({
      type: "users",
      users: users,
    });
  }

  private async handleGenerateHint(server: WebSocket) {
    if (!this.isPresenter(server)) return;
    if (!this.currentQuestion) return;
    if (this.hints.length >= this.MAX_HINTS) return;

    this.sendToClient(server, {
      type: "hint_generating",
    });

    try {
      const ai = this.env.question_ai;
      const response = await ai.run("@cf/mistral/mistral-7b-instruct-v0.1", {
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that provides hints for technical interview questions. Provide concise, helpful hints that guide the candidate toward the answer without giving it away completely. Keep hints under 100 words.",
          },
          {
            role: "user",
            content: `Question Title: ${this.currentQuestion.title}\n\nQuestion: ${this.currentQuestion.content}\n\nProvide a helpful hint to solve this question. The hint should guide thinking but not give the full answer.`,
          },
        ],
      });

      if (this.hints.length >= this.MAX_HINTS) {
        this.sendToClient(server, {
          type: "hint_error",
          error: "You have reached the maximum number of hints.",
        });
        return;
      }

      const hintContent = response.response || "Unable to generate hint";

      const newHint: Hint = {
        id: crypto.randomUUID(),
        content: hintContent,
        isVisible: false,
        createdBy: "ai",
      };

      this.hints.push(newHint);
      this.broadcastHintsList();
    } catch (error) {
      console.error("Error generating hint:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate hint";
      this.sendToClient(server, {
        type: "hint_error",
        error: errorMessage,
      });
    }
  }

  private handleAddCustomHint(server: WebSocket, data: AddCustomHintMessage) {
    if (this.hints.length >= this.MAX_HINTS) return;
    if (!this.isPresenter(server)) return;

    const content = data.content.trim();
    if (!content) return;

    const newHint: Hint = {
      id: crypto.randomUUID(),
      content: content,
      isVisible: false,
      createdBy: "manual",
    };

    this.hints.push(newHint);
    this.broadcastHintsList();
  }

  private handleDeleteHint(server: WebSocket, data: DeleteHintMessage) {
    if (!this.isPresenter(server)) return;

    this.hints = this.hints.filter((h) => h.id !== data.hintId);
    this.broadcastHintsList();
    this.broadcastActiveHints();
  }

  private handleToggleHint(server: WebSocket, data: ToggleHintMessage) {
    if (!this.isPresenter(server)) return;

    const hint = this.hints.find((h) => h.id === data.hintId);
    if (hint) {
      hint.isVisible = !hint.isVisible;
      this.broadcastHintsList();
      this.broadcastActiveHints();
    }
  }

  private handleShowSelectedHints(server: WebSocket) {
    if (!this.isPresenter(server)) return;
    this.broadcastActiveHints();
  }

  private broadcastHintsList() {
    for (const [session, userInfo] of this.sessions) {
      if (userInfo.role === "presenter") {
        this.sendToClient(session, {
          type: "hints_list",
          hints: this.hints,
          canGenerateMore: this.hints.length < this.MAX_HINTS,
        });
      }
    }
  }

  private broadcastActiveHints() {
    const activeHints = this.hints.filter((h) => h.isVisible);
    this.broadcast({
      type: "active_hints",
      hints: activeHints,
    });
  }

  private sendToClient(server: WebSocket, message: object) {
    try {
      const payload = this.createPayload(message);
      server.send(payload);
    } catch (err) {
      console.error("Error sending to client:", err);
      this.sessions.delete(server);
    }
  }

  private isPresenter(server: WebSocket) {
    const userInfo = this.sessions.get(server);
    return !!userInfo && userInfo.role === "presenter";
  }

  private getSessionByUserId(id: string) {
    for (const [socket, user] of this.sessions) {
      if (user.id === id) return socket;
    }
    return null;
  }

  private getUserById(id: string) {
    for (const user of this.sessions.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  private getCurrentPresenter(): UserInfo | null {
    for (const userInfo of this.sessions.values()) {
      if (userInfo.role === "presenter") {
        return userInfo;
      }
    }
    return null;
  }

  private parseMessage(data: unknown) {
    try {
      return JSON.parse(data as string) as ClientMessage;
    } catch {
      return null;
    }
  }

  private createPayload(message: object) {
    return JSON.stringify({
      ...message,
    });
  }
}
