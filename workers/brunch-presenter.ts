import { DurableObject } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import { QuestionsRepository } from "~/repositories/question/repository";
import type {
  ClientChatMessage,
  ClientMessage,
  ClientQuestionInfo,
  IdentifyMessage,
  ServerQuestionInfo,
  UserInfo,
} from "../app/types/brunch-presenter.types";

export class BrunchPresenter extends DurableObject<Env> {
  private sessions: Map<WebSocket, UserInfo> = new Map();
  private currentQuestion: ServerQuestionInfo | null = null;

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
        case "message":
          this.handleChatMessage(server, data);
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
        message: "You already have an active session in another tab",
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
    this.broadcastSystemMessage(`${userInfo.name} joined the chat`);
  }

  private isDuplicateSession(userId: string): boolean {
    return Array.from(this.sessions.values()).some(
      (user) => user.id === userId,
    );
  }

  private handleChatMessage(server: WebSocket, data: ClientChatMessage): void {
    const userInfo = this.sessions.get(server);
    if (!userInfo) return;

    this.broadcast({
      type: "message",
      message: data.message,
      user: userInfo,
    });
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

  private handleClose(server: WebSocket, event: CloseEvent): void {
    const userInfo = this.sessions.get(server);

    this.sessions.delete(server);
    this.broadcastUserList();

    if (userInfo) {
      this.broadcastSystemMessage(`${userInfo.name} left the chat`);
    }
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

  private broadcastSystemMessage(message: string): void {
    this.broadcast({
      type: "system",
      message: message,
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
