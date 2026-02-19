import type {
  RequestAddCustomHint,
  RequestDeleteHint,
  RequestGenerateHint,
  RequestToggleHintVisibility,
} from "./hint";
import type { RequestCastVote, RequestEndPoll, RequestStartPoll } from "./poll";
import type {
  RequestQuestion,
  RequestResetQuestions,
  RequestSkipUser,
} from "./question";
import type { RequestReaction } from "./reaction";
import type {
  Identify,
  RequestChangeRole,
  RequestSetTagPreferences,
  RequestTagChange,
  RequestToggleLurking,
} from "./user";

export type ClientMessage =
  | Identify
  | RequestEndPoll
  | RequestSkipUser
  | RequestQuestion
  | RequestCastVote
  | RequestReaction
  | RequestStartPoll
  | RequestTagChange
  | RequestDeleteHint
  | RequestChangeRole
  | RequestGenerateHint
  | RequestAddCustomHint
  | RequestToggleLurking
  | RequestResetQuestions
  | RequestSetTagPreferences
  | RequestToggleHintVisibility;
