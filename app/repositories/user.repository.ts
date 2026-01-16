import type { DrizzleD1Database } from "drizzle-orm/d1";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  discordId: text("discord_id").unique(),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),

  role: text("role", {
    enum: ["user", "admin", "moderator"],
  })
    .notNull()
    .default("user"),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});

export type UserSelectArgs = typeof usersTable.$inferSelect;
export type UserInsertArgs = typeof usersTable.$inferInsert;

export const UsersRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return db.select().from(usersTable);
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    return user ?? null;
  },

  async getByDiscordId(db: DrizzleD1Database<any>, discordId: string) {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.discordId, discordId));

    return user ?? null;
  },

  async create(db: DrizzleD1Database<any>, data: UserInsertArgs) {
    if (!data.username) {
      throw new Error("Username is required");
    }

    return await db.insert(usersTable).values(data);
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(usersTable).where(eq(usersTable.id, id));
  },
};
