import type { UserId } from "./user";

export type ServerQuestionInfo = {
  id: number;
  title: string;
  content: string;
};

export type ClientQuestionInfo = Omit<ServerQuestionInfo, "id">;

export type QuestionMessage = {
  type: "question";
  question: ClientQuestionInfo;
};

export type TargetedQuestionMessage = {
  type: "targeted_question";
  userId: UserId;
  question: ClientQuestionInfo;
};

export type NoMatchingQuestionMessage = {
  type: "no_matching_question";
};

export type GetQestionMessage = {
  type: "get_question";
};

export type GetRandomQuestionForUserMessage = {
  type: "get_random_question_for_user";
  userId: UserId;
};

export type SkipUserMessage = {
  type: "skip_user";
};

export type ResetQuestionsMessage = {
  type: "reset_questions";
};
