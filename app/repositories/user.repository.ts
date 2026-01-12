import type { DrizzleD1Database } from "drizzle-orm/d1";
import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";

export const usersTable = sqliteTable("users", {
  id: integer("id").primaryKey().notNull(),
  name: text("name").notNull(),
});

export type UserSelectArgs = typeof usersTable.$inferSelect;
export type UserInsertArgs = typeof usersTable.$inferInsert;

export const UsersRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return await db.select().from(usersTable);
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [result] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id));

    if (!result) {
      throw new Response("User not Found", { status: 404 });
    }

    return result;
  },

  async create(db: DrizzleD1Database<any>, data: UserInsertArgs) {
    if (!data.name) {
      throw new Response("Name is required", { status: 400 });
    }

    return await db.insert(usersTable).values(data);
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    return await db.delete(usersTable).where(eq(usersTable.id, id));
  },
};
