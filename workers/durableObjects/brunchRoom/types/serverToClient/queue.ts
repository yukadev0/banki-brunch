import type { QueueInfo } from "../../types";

export type QueueUpdate = {
  type: "queue_update";
  queue: QueueInfo;
};
