export type PollInfo = {
  options: string[];
  totalVotes: number;
  userVote: string | null;
  votes: Record<string, number>;
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
  poll: PollInfo;
};
