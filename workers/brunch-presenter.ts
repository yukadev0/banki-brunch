import { DurableObject } from "cloudflare:workers";
import type { ClientMessage, UserInfo } from "../app/types/brunch-presenter";

export class BrunchPresenter extends DurableObject<Env> {
  currentlyConnectedWebSockets = 0;
  private sessions: Map<WebSocket, UserInfo> = new Map();

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    this.currentlyConnectedWebSockets += 1;
    this.sessions.set(server, { name: "Anonymous", image: undefined });

    server.addEventListener("message", (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as ClientMessage;

        if (data.type === "identify") {
          const userInfo: UserInfo = {
            name: data.name || "Anonymous",
            image: data.image,
          };
          this.sessions.set(server, userInfo);

          this.broadcastUserList();

          this.broadcast(
            JSON.stringify({
              type: "system",
              message: `${userInfo.name} joined the chat`,
              timestamp: new Date().toISOString(),
            }),
          );
        } else if (data.type === "message") {
          const userInfo = this.sessions.get(server);
          this.broadcast(
            JSON.stringify({
              type: "message",
              message: data.message,
              user: userInfo,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      } catch (err) {
        this.broadcast(
          JSON.stringify({
            type: "message",
            message: event.data,
            timestamp: new Date().toISOString(),
          }),
        );
      }
    });

    server.addEventListener("close", (cls: CloseEvent) => {
      const userInfo = this.sessions.get(server);
      this.currentlyConnectedWebSockets -= 1;
      this.sessions.delete(server);

      this.broadcastUserList();

      if (userInfo) {
        this.broadcast(
          JSON.stringify({
            type: "system",
            message: `${userInfo.name} left the chat`,
            timestamp: new Date().toISOString(),
          }),
        );
      }

      server.close(cls.code, "Durable Object is closing WebSocket");
    });

    server.addEventListener("error", (error) => {
      console.error("WebSocket error in DO:", error);
      this.sessions.delete(server);
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  broadcast(message: string) {
    this.sessions.forEach((_, session) => {
      try {
        session.send(message);
      } catch (err) {
        console.error("Error broadcasting to session:", err);
        this.sessions.delete(session);
      }
    });
  }

  broadcastUserList() {
    const users = Array.from(this.sessions.values());
    this.broadcast(
      JSON.stringify({
        type: "users",
        users: users,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
