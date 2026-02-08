import type {
  ActiveHintsMessage,
  AddCustomHintMessage,
  DeleteHintMessage,
  GenerateHintMessage,
  HintErrorMessage,
  HintGeneratedMessage,
  HintGeneratingMessage,
  HintsListMessage,
  ShowSelectedHintsMessage,
  ToggleHintMessage,
} from "./hint";
import type {
  CastVoteMessage,
  EndPollMessage,
  PollEndedMessage,
  PollUpdateMessage,
  StartPollMessage,
} from "./poll";
import type {
  GetQestionMessage,
  GetRandomQuestionForUserMessage,
  NoMatchingQuestionMessage,
  QuestionMessage,
  ResetQuestionsMessage,
  SkipUserMessage,
  TargetedQuestionMessage,
} from "./question";
import type { QueueUpdateMessage } from "./queue";
import type {
  ChangeRoleMessage,
  IdentifyMessage,
  RequestTagChangeMessage,
  RoleChangeRejectedMessage,
  SetTagPreferencesMessage,
  TagChangeRequestedMessage,
  ToggleLurkingMessage,
  UserSnapshotMessage,
} from "./user";

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
