import { DurableObject } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { QuestionsRepository } from "~/repositories/question/repository";
import type {
  CastVoteMessage,
  ClientMessage,
  ClientQuestionInfo,
  IdentifyMessage,
  ServerQuestionInfo,
  UserInfo,
} from "../app/types/brunch-presenter.types";

export class BrunchPresenter extends DurableObject<Env> {
  private sessions: Map<WebSocket, UserInfo> = new Map();
  private currentQuestion: ServerQuestionInfo | null = null;
  private pollOptions: string[] = ["A", "B", "C", "D"];
  private pollVotes: Map<string, string> = new Map();
  private isPollActive: boolean = false;

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

    const db = drizzle(this.env.banki_brunch_db);
    const question = await QuestionsRepository.getRandom(db);

    this.currentQuestion = {
      content: question.content,
      id: question.id,
      title: question.title,
    };

    const clientQuestion: ClientQuestionInfo = {
      content: question.content,
      title: question.title,
    };

    this.broadcast({
      type: "question",
      question: clientQuestion,
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
      timestamp: new Date().toISOString(),
    });
  }
}
