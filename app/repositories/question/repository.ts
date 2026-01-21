import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, sql, and } from "drizzle-orm";
import { user } from "~/db/schema";
import {
  questionsSchema,
  questionTagsSchema,
  questionVotesSchema,
} from "~/db/question-schemas";
import type { QuestionInsertArgs } from "./types";
import { tagsSchema } from "~/db/tag-schema";

export const QuestionsRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    const rows = await db
      .select({
        question: questionsSchema,
        author: user,
        tags: questionTagsSchema,
      })
      .from(questionsSchema)
      .innerJoin(user, eq(user.id, questionsSchema.createdByUserId))
      .innerJoin(
        questionTagsSchema,
        eq(questionsSchema.id, questionTagsSchema.questionId),
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
        question: questionsSchema,
        author: user,
        tags: questionTagsSchema,
      })
      .from(questionsSchema)
      .where(eq(questionsSchema.id, id))
      .limit(1)
      .innerJoin(user, eq(user.id, questionsSchema.createdByUserId))
      .innerJoin(
        questionTagsSchema,
        eq(questionTagsSchema.questionId, questionsSchema.id),
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
      .from(questionsSchema)
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

    const id = (await db.insert(questionsSchema).values(data)).meta.last_row_id;

    await db
      .insert(questionTagsSchema)
      .values({ questionId: id, tags: data.tags || [] });
  },

  async update(
    db: DrizzleD1Database<any>,
    id: number,
    data: Partial<QuestionInsertArgs & { tags: string[] }>,
  ) {
    const { tags, ...questionUpdate } = data;

    if (tags) {
      const allTags = await db.select().from(tagsSchema);

      const validTags = tags.filter((tag) =>
        allTags.some((t) => t.name === tag),
      );

      await db
        .update(questionTagsSchema)
        .set({ tags: validTags })
        .where(eq(questionTagsSchema.questionId, id));
    }

    await db
      .update(questionsSchema)
      .set(questionUpdate)
      .where(eq(questionsSchema.id, id));
  },

  async getUpvotes(db: DrizzleD1Database<any>, questionId: number) {
    const votes = await db
      .select()
      .from(questionVotesSchema)
      .where(
        and(
          eq(questionVotesSchema.vote_type, "upvote"),
          eq(questionVotesSchema.questionId, questionId),
        ),
      );

    return votes.length;
  },

  async getDownvotes(db: DrizzleD1Database<any>, questionId: number) {
    const votes = await db
      .select()
      .from(questionVotesSchema)
      .where(
        and(
          eq(questionVotesSchema.vote_type, "downvote"),
          eq(questionVotesSchema.questionId, questionId),
        ),
      );

    return votes.length;
  },

  async upvote(db: DrizzleD1Database<any>, questionId: number, userId: string) {
    const [vote] = await db
      .select()
      .from(questionVotesSchema)
      .where(
        and(
          eq(questionVotesSchema.questionId, questionId),
          eq(questionVotesSchema.userId, userId),
        ),
      );

    if (!vote) {
      await db
        .insert(questionVotesSchema)
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
      .from(questionVotesSchema)
      .where(
        and(
          eq(questionVotesSchema.questionId, questionId),
          eq(questionVotesSchema.userId, userId),
        ),
      );

    if (!vote) {
      await db
        .insert(questionVotesSchema)
        .values({ questionId, userId, vote_type: "downvote" });
    }
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(questionsSchema).where(eq(questionsSchema.id, id));
  },
};
