import type { Reaction, UserId } from "../../types";

export type HandleReaction = {
  type: "handle_reaction";
  reaction: Reaction;
  from: UserId;
};
