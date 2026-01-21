import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq, and } from "drizzle-orm";
import { user } from "~/db/schema";
import { answersSchema } from "~/db/answer-schemas";
import { QuestionsRepository } from "../question/repository";
import type { AnswerInsertArgs } from "./types";

export const AnswersRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return db.select().from(answersSchema);
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [answer] = await db
      .select()
      .from(answersSchema)
      .where(eq(answersSchema.id, id));

    return answer ?? null;
  },

  async getByQuestionId(db: DrizzleD1Database<any>, questionId: number) {
    const question = await QuestionsRepository.getById(db, questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    const answers = await db
      .select()
      .from(answersSchema)
      .where(eq(answersSchema.questionId, questionId));

    const answersWithAuthors = await Promise.all(
      answers.map(async (answer) => {
        const author = await db
          .select()
          .from(user)
          .where(eq(user.id, answer.createdByUserId))
          .limit(1)
          .then(([user]) => user);

        return {
          ...answer,
          author,
        };
      }),
    );

    return answersWithAuthors;
  },

  async getCuratedByQuestionId(db: DrizzleD1Database<any>, questionId: number) {
    const [answer] = await db
      .select()
      .from(answersSchema)
      .where(
        and(
          eq(answersSchema.questionId, questionId),
          eq(answersSchema.isValidated, true),
        ),
      );

    return answer ?? null;
  },

  async create(db: DrizzleD1Database<any>, data: AnswerInsertArgs) {
    if (!data.content || !data.questionId) {
      throw new Error("Missing required fields");
    }

    await db.insert(answersSchema).values(data);
  },

  async validate(
    db: DrizzleD1Database<any>,
    answerId: number,
    validatedByUserId: number,
  ) {
    await db
      .update(answersSchema)
      .set({
        isValidated: true,
        validatedByUserId,
      })
      .where(eq(answersSchema.id, answerId));
  },

  // async upvote(db: DrizzleD1Database<any>, answerId: number) {
  //   await db
  //     .update(answersTable)
  //     .set({
  //       upvotes: sql`${answersTable.upvotes} + 1`,
  //     })
  //     .where(eq(answersTable.id, answerId));
  // },

  // async downvote(db: DrizzleD1Database<any>, answerId: number) {
  //   await db
  //     .update(answersTable)
  //     .set({
  //       downvotes: sql`${answersTable.downvotes} + 1`,
  //     })
  //     .where(eq(answersTable.id, answerId));
  // },

  async update(db: DrizzleD1Database<any>, id: number, data: AnswerInsertArgs) {
    const answer = await this.getById(db, id);

    if (!answer) {
      throw new Error("Answer not found");
    }

    await db.update(answersSchema).set(data).where(eq(answersSchema.id, id));
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(answersSchema).where(eq(answersSchema.id, id));
  },
};
