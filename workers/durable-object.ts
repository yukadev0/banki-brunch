import { DurableObject } from "cloudflare:workers";

export class MyDurableObject extends DurableObject<Env> {
  currentlyConnectedWebSockets = 0;
  private sessions: Set<WebSocket> = new Set();

  async fetch(request: Request): Promise<Response> {
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    server.accept();
    this.currentlyConnectedWebSockets += 1;
    this.sessions.add(server);

    this.broadcast(
      JSON.stringify({
        type: "system",
        message: `A user connected. Total: ${this.currentlyConnectedWebSockets}`,
        timestamp: new Date().toISOString(),
      }),
    );

    server.addEventListener("message", (event: MessageEvent) => {
      this.broadcast(
        JSON.stringify({
          type: "message",
          message: event.data,
          timestamp: new Date().toISOString(),
        }),
      );
    });

    server.addEventListener("close", (cls: CloseEvent) => {
      this.currentlyConnectedWebSockets -= 1;
      this.sessions.delete(server);

      this.broadcast(
        JSON.stringify({
          type: "system",
          message: `A user disconnected. Total: ${this.currentlyConnectedWebSockets}`,
          timestamp: new Date().toISOString(),
        }),
      );

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
    this.sessions.forEach((session) => {
      try {
        session.send(message);
      } catch (err) {
        console.error("Error broadcasting to session:", err);
        this.sessions.delete(session);
      }
    });
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
