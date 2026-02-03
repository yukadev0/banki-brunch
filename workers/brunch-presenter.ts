import { DurableObject } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { QuestionsRepository } from "~/repositories/question/repository";
import type {
  CastVoteMessage,
  ClientMessage,
  ClientQuestionInfo,
  GetRandomQuestionForUserMessage,
  IdentifyMessage,
  RequestTagChangeMessage,
  ServerQuestionInfo,
  SetTagPreferencesMessage,
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

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    this.setupEventListeners(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private setupEventListeners(server: WebSocket): void {
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

  private async handleMessage(
    server: WebSocket,
    event: MessageEvent,
  ): Promise<void> {
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
        default:
          console.warn("Unknown message type:", (data as ClientMessage).type);
      }
    } catch (err) {
      this.handleParseError(server, event.data);
    }
  }

  private parseMessage(data: unknown): ClientMessage | null {
    try {
      return JSON.parse(data as string) as ClientMessage;
    } catch {
      return null;
    }
  }

  private handleIdentify(server: WebSocket, data: IdentifyMessage): void {
    if (this.isDuplicateSession(data.id)) {
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
  }

  private isDuplicateSession(userId: string): boolean {
    return Array.from(this.sessions.values()).some(
      (user) => user.id === userId,
    );
  }

  private handleToggleLurking(server: WebSocket): void {
    const userInfo = this.sessions.get(server);
    if (!userInfo) return;

    userInfo.isLurking = !userInfo.isLurking;
    this.sessions.set(server, userInfo);
    this.updateViewerQueue();
    this.broadcastUserList();
  }

  private handleChangeRole(server: WebSocket): void {
    const userInfo = this.sessions.get(server);
    if (!userInfo) return;

    userInfo.role = userInfo.role === "viewer" ? "presenter" : "viewer";
    this.sessions.set(server, userInfo);
    this.broadcastUserList();
  }

  async handleGetQuestion(server: WebSocket) {
    const userInfo = this.sessions.get(server);
    if (!userInfo || userInfo.role !== "presenter") return;

    const nextViewer = this.getNextViewer();

    if (!nextViewer) {
      const db = drizzle(this.env.banki_brunch_db);
      const question = await QuestionsRepository.getRandomExcluding(
        db,
        Array.from(this.askedQuestionIds),
      );

      if (!question) {
        this.askedQuestionIds.clear();
        const freshQuestion = await QuestionsRepository.getRandom(db);
        if (freshQuestion) {
          this.setCurrentQuestion(freshQuestion);
          this.broadcastQuestion(null, null);
        }
        return;
      }

      this.setCurrentQuestion(question);
      this.broadcastQuestion(null, null);
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
      this.broadcast({
        type: "no_matching_question",
        forUserId: nextViewer.id,
        forUserName: nextViewer.name,
        requestedTags: nextViewer.preferredTags,
      });
    }
  }

  private setCurrentQuestion(question: {
    id: number;
    title: string;
    content: string;
  }): void {
    this.currentQuestion = {
      content: question.content,
      id: question.id,
      title: question.title,
    };
    this.askedQuestionIds.add(question.id);
  }

  private broadcastQuestion(
    forUserId: string | null,
    forUserName: string | null,
  ): void {
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
  ): void {
    const userInfo = this.sessions.get(server);
    if (!userInfo) return;

    userInfo.preferredTags = data.tags;
    this.sessions.set(server, userInfo);
    this.broadcastUserList();
  }

  private handleRequestTagChange(
    server: WebSocket,
    data: RequestTagChangeMessage,
  ): void {
    const userInfo = this.sessions.get(server);
    if (!userInfo || userInfo.role !== "presenter") return;

    for (const [socket, user] of this.sessions) {
      if (user.id === data.targetUserId) {
        this.sendToClient(socket, {
          type: "tag_change_requested",
        });
        break;
      }
    }
  }

  private async handleGetRandomQuestionForUser(
    server: WebSocket,
    data: GetRandomQuestionForUserMessage,
  ): Promise<void> {
    const userInfo = this.sessions.get(server);
    if (!userInfo || userInfo.role !== "presenter") return;

    let targetUser: UserInfo | null = null;
    for (const user of this.sessions.values()) {
      if (user.id === data.targetUserId) {
        targetUser = user;
        break;
      }
    }

    const db = drizzle(this.env.banki_brunch_db);
    const question = await QuestionsRepository.getRandomExcluding(
      db,
      Array.from(this.askedQuestionIds),
    );

    if (question) {
      this.setCurrentQuestion(question);
      this.advanceQueue();
      this.broadcastQuestion(targetUser?.id || null, targetUser?.name || null);
    }
  }

  private async handleSkipUser(server: WebSocket): Promise<void> {
    const userInfo = this.sessions.get(server);
    if (!userInfo || userInfo.role !== "presenter") return;

    this.advanceQueue();
    this.broadcastQueueUpdate();

    await this.handleGetQuestion(server);
  }

  private updateViewerQueue(): void {
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

    this.viewerQueue = newQueue;

    if (this.currentQueueIndex >= this.viewerQueue.length) {
      this.currentQueueIndex = 0;
    }

    this.broadcastQueueUpdate();
  }

  private getNextViewer(): UserInfo | null {
    if (this.viewerQueue.length === 0) {
      return null;
    }

    const nextUserId = this.viewerQueue[this.currentQueueIndex];
    for (const user of this.sessions.values()) {
      if (user.id === nextUserId) {
        return user;
      }
    }

    return null;
  }

  private advanceQueue(): void {
    if (this.viewerQueue.length === 0) return;

    this.currentQueueIndex =
      (this.currentQueueIndex + 1) % this.viewerQueue.length;
    this.broadcastQueueUpdate();
  }

  private broadcastQueueUpdate(): void {
    this.broadcast({
      type: "queue_update",
      queue: this.viewerQueue,
      currentIndex: this.currentQueueIndex,
    });
  }

  private resetPoll(): void {
    this.pollVotes.clear();
    this.isPollActive = false;
  }

  private handleStartPoll(server: WebSocket): void {
    const userInfo = this.sessions.get(server);
    if (!userInfo || userInfo.role !== "presenter") return;
    if (!this.currentQuestion) return;

    this.resetPoll();
    this.isPollActive = true;
    this.broadcastPollUpdate();
  }

  private handleCastVote(server: WebSocket, data: CastVoteMessage): void {
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

  private handleEndPoll(server: WebSocket): void {
    const userInfo = this.sessions.get(server);
    if (!userInfo || userInfo.role !== "presenter") return;

    this.isPollActive = false;
    this.broadcastPollUpdate();
  }

  private broadcastPollUpdate(): void {
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

  private handleClose(server: WebSocket, event: CloseEvent): void {
    this.sessions.delete(server);
    this.updateViewerQueue();
    this.broadcastUserList();
  }

  private handleError(server: WebSocket, error: Event): void {
    console.error("WebSocket error in DO:", error);
    this.sessions.delete(server);
  }

  private handleParseError(server: WebSocket, rawData: unknown): void {
    this.broadcast({
      type: "message",
      message: rawData as string,
    });
  }

  private broadcast(message: object): void {
    this.sessions.forEach((_, session) => {
      this.sendToClient(session, message);
    });
  }

  private broadcastUserList(): void {
    const users = Array.from(this.sessions.values());
    this.broadcast({
      type: "users",
      users: users,
    });
  }

  private sendToClient(server: WebSocket, message: object): void {
    try {
      const payload = this.createPayload(message);
      server.send(payload);
    } catch (err) {
      console.error("Error sending to client:", err);
      this.sessions.delete(server);
    }
  }

  private createPayload(message: object): string {
    return JSON.stringify({
      ...message,
    });
  }
}
