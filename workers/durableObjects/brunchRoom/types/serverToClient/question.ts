import type { ClientQuestionInfo, UserId } from "../../types";

export type Question = {
  type: "question";
  question: ClientQuestionInfo;
};

export type TargetedQuestion = {
  type: "targeted_question";
  userId: UserId;
  question: ClientQuestionInfo;
};

export type NoMatchingQuestion = {
  type: "no_matching_question";
};
