import { relations } from "drizzle-orm/relations";
import { user, questions, answers, session, account, questionTags, questionVotes, answerVotes } from "./schema";

export const questionsRelations = relations(questions, ({one, many}) => ({
	user: one(user, {
		fields: [questions.createdByUserId],
		references: [user.id]
	}),
	answers: many(answers),
	questionTags: many(questionTags),
	questionVotes: many(questionVotes),
	answerVotes: many(answerVotes),
}));

export const userRelations = relations(user, ({many}) => ({
	questions: many(questions),
	answers_validatedByUserId: many(answers, {
		relationName: "answers_validatedByUserId_user_id"
	}),
	answers_createdByUserId: many(answers, {
		relationName: "answers_createdByUserId_user_id"
	}),
	sessions: many(session),
	accounts: many(account),
	questionVotes: many(questionVotes),
	answerVotes: many(answerVotes),
}));

export const answersRelations = relations(answers, ({one, many}) => ({
	user_validatedByUserId: one(user, {
		fields: [answers.validatedByUserId],
		references: [user.id],
		relationName: "answers_validatedByUserId_user_id"
	}),
	user_createdByUserId: one(user, {
		fields: [answers.createdByUserId],
		references: [user.id],
		relationName: "answers_createdByUserId_user_id"
	}),
	question: one(questions, {
		fields: [answers.questionId],
		references: [questions.id]
	}),
	answerVotes: many(answerVotes),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const questionTagsRelations = relations(questionTags, ({one}) => ({
	question: one(questions, {
		fields: [questionTags.questionId],
		references: [questions.id]
	}),
}));

export const questionVotesRelations = relations(questionVotes, ({one}) => ({
	user: one(user, {
		fields: [questionVotes.userId],
		references: [user.id]
	}),
	question: one(questions, {
		fields: [questionVotes.questionId],
		references: [questions.id]
	}),
}));

export const answerVotesRelations = relations(answerVotes, ({one}) => ({
	user: one(user, {
		fields: [answerVotes.userId],
		references: [user.id]
	}),
	question: one(questions, {
		fields: [answerVotes.questionId],
		references: [questions.id]
	}),
	answer: one(answers, {
		fields: [answerVotes.answerId],
		references: [answers.id]
	}),
}));