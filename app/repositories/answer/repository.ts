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
      .select({
        answer: answersSchema,
        author: user,
      })
      .from(answersSchema)
      .where(eq(answersSchema.id, id))
      .limit(1)
      .innerJoin(user, eq(user.id, answersSchema.createdByUserId));

    if (!answer) {
      throw new Error("Question not found");
    }

    return {
      ...answer.answer,
      author: answer.author,
    };
  },

  async getByQuestionId(db: DrizzleD1Database<any>, questionId: number) {
    const question = await QuestionsRepository.getById(db, questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    const answers = await db
      .select({
        answer: answersSchema,
        author: user,
      })
      .from(answersSchema)
      .where(eq(answersSchema.questionId, questionId))
      .limit(1)
      .innerJoin(user, eq(user.id, answersSchema.createdByUserId));

    return answers.map((answer) => ({
      ...answer.answer,
      author: answer.author,
    }));
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
