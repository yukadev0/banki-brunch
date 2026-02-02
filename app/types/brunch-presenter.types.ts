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
  forUserId: string;
  forUserName: string;
  requestedTags: string[];
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

export interface DuplicateSessionMessage {
  type: "duplicate_session";
}

export interface IdentifyMessage {
  type: "identify";
  id: string;
  name: string;
  image?: string | null | undefined;
  preferredTags?: string[];
}

export interface ClientChatMessage {
  type: "message";
  message: string;
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

export type ServerMessage =
  | UsersMessage
  | QuestionMessage
  | DuplicateSessionMessage
  | PollUpdateMessage
  | NoMatchingQuestionMessage
  | TagChangeRequestedMessage
  | QueueUpdateMessage;

export interface QueueUpdateMessage {
  type: "queue_update";
  queue: string[];
  currentIndex: number;
}

export type ClientMessage =
  | IdentifyMessage
  | ClientChatMessage
  | ChangeRoleMessage
  | GetQestionMessage
  | ToggleLurkingMessage
  | StartPollMessage
  | CastVoteMessage
  | EndPollMessage
  | SetTagPreferencesMessage
  | RequestTagChangeMessage
  | GetRandomQuestionForUserMessage
  | SkipUserMessage;
