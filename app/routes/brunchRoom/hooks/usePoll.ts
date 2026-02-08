import { useState } from "react";
import type {
  PollUpdateMessage,
  ServerMessage,
} from "workers/durableObjects/brunchRoom/types";

export type PollManager = ReturnType<typeof usePoll>;

export default function usePoll() {
  const [pollEnded, setPollEnded] = useState(false);
  const [pollData, setPollData] = useState<PollUpdateMessage | null>(null);

  function reset() {
    setPollData(null);
    setPollEnded(false);
  }

  function handleMessage(data: ServerMessage) {
    switch (data.type) {
      case "poll_ended":
        setPollEnded(true);
        break;
      case "poll_update":
        setPollData(data);
        break;
    }
  }

  return {
    reset,
    pollData,
    pollEnded,
    setPollData,
    setPollEnded,
    handleMessage,
  };
}
