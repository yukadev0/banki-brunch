import { DurableObject } from "cloudflare:workers";

interface UserInfo {
  name: string;
  image?: string;
}

export class MyDurableObject extends DurableObject<Env> {
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
        const data = JSON.parse(event.data);

        if (data.type === "identify") {
          // Update user info when they identify themselves
          const userInfo: UserInfo = {
            name: data.name || "Anonymous",
            image: data.image,
          };
          this.sessions.set(server, userInfo);

          // Broadcast updated user list to all connected clients
          this.broadcastUserList();

          // Broadcast system message about user joining
          this.broadcast(
            JSON.stringify({
              type: "system",
              message: `${userInfo.name} joined the chat`,
              timestamp: new Date().toISOString(),
            }),
          );
        } else if (data.type === "message") {
          // Regular chat message
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
        // Fallback for plain text messages (backward compatibility)
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

      // Broadcast updated user list
      this.broadcastUserList();

      // Broadcast system message about user leaving
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

  async getValue() {
    const value = (await this.ctx.storage.get<number>("value")) ?? 0;
    return value;
  }

  async increaseValue() {
    const value = (await this.ctx.storage.get<number>("value")) ?? 0;
    await this.ctx.storage.put("value", value + 1);

    this.broadcast(
      JSON.stringify({
        type: "count",
        value: value + 1,
        timestamp: new Date().toISOString(),
      }),
    );

    return value + 1;
  }
}
