import type { DrizzleD1Database } from "drizzle-orm/d1";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { eq } from "drizzle-orm";
import { usersTable } from "./user.repository";

export const questionsTable = sqliteTable("questions", {
  id: integer("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  }).default("pending"),
  createdByUserId: integer("created_by_user_id")
    .notNull()
    .references(() => usersTable.id),
});

export type QuestionSelectArgs = typeof questionsTable.$inferSelect;
export type QuestionInsertArgs = typeof questionsTable.$inferInsert;

export const QuestionsRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return await db.select().from(questionsTable);
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [result] = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, id));

    if (!result) {
      throw new Response("Question not found", { status: 404 });
    }

    return result;
  },

  async create(db: DrizzleD1Database<any>, data: QuestionInsertArgs) {
    if (!data.title || !data.content) {
      throw new Response("Missing required fields", { status: 400 });
    }

    return await db.insert(questionsTable).values(data);
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    return await db.delete(questionsTable).where(eq(questionsTable.id, id));
  },

  async updateStatus(
    db: DrizzleD1Database<any>,
    id: number,
    status: "pending" | "approved" | "rejected"
  ) {
    return await db
      .update(questionsTable)
      .set({ status })
      .where(eq(questionsTable.id, id));
  },
};
