import { useState } from "react";
import type { UserInfo } from "workers/durableObjects/brunchRoom/types";

export type UserRegistry = ReturnType<typeof useUserRegistry>;

export default function useUserRegistry(selfId: string) {
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

  return {
    users,
    getSelf,
    getById,
    hasUser,
    setUsers,
    getCount,
    getLurkers,
    getPresenter,
    getActiveViewers,
  };
}
