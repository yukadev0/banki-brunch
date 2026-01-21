import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { questionsSchema } from "./question-schemas";
import { user } from "./schema";
import { sql } from "drizzle-orm";

export const answersSchema = sqliteTable("answers", {
  id: integer("id").primaryKey({ autoIncrement: true }),

  questionId: integer("question_id")
    .notNull()
    .references(() => questionsSchema.id, { onDelete: "cascade" }),

  content: text("content").notNull(),

  createdByUserId: text("created_by_user_id")
    .references(() => user.id)
    .notNull(),

  isValidated: integer("is_validated", { mode: "boolean" })
    .notNull()
    .default(false),

  validatedByUserId: integer("validated_by_user_id").references(() => user.id),

  isHiddenByDefault: integer("is_hidden_by_default", {
    mode: "boolean",
  })
    .notNull()
    .default(true),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

export const answerVotesSchema = sqliteTable("answer_votes", {
  answerId: integer("answer_id")
    .notNull()
    .references(() => answersSchema.id, { onDelete: "cascade" }),

  questionId: integer("question_id")
    .notNull()
    .references(() => questionsSchema.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  vote_type: text("vote_type", {
    enum: ["upvote", "downvote"],
  }).notNull(),
});
