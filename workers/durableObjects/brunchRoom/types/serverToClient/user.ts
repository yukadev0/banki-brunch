import type {
  RoleChangeRejectedReason,
  UserId,
  UserInfo,
  UserRole,
} from "../../types";

export type UserSnapshot = {
  type: "users_snapshot";
  users: UserInfo[];
};

export type UserRoleChanged = {
  type: "user_role_changed";
  id: UserId;
  role: UserRole;
};

export type RoleChangeRejected = {
  type: "role_change_rejected";
  reason: RoleChangeRejectedReason;
};

export type TagChangeRequested = {
  type: "tag_change_requested";
};
