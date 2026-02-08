import { drizzle } from "drizzle-orm/d1";
import { createRequestHandler } from "react-router";
import { BrunchRoom } from "./durableObjects/brunchRoom";

export { BrunchRoom };

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: ReturnType<typeof drizzle>;
    do: DurableObjectNamespace<BrunchRoom>;
    ai: Ai<AiModels>;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    if (request.method === "GET" && request.url.endsWith("/websocket")) {
      const upgradeHeader = request.headers.get("Upgrade");
      if (!upgradeHeader || upgradeHeader !== "websocket") {
        return new Response(null, {
          status: 426,
          statusText: "Durable Object expected Upgrade: websocket",
          headers: {
            "Content-Type": "text/plain",
          },
        });
      }

      let stub = env.brunch_room.getByName("foo");

      return stub.fetch(request);
    }

    const db = drizzle(env.banki_brunch_db);

    return requestHandler(request, {
      db,
      ai: env.question_ai,
      do: env.brunch_room,
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
