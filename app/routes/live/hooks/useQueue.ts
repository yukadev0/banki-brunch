import { useState } from "react";
import type {
  QueueUpdateMessage,
  UserInfo,
} from "workers/durableObjects/brunchRoom/types";

export type QeueManager = ReturnType<typeof useQueue>;

export default function useQueue(users: UserInfo[]) {
  const [queueData, setQueueData] = useState<QueueUpdateMessage | null>(null);

  function getQueuePosition(userId: string) {
    if (!queueData) return -1;
    return queueData.queue.indexOf(userId);
  }

  function isNextInQueue(userId: string) {
    if (!queueData || queueData.queue.length === 0) return false;
    return queueData.queue[queueData.currentIndex] === userId;
  }

  function getNextInQueue() {
    if (!queueData || queueData.queue.length === 0) return undefined;
    return users.find(
      (user) => user.id === queueData.queue[queueData.currentIndex],
    );
  }

  return {
    queueData,
    setQueueData,
    getQueuePosition,
    isNextInQueue,
    getNextInQueue,
  };
}
