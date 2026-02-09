import type { UserId } from "../../types";

export type Identify = {
  type: "identify";
  id: UserId;
  name: string;
  image: string | null;
  preferredTags?: string[];
};

export type RequestTagChange = {
  type: "request_tag_change";
  userId: UserId;
};

export type RequestChangeRole = {
  type: "request_change_role";
};

export type RequestToggleLurking = {
  type: "request_toggle_lurking";
};

export type RequestSetTagPreferences = {
  type: "request_set_tag_preferences";
  tags: string[];
};
