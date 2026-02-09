import type { PollInfo } from "../../types";

export type PollEnded = {
  type: "poll_ended";
};

export type PollUpdate = {
  type: "poll_update";
  poll: PollInfo;
};
