import { useState } from "react";
import type {
  QueueInfo,
  UserId,
  UserInfo,
} from "workers/durableObjects/brunchRoom/types";

export type QeueManager = ReturnType<typeof useQueue>;

export default function useQueue(users: UserInfo[]) {
  const [queueData, setQueueData] = useState<QueueInfo | null>(null);

  function getQueuePosition(userId: UserId) {
    if (!queueData) return -1;
    return queueData.queue.indexOf(userId);
  }

  function isNextInQueue(userId: UserId) {
    if (!queueData || queueData.queue.length === 0) return false;
    return queueData.queue[queueData.currentQueueIndex] === userId;
  }

  function getNextInQueue() {
    if (!queueData || queueData.queue.length === 0) return undefined;
    return users.find(
      (user) => user.id === queueData.queue[queueData.currentQueueIndex],
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
