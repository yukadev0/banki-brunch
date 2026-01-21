import type { answersSchema } from "~/db/schemas/answer";

export type AnswerSelectArgs = typeof answersSchema.$inferSelect;
export type AnswerInsertArgs = typeof answersSchema.$inferInsert;
