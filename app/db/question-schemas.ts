import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { user } from "./schema";

export const questionsSchema = sqliteTable("questions", {
  id: integer("id").primaryKey(),

  title: text("title").notNull(),
  content: text("content").notNull(),

  status: text("status", {
    enum: ["pending", "approved", "rejected"],
  })
    .notNull()
    .default("pending"),

  interviewCount: integer("interview_count").notNull().default(0),

  createdByUserId: text("created_by_user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
});

export const questionVotesSchema = sqliteTable("question_votes", {
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

export const questionTagsSchema = sqliteTable("question_tags", {
  questionId: integer("question_id")
    .notNull()
    .references(() => questionsSchema.id, { onDelete: "cascade" }),
  tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
});
