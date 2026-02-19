import type { Reaction, UserId } from "../../types";

export type RequestReaction = {
  type: "request_reaction";
  reaction: Reaction;
  userId: UserId;
};
