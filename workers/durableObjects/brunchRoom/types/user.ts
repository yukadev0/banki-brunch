export type UserId = string;

export type UserInfo = {
  id: UserId;
  name: string;
  isLurking: boolean;
  image: string | null;
  preferredTags: string[];
  role: "viewer" | "presenter";
};

export type IdentifyMessage = {
  type: "identify";
  id: UserId;
  name: string;
  image: string | null;
  preferredTags?: string[];
};

export type UserSnapshotMessage = {
  type: "users_snapshot";
  users: UserInfo[];
};

export type ToggleLurkingMessage = {
  type: "toggle_lurking";
};

export type ChangeRoleMessage = {
  type: "change_role";
};

export type SetTagPreferencesMessage = {
  type: "set_tag_preferences";
  tags: string[];
};

export type RequestTagChangeMessage = {
  type: "request_tag_change";
  userId: UserId;
};

export type TagChangeRequestedMessage = {
  type: "tag_change_requested";
};

export type RoleChangeRejectedMessage = {
  type: "role_change_rejected";
  reason: "presenter_exists";
};
