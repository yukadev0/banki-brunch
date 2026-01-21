import type { questionsSchema } from "~/db/schemas/question";
import type { QuestionsRepository } from "./repository";

export type QuestionSelectArgs = typeof questionsSchema.$inferSelect;
export type QuestionInsertArgs = typeof questionsSchema.$inferInsert;

export type GetAllQuestionsArgs = Awaited<
  ReturnType<typeof QuestionsRepository.getAll>
>;

export type GetAllQuestionArgs = GetAllQuestionsArgs[0];
