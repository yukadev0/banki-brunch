export interface UserInfo {
  id: string;
  name: string;
  isLurking: boolean;
  role: "viewer" | "presenter";
  image?: string | null | undefined;
  preferredTags: string[];
}

export interface ServerQuestionInfo {
  id: number;
  title: string;
  content: string;
}

export type ClientQuestionInfo = Omit<ServerQuestionInfo, "id">;

export interface UsersMessage {
  type: "users";
  users: UserInfo[];
}

export interface QuestionMessage {
  type: "question";
  question: ClientQuestionInfo | null;
  forUserId?: string;
  forUserName?: string;
}

export interface NoMatchingQuestionMessage {
  type: "no_matching_question";
  for?: {
    id: string;
    name: string;
    tags: string[];
  };
}

export interface RequestTagChangeMessage {
  type: "request_tag_change";
  targetUserId: string;
}

export interface TagChangeRequestedMessage {
  type: "tag_change_requested";
}

export interface GetRandomQuestionForUserMessage {
  type: "get_random_question_for_user";
  targetUserId: string;
}

export interface IdentifyMessage {
  type: "identify";
  id: string;
  name: string;
  image?: string | null | undefined;
  preferredTags?: string[];
}

export interface ToggleLurkingMessage {
  type: "toggle_lurking";
}

export interface ChangeRoleMessage {
  type: "change_role";
}

export interface GetQestionMessage {
  type: "get_question";
}

export interface SetTagPreferencesMessage {
  type: "set_tag_preferences";
  tags: string[];
}

export interface SkipUserMessage {
  type: "skip_user";
}

export interface StartPollMessage {
  type: "start_poll";
}

export interface CastVoteMessage {
  type: "cast_vote";
  option: string;
}

export interface EndPollMessage {
  type: "end_poll";
}

export interface PollUpdateMessage {
  type: "poll_update";
  options: string[];
  votes: Record<string, number>;
  totalVotes: number;
  userVote: string | null;
}

export interface RoleChangeRejectedMessage {
  type: "role_change_rejected";
  reason: "presenter_exists";
  currentPresenterId: string;
  currentPresenterName: string;
}

export interface QueueUpdateMessage {
  type: "queue_update";
  queue: string[];
  currentIndex: number;
}

export interface ResetQuestionsMessage {
  type: "reset_questions";
}

export interface Hint {
  id: string;
  content: string;
  isVisible: boolean;
  createdBy: "ai" | "manual";
}

export interface GenerateHintMessage {
  type: "generate_hint";
}

export interface AddCustomHintMessage {
  type: "add_custom_hint";
  content: string;
}

export interface DeleteHintMessage {
  type: "delete_hint";
  hintId: string;
}

export interface ToggleHintMessage {
  type: "toggle_hint";
  hintId: string;
}

export interface ShowSelectedHintsMessage {
  type: "show_selected_hints";
}

export interface HintsListMessage {
  type: "hints_list";
  hints: Hint[];
}

export interface ActiveHintsMessage {
  type: "active_hints";
  hints: Hint[];
}

export interface HintGeneratingMessage {
  type: "hint_generating";
}

export interface HintErrorMessage {
  type: "hint_error";
  error: string;
}

export type ServerMessage =
  | UsersMessage
  | QuestionMessage
  | PollUpdateMessage
  | NoMatchingQuestionMessage
  | TagChangeRequestedMessage
  | QueueUpdateMessage
  | HintsListMessage
  | ActiveHintsMessage
  | RoleChangeRejectedMessage
  | HintGeneratingMessage
  | HintErrorMessage;

export type ClientMessage =
  | IdentifyMessage
  | ChangeRoleMessage
  | GetQestionMessage
  | ToggleLurkingMessage
  | StartPollMessage
  | CastVoteMessage
  | EndPollMessage
  | SetTagPreferencesMessage
  | RequestTagChangeMessage
  | GetRandomQuestionForUserMessage
  | SkipUserMessage
  | ResetQuestionsMessage
  | GenerateHintMessage
  | AddCustomHintMessage
  | DeleteHintMessage
  | ToggleHintMessage
  | ShowSelectedHintsMessage;
