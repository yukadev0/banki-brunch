import type { answersSchema, answerVotesSchema } from "~/db/schemas/answer";

export type AnswerSelectArgs = typeof answersSchema.$inferSelect;
export type AnswerInsertArgs = typeof answersSchema.$inferInsert;

export type AnswerVotesSelectArgs = typeof answerVotesSchema.$inferSelect;
export type AnswerVotesInsertArgs = typeof answerVotesSchema.$inferInsert;
