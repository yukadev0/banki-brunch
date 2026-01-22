import type {
  questionsSchema,
  questionTagsSchema,
  questionVotesSchema,
} from "~/db/schemas/question";
import type { QuestionsRepository } from "./repository";

export type QuestionSelectArgs = typeof questionsSchema.$inferSelect;
export type QuestionInsertArgs = typeof questionsSchema.$inferInsert;

export type QuestionVotesSelectArgs = typeof questionVotesSchema.$inferSelect;
export type QuestionVotesInsertArgs = typeof questionVotesSchema.$inferInsert;

export type QuestionTagsSelectArgs = typeof questionTagsSchema.$inferSelect;
export type QuestionTagsInsertArgs = typeof questionTagsSchema.$inferInsert;

export type GetAllQuestionsArgs = Awaited<
  ReturnType<typeof QuestionsRepository.getAll>
>;
export type GetAllQuestionArgs = GetAllQuestionsArgs[0];
