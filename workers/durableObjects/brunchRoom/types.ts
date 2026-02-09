export * from "./types/clientToServer/hint";
export * from "./types/clientToServer/messages";
export * from "./types/clientToServer/poll";
export * from "./types/clientToServer/question";
export * from "./types/clientToServer/user";
export * from "./types/serverToClient/hint";
export * from "./types/serverToClient/messages";
export * from "./types/serverToClient/poll";
export * from "./types/serverToClient/question";
export * from "./types/serverToClient/queue";
export * from "./types/serverToClient/user";

export type UserId = string;
export type UserRole = "viewer" | "presenter";

export type RoleChangeRejectedReason = "presenter_exists";

export type UserInfo = {
  id: UserId;
  name: string;
  isLurking: boolean;
  image: string | null;
  preferredTags: string[];
  role: UserRole;
};

export type ServerQuestionInfo = {
  id: number;
  title: string;
  content: string;
};

export type ClientQuestionInfo = Omit<ServerQuestionInfo, "id">;

export type HintInfo = {
  id: string;
  content: string;
  isVisible: boolean;
  createdBy: "ai" | "manual";
};

export type PollInfo = {
  options: string[];
  totalVotes: number;
  userVote: string | null;
  votes: Record<UserId, number>;
};

export type QueueInfo = {
  queue: UserId[];
  currentQueueIndex: number;
};
