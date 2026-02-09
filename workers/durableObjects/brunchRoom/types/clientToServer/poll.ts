export type RequestStartPoll = {
  type: "request_start_poll";
};

export type RequestEndPoll = {
  type: "request_end_poll";
};

export type RequestCastVote = {
  type: "request_cast_vote";
  option: string;
};
