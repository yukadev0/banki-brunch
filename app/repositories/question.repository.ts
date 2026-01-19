import type { DrizzleD1Database } from "drizzle-orm/d1";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { eq, sql } from "drizzle-orm";
import { user } from "~/db/schema";

export const questionsTable = sqliteTable("questions", {
  id: integer("id").primaryKey(),

  title: text("title").notNull(),
  content: text("content").notNull(),

  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),

  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .default("pending"),

  upvotes: integer("upvotes").notNull().default(0),
  downvotes: integer("downvotes").notNull().default(0),

  interviewCount: integer("interview_count").notNull().default(0),

  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});

export type QuestionSelectArgs = typeof questionsTable.$inferSelect;
export type QuestionInsertArgs = typeof questionsTable.$inferInsert;
export type GetAllQuestionsArgs = Awaited<
  ReturnType<typeof QuestionsRepository.getAll>
>;

export const QuestionsRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    const questions = await db.select().from(questionsTable).all();

    const questionsWithAuthors = await Promise.all(
      questions.map(async (question) => {
        const author = await db
          .select()
          .from(user)
          .where(eq(user.id, question.createdByUserId))
          .limit(1)
          .then(([user]) => user);

        return { ...question, author };
      }),
    );

    return questionsWithAuthors;
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [question] = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, id));

    if (!question) {
      throw new Error("Question not found");
    }

    const author = await db
      .select()
      .from(user)
      .where(eq(user.id, question.createdByUserId))
      .limit(1)
      .then(([user]) => user);

    return { ...question, author };
  },

  async getApproved(db: DrizzleD1Database<any>) {
    return db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.status, "approved"));
  },

  async incrementInterviewCount(db: DrizzleD1Database<any>, id: number) {
    await db
      .update(questionsTable)
      .set({
        interviewCount: sql`${questionsTable.interviewCount} + 1`,
      })
      .where(eq(questionsTable.id, id));
  },

  async create(db: DrizzleD1Database<any>, data: QuestionInsertArgs) {
    if (!data.title || !data.content) {
      throw new Error("Missing required fields");
    }

    await db.insert(questionsTable).values(data);
  },

  async updateStatus(
    db: DrizzleD1Database<any>,
    id: number,
    status: "pending" | "approved" | "rejected",
  ) {
    await db
      .update(questionsTable)
      .set({ status })
      .where(eq(questionsTable.id, id));
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(questionsTable).where(eq(questionsTable.id, id));
  },
};
