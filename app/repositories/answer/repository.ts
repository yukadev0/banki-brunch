import { and, eq, sql } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { answersSchema, answerVotesSchema } from "~/db/schemas/answer";
import { user } from "~/db/schemas/auth";
import type { AnswerInsertArgs } from "./types";

export const AnswersRepository = {
  async getAllByQuestionId(
    db: DrizzleD1Database<any>,
    questionId: number,
    userId: string,
  ) {
    const answers = await db
      .select({
        author: user,
        answer: answersSchema,
        vote: answerVotesSchema,
        voteCount: sql<number>`SUM(CASE WHEN ${answerVotesSchema.vote_type} = 'upvote' THEN 1 WHEN ${answerVotesSchema.vote_type} = 'downvote' THEN -1 ELSE 0 END)`,
      })
      .from(answersSchema)
      .where(eq(answersSchema.questionId, questionId))
      .innerJoin(user, eq(user.id, answersSchema.createdByUserId))
      .leftJoin(
        answerVotesSchema,
        and(
          eq(answerVotesSchema.userId, userId),
          eq(answerVotesSchema.questionId, questionId),
          eq(answerVotesSchema.answerId, answersSchema.id),
        ),
      )
      .groupBy(answersSchema.id, user.id);

    return answers.map((answer) => ({
      ...answer.answer,
      vote: answer.vote,
      author: answer.author,
      voteCount: answer.voteCount,
    }));
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [answer] = await db
      .select({
        author: user,
        answer: answersSchema,
        vote: answerVotesSchema,
        voteCount: sql<number>`SUM(CASE WHEN ${answerVotesSchema.vote_type} = 'upvote' THEN 1 WHEN ${answerVotesSchema.vote_type} = 'downvote' THEN -1 ELSE 0 END)`,
      })
      .from(answersSchema)
      .where(eq(answersSchema.id, id))
      .limit(1)
      .innerJoin(user, eq(user.id, answersSchema.createdByUserId))
      .leftJoin(
        answerVotesSchema,
        eq(answerVotesSchema.answerId, answersSchema.id),
      );

    return {
      ...answer.answer,
      vote: answer.vote,
      author: answer.author,
      voteCount: answer.voteCount,
    };
  },

  async create(db: DrizzleD1Database<any>, data: AnswerInsertArgs) {
    await db.insert(answersSchema).values(data);
  },

  async update(db: DrizzleD1Database<any>, id: number, data: AnswerInsertArgs) {
    await db.update(answersSchema).set(data).where(eq(answersSchema.id, id));
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(answersSchema).where(eq(answersSchema.id, id));
  },

  async vote(
    db: DrizzleD1Database<any>,
    userId: string,
    answerId: number,
    questionId: number,
    voteType: "upvote" | "downvote",
  ) {
    const [existingVote] = await db
      .select()
      .from(answerVotesSchema)
      .where(
        and(
          eq(answerVotesSchema.userId, userId),
          eq(answerVotesSchema.answerId, answerId),
          eq(answerVotesSchema.questionId, questionId),
        ),
      );

    if (!existingVote) {
      await db.insert(answerVotesSchema).values({
        userId,
        answerId,
        questionId,
        vote_type: voteType,
      });
      return;
    }

    if (existingVote.vote_type === voteType) {
      await db
        .delete(answerVotesSchema)
        .where(
          and(
            eq(answerVotesSchema.userId, userId),
            eq(answerVotesSchema.answerId, answerId),
            eq(answerVotesSchema.questionId, questionId),
          ),
        );
    } else {
      await db
        .update(answerVotesSchema)
        .set({ vote_type: voteType })
        .where(
          and(
            eq(answerVotesSchema.userId, userId),
            eq(answerVotesSchema.answerId, answerId),
            eq(answerVotesSchema.questionId, questionId),
          ),
        );
    }
  },
};
