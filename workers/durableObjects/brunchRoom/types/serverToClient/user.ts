import type { UserInfo } from "../../types";

export type UserSnapshot = {
  type: "users_snapshot";
  users: UserInfo[];
};

export type RoleChangeRejected = {
  type: "role_change_rejected";
  reason: "presenter_exists";
};

export type TagChangeRequested = {
  type: "tag_change_requested";
};
