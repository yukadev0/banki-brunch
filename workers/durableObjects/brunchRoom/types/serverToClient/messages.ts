import type {
  ActiveHintsSnapshot,
  HintError,
  HintGenerated,
  HintGenerating,
  HintsListSnapshot,
} from "./hint";
import type { PollEnded, PollUpdate } from "./poll";
import type {
  NoMatchingQuestion,
  Question,
  TargetedQuestion,
} from "./question";
import type { QueueUpdate } from "./queue";
import type {
  RoleChangeRejected,
  TagChangeRequested,
  UserRoleChanged,
  UserSnapshot,
} from "./user";

export type ServerMessage =
  | Question
  | HintError
  | PollEnded
  | PollUpdate
  | QueueUpdate
  | UserSnapshot
  | HintGenerated
  | HintGenerating
  | UserRoleChanged
  | TargetedQuestion
  | HintsListSnapshot
  | NoMatchingQuestion
  | TagChangeRequested
  | RoleChangeRejected
  | ActiveHintsSnapshot;
