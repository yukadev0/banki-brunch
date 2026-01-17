import type { DrizzleD1Database } from "drizzle-orm/d1";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { eq, and } from "drizzle-orm";
import { usersTable } from "./user.repository";
import { QuestionsRepository, questionsTable } from "./question.repository";

export const answersTable = sqliteTable("answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  questionId: integer("question_id")
    .notNull()
    .references(() => questionsTable.id, { onDelete: "cascade" }),

  content: text("content").notNull(),

  createdByUserId: integer("created_by_user_id")
    .references(() => usersTable.id)
    .notNull(),

  isValidated: integer("is_validated", { mode: "boolean" })
    .notNull()
    .default(false),

  validatedByUserId: integer("validated_by_user_id").references(
    () => usersTable.id,
  ),

  isHiddenByDefault: integer("is_hidden_by_default", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(new Date()),
});

export type AnswerSelectArgs = typeof answersTable.$inferSelect;
export type AnswerInsertArgs = typeof answersTable.$inferInsert;

export const AnswersRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return db.select().from(answersTable);
  },

  async getById(db: DrizzleD1Database<any>, id: number) {
    const [answer] = await db
      .select()
      .from(answersTable)
      .where(eq(answersTable.id, id));

    return answer ?? null;
  },

  async getByQuestionId(db: DrizzleD1Database<any>, questionId: number) {
    const question = await QuestionsRepository.getById(db, questionId);

    if (!question) {
      throw new Error("Question not found");
    }

    const answers = await db
      .select()
      .from(answersTable)
      .where(eq(answersTable.questionId, questionId));

    const answersWithAuthors = await Promise.all(
      answers.map(async (answer) => {
        const author = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, answer.createdByUserId))
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
      .from(answersTable)
      .where(
        and(
          eq(answersTable.questionId, questionId),
          eq(answersTable.isValidated, true),
        ),
      );

    return answer ?? null;
  },

  async create(db: DrizzleD1Database<any>, data: AnswerInsertArgs) {
    if (!data.content || !data.questionId) {
      throw new Error("Missing required fields");
    }

    await db.insert(answersTable).values(data);
  },

  async validate(
    db: DrizzleD1Database<any>,
    answerId: number,
    validatedByUserId: number,
  ) {
    await db
      .update(answersTable)
      .set({
        isValidated: true,
        validatedByUserId,
      })
      .where(eq(answersTable.id, answerId));
  },

  async delete(db: DrizzleD1Database<any>, id: number) {
    await db.delete(answersTable).where(eq(answersTable.id, id));
  },
};
