import { drizzle } from "drizzle-orm/d1";
import { createRequestHandler } from "react-router";
import { MyDurableObject } from "./durable-object";

export { MyDurableObject };

declare module "react-router" {
  export interface AppLoadContext {
    cloudflare: {
      env: Env;
      ctx: ExecutionContext;
    };
    db: ReturnType<typeof drizzle>;
    do: DurableObjectNamespace<MyDurableObject>;
  }
}

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const db = drizzle(env.banki_brunch_db);

    return requestHandler(request, {
      db,
      do: env.MY_DO,
      cloudflare: { env, ctx },
    });
  },
} satisfies ExportedHandler<Env>;
