import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schema";

export const createAuth = (env: Env) =>
  betterAuth({
    database: drizzleAdapter(drizzle(env.banki_brunch_db), {
      provider: "sqlite",
      schema: schema,
    }),
    socialProviders: {
      discord: {
        clientId: env.DISCORD_CLIENT_ID,
        clientSecret: env.DISCORD_CLIENT_SECRET,
      },
    },
  });

// Mocked auth for schema generation
export const auth = betterAuth({
  database: drizzleAdapter(drizzle({} as D1Database), {
    provider: "sqlite",
    schema: schema,
  }),
  socialProviders: {
    discord: {
      clientId: "",
      clientSecret: "",
    },
  },
});
