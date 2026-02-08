export type UserInfo = {
  id: string;
  name: string;
  isLurking: boolean;
  image: string | null;
  preferredTags: string[];
  role: "viewer" | "presenter";
};

export type IdentifyMessage = {
  type: "identify";
  id: string;
  name: string;
  image: string | null;
  preferredTags?: string[];
};

export type UserSnapshotMessage = {
  type: "users_snapshot";
  users: UserInfo[];
};

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
  userId: string;
  question: ClientQuestionInfo;
};

export type NoMatchingQuestionMessage = {
  type: "no_matching_question";
};

export type RequestTagChangeMessage = {
  type: "request_tag_change";
  userId: string;
};

export type TagChangeRequestedMessage = {
  type: "tag_change_requested";
};

export type GetRandomQuestionForUserMessage = {
  type: "get_random_question_for_user";
  userId: string;
};

export type ToggleLurkingMessage = {
  type: "toggle_lurking";
};

export type ChangeRoleMessage = {
  type: "change_role";
};

export type GetQestionMessage = {
  type: "get_question";
};

export type SetTagPreferencesMessage = {
  type: "set_tag_preferences";
  tags: string[];
};

export type SkipUserMessage = {
  type: "skip_user";
};

export type StartPollMessage = {
  type: "start_poll";
};

export type EndPollMessage = {
  type: "end_poll";
};

export type PollEndedMessage = {
  type: "poll_ended";
};

export type CastVoteMessage = {
  type: "cast_vote";
  option: string;
};

export type PollUpdateMessage = {
  type: "poll_update";
  options: string[];
  totalVotes: number;
  userVote: string | null;
  votes: Record<string, number>;
};

export type RoleChangeRejectedMessage = {
  type: "role_change_rejected";
  reason: "presenter_exists";
};

export type QueueUpdateMessage = {
  type: "queue_update";
  queue: string[];
  currentIndex: number;
};

export type ResetQuestionsMessage = {
  type: "reset_questions";
};

export type Hint = {
  id: string;
  content: string;
  isVisible: boolean;
  createdBy: "ai" | "manual";
};

export type GenerateHintMessage = {
  type: "generate_hint";
};

export type AddCustomHintMessage = {
  type: "add_custom_hint";
  content: string;
};

export type DeleteHintMessage = {
  type: "delete_hint";
  hintId: string;
};

export type ToggleHintMessage = {
  type: "toggle_hint";
  hintId: string;
};

export type ShowSelectedHintsMessage = {
  type: "show_selected_hints";
};

export type HintsListMessage = {
  type: "hints_list";
  hints: Hint[];
};

export type ActiveHintsMessage = {
  type: "active_hints";
  hints: Hint[];
};

export type HintGeneratingMessage = {
  type: "hint_generating";
};

export type HintGeneratedMessage = {
  type: "hint_generated";
};

export type HintErrorMessage = {
  type: "hint_error";
  error: string;
};

export type ServerMessage =
  | QuestionMessage
  | HintsListMessage
  | HintErrorMessage
  | PollEndedMessage
  | PollUpdateMessage
  | QueueUpdateMessage
  | ActiveHintsMessage
  | UserSnapshotMessage
  | HintGeneratedMessage
  | HintGeneratingMessage
  | TargetedQuestionMessage
  | NoMatchingQuestionMessage
  | TagChangeRequestedMessage
  | RoleChangeRejectedMessage;

export type ClientMessage =
  | EndPollMessage
  | IdentifyMessage
  | SkipUserMessage
  | CastVoteMessage
  | StartPollMessage
  | ChangeRoleMessage
  | GetQestionMessage
  | DeleteHintMessage
  | ToggleHintMessage
  | GenerateHintMessage
  | ToggleLurkingMessage
  | AddCustomHintMessage
  | ResetQuestionsMessage
  | RequestTagChangeMessage
  | SetTagPreferencesMessage
  | ShowSelectedHintsMessage
  | GetRandomQuestionForUserMessage;
