import type { DrizzleD1Database } from "drizzle-orm/d1";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { eq, sql } from "drizzle-orm";
import { user } from "~/db/schema";
import { tagsTable } from "./tags.repository";

export const questionsTable = sqliteTable("questions", {
  id: integer("id").primaryKey(),

  title: text("title").notNull(),
  content: text("content").notNull(),

  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .default("pending"),

  interviewCount: integer("interview_count").notNull().default(0),

  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

export const questionTagsTable = sqliteTable("question_tags", {
  questionId: integer("question_id")
    .notNull()
    .references(() => questionsTable.id, { onDelete: "cascade" }),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
});

export type QuestionSelectArgs = typeof questionsTable.$inferSelect;
export type QuestionInsertArgs = typeof questionsTable.$inferInsert;
export type GetAllQuestionsArgs = Awaited<
  ReturnType<typeof QuestionsRepository.getAll>
>;

export const QuestionsRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    const rows = await db
      .select({
        question: questionsTable,
        author: user,
        tags: questionTagsTable,
      })
      .from(questionsTable)
      .innerJoin(user, eq(user.id, questionsTable.createdByUserId))
      .innerJoin(
        questionTagsTable,
        eq(questionTagsTable.questionId, questionsTable.id),
      );

    return rows.map((row) => ({
      ...row.question,
      tags: row.tags.tags,
      author: row.author,
    }));
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [question] = await db
      .select({
        question: questionsTable,
        author: user,
        tags: questionTagsTable,
      })
      .from(questionsTable)
      .where(eq(questionsTable.id, id))
      .limit(1)
      .innerJoin(user, eq(user.id, questionsTable.createdByUserId))
      .innerJoin(
        questionTagsTable,
        eq(questionTagsTable.questionId, questionsTable.id),
      );

    if (!question) {
      throw new Error("Question not found");
    }

    return {
      ...question.question,
      author: question.author,
      tags: question.tags.tags,
    };
  },

  async getRandom(db: DrizzleD1Database<any>) {
    const [question] = await db
      .select()
      .from(questionsTable)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    return question;
  },

  async create(
    db: DrizzleD1Database<any>,
    data: QuestionInsertArgs & { tags: string[] },
  ) {
    if (!data.title || !data.content) {
      throw new Error("Missing required fields");
    }

    const id = (await db.insert(questionsTable).values(data)).meta.last_row_id;

    if (data.tags.length > 0) {
      await db
        .update(questionTagsTable)
        .set({ tags: data.tags })
        .where(eq(questionTagsTable.questionId, id));
    }
  },

  async update(
    db: DrizzleD1Database<any>,
    id: number,
    data: Partial<QuestionInsertArgs & { tags: string[] }>,
  ) {
    const { tags, ...questionUpdate } = data;

    if (tags) {
      const allTags = await db.select().from(tagsTable);

      const validTags = tags.filter((tag) =>
        allTags.some((t) => t.name === tag),
      );

      await db
        .update(questionTagsTable)
        .set({ tags: validTags })
        .where(eq(questionTagsTable.questionId, id));
    }

    await db
      .update(questionsTable)
      .set(questionUpdate)
      .where(eq(questionsTable.id, id));
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(questionsTable).where(eq(questionsTable.id, id));
  },
};
