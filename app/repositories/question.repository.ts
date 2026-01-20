import type { DrizzleD1Database } from "drizzle-orm/d1";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { eq, sql, and } from "drizzle-orm";
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

export const questionVotesTable = sqliteTable("question_votes", {
  questionId: integer("question_id")
    .notNull()
    .references(() => questionsTable.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  vote_type: text("vote_type", {
    enum: ["upvote", "downvote"],
  }).notNull(),
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
        eq(questionsTable.id, questionTagsTable.questionId),
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

    await db
      .insert(questionTagsTable)
      .values({ questionId: id, tags: data.tags || [] });
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

  async getUpvotes(db: DrizzleD1Database<any>, questionId: number) {
    const votes = await db
      .select()
      .from(questionVotesTable)
      .where(
        and(
          eq(questionVotesTable.vote_type, "upvote"),
          eq(questionVotesTable.questionId, questionId),
        ),
      );

    return votes.length;
  },

  async getDownvotes(db: DrizzleD1Database<any>, questionId: number) {
    const votes = await db
      .select()
      .from(questionVotesTable)
      .where(
        and(
          eq(questionVotesTable.vote_type, "downvote"),
          eq(questionVotesTable.questionId, questionId),
        ),
      );

    return votes.length;
  },

  async upvote(db: DrizzleD1Database<any>, questionId: number, userId: string) {
    const [vote] = await db
      .select()
      .from(questionVotesTable)
      .where(
        and(
          eq(questionVotesTable.questionId, questionId),
          eq(questionVotesTable.userId, userId),
        ),
      );

    if (!vote) {
      await db
        .insert(questionVotesTable)
        .values({ questionId, userId, vote_type: "upvote" });
    }
  },

  async downvote(
    db: DrizzleD1Database<any>,
    questionId: number,
    userId: string,
  ) {
    const [vote] = await db
      .select()
      .from(questionVotesTable)
      .where(
        and(
          eq(questionVotesTable.questionId, questionId),
          eq(questionVotesTable.userId, userId),
        ),
      );

    if (!vote) {
      await db
        .insert(questionVotesTable)
        .values({ questionId, userId, vote_type: "downvote" });
    }
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(questionsTable).where(eq(questionsTable.id, id));
  },
};
