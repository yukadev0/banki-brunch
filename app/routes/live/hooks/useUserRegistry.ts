import { useState } from "react";
import type {
  QueueUpdateMessage,
  UserInfo,
} from "workers/durableObjects/brunchRoom/types";

export default function useUserRegistry(
  selfId: string,
  queueData: QueueUpdateMessage | null,
) {
  const [users, setUsers] = useState<UserInfo[]>([]);

  function getSelf() {
    return users.find((user) => user.id === selfId);
  }

  function getById(id: string) {
    return users.find((user) => user.id === id);
  }

  function getPresenter() {
    return users.find((user) => user.role === "presenter");
  }

  function getActiveViewers() {
    return users.filter((user) => user.role === "viewer" && !user.isLurking);
  }

  function getLurkers() {
    return users.filter((user) => user.isLurking);
  }

  function getCount() {
    return users.length;
  }

  function hasUser(id: string) {
    return users.some((user) => user.id === id);
  }

  function getQueuePosition(userId: string) {
    if (!queueData) return null;
    const index = queueData.queue.indexOf(userId);
    return index >= 0 ? index : null;
  }

  function isNextInQueue(userId: string) {
    if (!queueData || queueData.queue.length === 0) return false;
    return queueData.queue[queueData.currentIndex] === userId;
  }

  function getNextInQueue() {
    if (!queueData || queueData.queue.length === 0) return null;
    return users.find(
      (user) => user.id === queueData.queue[queueData.currentIndex],
    );
  }

  return {
    getSelf,
    users,
    getById,
    hasUser,
    setUsers,
    getCount,
    getLurkers,
    getPresenter,
    isNextInQueue,
    getNextInQueue,
    getActiveViewers,
    getQueuePosition,
  };
}
