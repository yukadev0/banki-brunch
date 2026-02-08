import type { UserId } from "./user";

export type QueueInfo = {
  queue: UserId[];
  currentQueueIndex: number;
};

export type QueueUpdateMessage = {
  type: "queue_update";
  queue: QueueInfo;
};
