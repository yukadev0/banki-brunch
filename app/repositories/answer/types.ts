import type { answersSchema } from "~/db/answer-schemas";

export type AnswerSelectArgs = typeof answersSchema.$inferSelect;
export type AnswerInsertArgs = typeof answersSchema.$inferInsert;
