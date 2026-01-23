import type {
  questionsSchema,
  questionTagsSchema,
  questionVotesSchema,
} from "~/db/schemas/question";

export type QuestionSelectArgs = typeof questionsSchema.$inferSelect;
export type QuestionInsertArgs = typeof questionsSchema.$inferInsert;

export type QuestionVotesSelectArgs = typeof questionVotesSchema.$inferSelect;
export type QuestionVotesInsertArgs = typeof questionVotesSchema.$inferInsert;

export type QuestionTagsSelectArgs = typeof questionTagsSchema.$inferSelect;
export type QuestionTagsInsertArgs = typeof questionTagsSchema.$inferInsert;
