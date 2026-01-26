import { and, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { user } from "~/db/schemas/auth";
import {
  questionsSchema,
  questionTagsSchema,
  questionValidationsSchema,
  questionVotesSchema,
} from "~/db/schemas/question";
import { tagsSchema } from "~/db/schemas/tag";
import type { QuestionInsertArgs, QuestionVotesSelectArgs } from "./types";

export const QuestionsRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    const rows = await db
      .select({
        question: questionsSchema,
        author: user,
        tags: questionTagsSchema,
        validated: questionValidationsSchema,
      })
      .from(questionsSchema)
      .innerJoin(user, eq(user.id, questionsSchema.createdByUserId))
      .innerJoin(
        questionTagsSchema,
        eq(questionsSchema.id, questionTagsSchema.questionId),
      )
      .leftJoin(
        questionValidationsSchema,
        eq(questionsSchema.id, questionValidationsSchema.questionId),
      );

    return rows.map((row) => ({
      ...row.question,
      tags: row.tags.tags,
      author: row.author,
      validated: row.validated,
    }));
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [question] = await db
      .select({
        question: questionsSchema,
        author: user,
        tags: questionTagsSchema,
        validated: questionValidationsSchema,
      })
      .from(questionsSchema)
      .where(eq(questionsSchema.id, id))
      .limit(1)
      .innerJoin(user, eq(user.id, questionsSchema.createdByUserId))
      .innerJoin(
        questionTagsSchema,
        eq(questionTagsSchema.questionId, questionsSchema.id),
      )
      .leftJoin(
        questionValidationsSchema,
        eq(questionValidationsSchema.questionId, questionsSchema.id),
      );

    if (!question) {
      throw new Error("Question not found");
    }

    return {
      ...question.question,
      author: question.author,
      tags: question.tags.tags,
      validated: question.validated,
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

  async getUserVote(
    db: DrizzleD1Database<any>,
    questionId: number,
    userId: string,
  ): Promise<QuestionVotesSelectArgs | undefined> {
    const [vote] = await db
      .select()
      .from(questionVotesSchema)
      .where(
        and(
          eq(questionVotesSchema.questionId, questionId),
          eq(questionVotesSchema.userId, userId),
        ),
      )
      .limit(1);

    return vote;
  },

  async getVoteCount(db: DrizzleD1Database<any>, questionId: number) {
    const [{ count }] = await db
      .select({
        count: sql<number>`SUM(CASE WHEN ${questionVotesSchema.vote_type} = 'upvote' THEN 1 WHEN ${questionVotesSchema.vote_type} = 'downvote' THEN -1 ELSE 0 END)`,
      })
      .from(questionVotesSchema)
      .where(eq(questionVotesSchema.questionId, questionId));

    return count || 0;
  },

  async create(
    db: DrizzleD1Database<any>,
    data: QuestionInsertArgs & { tags: string[] },
  ) {
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

      const validTags = tags.filter((tag: any) =>
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

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(questionsSchema).where(eq(questionsSchema.id, id));
  },

  async validate(
    db: DrizzleD1Database<any>,
    id: number,
    validatedByUserId: string,
  ) {
    const [v] = await db
      .select()
      .from(questionValidationsSchema)
      .where(eq(questionValidationsSchema.questionId, id));

    if (v) {
      await db
        .delete(questionValidationsSchema)
        .where(eq(questionValidationsSchema.questionId, id));
    } else {
      await db
        .insert(questionValidationsSchema)
        .values({ questionId: id, validatedByUserId });
    }
  },

  async vote(
    db: DrizzleD1Database<any>,
    questionId: number,
    userId: string,
    voteType: "upvote" | "downvote",
  ) {
    const [existingVote] = await db
      .select()
      .from(questionVotesSchema)
      .where(
        and(
          eq(questionVotesSchema.questionId, questionId),
          eq(questionVotesSchema.userId, userId),
        ),
      );

    if (!existingVote) {
      await db.insert(questionVotesSchema).values({
        questionId,
        userId,
        vote_type: voteType,
      });
      return;
    }

    if (existingVote.vote_type === voteType) {
      await db
        .delete(questionVotesSchema)
        .where(
          and(
            eq(questionVotesSchema.questionId, questionId),
            eq(questionVotesSchema.userId, userId),
          ),
        );
    } else {
      await db
        .update(questionVotesSchema)
        .set({ vote_type: voteType })
        .where(
          and(
            eq(questionVotesSchema.questionId, questionId),
            eq(questionVotesSchema.userId, userId),
          ),
        );
    }
  },
};
