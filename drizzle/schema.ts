import { sqliteTable, AnySQLiteColumn, foreignKey, check, integer, text, index } from "drizzle-orm/sqlite-core"
  import { sql } from "drizzle-orm"

export const questions = sqliteTable("questions", {
	id: integer().primaryKey(),
	title: text().notNull(),
	content: text().notNull(),
	status: text().default("pending").notNull(),
	interviewCount: integer("interview_count").default(0).notNull(),
	createdByUserId: text("created_by_user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	createdAt: integer("created_at").default(sql`(CAST(strftime('%s','now') * 1000 AS INTEGER))`).notNull(),
},
(table) => [
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const answers = sqliteTable("answers", {
	id: integer().primaryKey({ autoIncrement: true }),
	questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" } ),
	content: text().notNull(),
	createdByUserId: text("created_by_user_id").notNull().references(() => user.id),
	upvotes: integer().default(0).notNull(),
	downvotes: integer().default(0).notNull(),
	isValidated: integer("is_validated").default(0).notNull(),
	validatedByUserId: text("validated_by_user_id").references(() => user.id),
	isHiddenByDefault: integer("is_hidden_by_default").default(1).notNull(),
	createdAt: integer("created_at").default(sql`(CAST(strftime('%s','now') * 1000 AS INTEGER))`).notNull(),
},
(table) => [
	index("idx_answers_validated_by_user_id").on(table.validatedByUserId),
	index("idx_answers_created_by_user_id").on(table.createdByUserId),
	index("idx_answers_question_id").on(table.questionId),
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const user = sqliteTable("user", {
	id: text().primaryKey(),
	name: text().notNull(),
	email: text().notNull(),
	emailVerified: integer("email_verified").default(0).notNull(),
	image: text(),
	createdAt: integer("created_at").default(sql`(CAST(unixepoch('subsecond') * 1000 AS INTEGER))`).notNull(),
	updatedAt: integer("updated_at").default(sql`(CAST(unixepoch('subsecond') * 1000 AS INTEGER))`).notNull(),
},
(table) => [
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const session = sqliteTable("session", {
	id: text().primaryKey(),
	expiresAt: integer("expires_at").notNull(),
	token: text().notNull(),
	createdAt: integer("created_at").default(sql`(CAST(unixepoch('subsecond') * 1000 AS INTEGER))`).notNull(),
	updatedAt: integer("updated_at").notNull(),
	ipAddress: text("ip_address"),
	userAgent: text("user_agent"),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
},
(table) => [
	index("session_userId_idx").on(table.userId),
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const account = sqliteTable("account", {
	id: text().primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: integer("access_token_expires_at"),
	refreshTokenExpiresAt: integer("refresh_token_expires_at"),
	scope: text(),
	password: text(),
	createdAt: integer("created_at").default(sql`(CAST(unixepoch('subsecond') * 1000 AS INTEGER))`).notNull(),
	updatedAt: integer("updated_at").notNull(),
},
(table) => [
	index("account_userId_idx").on(table.userId),
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const verification = sqliteTable("verification", {
	id: text().primaryKey(),
	identifier: text().notNull(),
	value: text().notNull(),
	expiresAt: integer("expires_at").notNull(),
	createdAt: integer("created_at").default(sql`(CAST(unixepoch('subsecond') * 1000 AS INTEGER))`).notNull(),
	updatedAt: integer("updated_at").default(sql`(CAST(unixepoch('subsecond') * 1000 AS INTEGER))`).notNull(),
},
(table) => [
	index("verification_identifier_idx").on(table.identifier),
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const questionTags = sqliteTable("question_tags", {
	questionId: integer("question_id").primaryKey().references(() => questions.id, { onDelete: "cascade" } ),
	tags: text().default("[]").notNull(),
},
(table) => [
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const questionVotes = sqliteTable("question_votes", {
	questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	voteType: text("vote_type").notNull(),
},
(table) => [
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const answerVotes = sqliteTable("answer_votes", {
	answerId: integer("answer_id").notNull().references(() => answers.id, { onDelete: "cascade" } ),
	questionId: integer("question_id").notNull().references(() => questions.id, { onDelete: "cascade" } ),
	userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" } ),
	voteType: text("vote_type").notNull(),
},
(table) => [
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

export const tags = sqliteTable("tags", {
	name: text().primaryKey(),
},
(table) => [
	check("question_votes_check_1", sql`vote_type IN ('upvote', 'downvote'`),
	check("answer_votes_check_2", sql`vote_type IN ('upvote', 'downvote'`),
]);

