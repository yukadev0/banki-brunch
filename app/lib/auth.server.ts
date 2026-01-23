import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "../db/schemas/auth";

export const createAuth = (env: Env) =>
  betterAuth({
    plugins: [admin({ defaultRole: "user" })],
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
  plugins: [admin({ defaultRole: "user" })],
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
