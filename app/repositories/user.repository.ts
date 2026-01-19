import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { user } from "~/db/schema";

// export const usersTable = sqliteTable("users", {
//   id: integer("id").primaryKey({ autoIncrement: true }).notNull(),

//   discordId: text("discord_id").unique(),
//   username: text("username").notNull(),
//   avatarUrl: text("avatar_url"),

//   role: text("role", {
//     enum: ["user", "admin", "moderator"],
//   })
//     .notNull()
//     .default("user"),

//   createdAt: integer("created_at", { mode: "timestamp" })
//     .notNull()
//     .default(new Date()),
// });

export type UserSelectArgs = typeof user.$inferSelect;
export type UserInsertArgs = typeof user.$inferInsert;

export const UsersRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return db.select().from(user);
  },

  async getById(db: DrizzleD1Database<any>, id: string) {
    const [u] = await db
      .select()
      .from(user)
      .where(eq(user.id, id));

    return u ?? null;
  },

  async create(db: DrizzleD1Database<any>, data: UserInsertArgs) {
    if (!data.name) {
      throw new Error("Username is required");
    }

    await db.insert(user).values(data);
  },

  async delete(db: DrizzleD1Database<any>, id: string) {
    await db.delete(user).where(eq(user.id, id));
  },
};
