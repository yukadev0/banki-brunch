export interface UserInfo {
  id: string;
  name: string;
  isLurking: boolean;
  role: "viewer" | "presenter";
  image?: string | null | undefined;
}

export interface BaseMessage {
  timestamp: string;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  message: string;
}

export interface UsersMessage extends BaseMessage {
  type: "users";
  users: UserInfo[];
}

export interface CountMessage extends BaseMessage {
  type: "count";
  value: number;
}

export interface DuplicateSessionMessage extends BaseMessage {
  type: "duplicate_session";
  message: string;
}

export type ServerMessage =
  | UsersMessage
  | CountMessage
  | SystemMessage
  | DuplicateSessionMessage;

export type DisplayMessage =
  | CountMessage
  | SystemMessage
  | DuplicateSessionMessage;

export interface IdentifyMessage {
  type: "identify";
  id: string;
  name: string;
  image?: string | null | undefined;
}

export interface ClientChatMessage {
  type: "message";
  message: string;
}

export interface ToggleLurkingMessage {
  type: "toggle_lurking";
}

export interface ChangeRoleMessage {
  type: "change_role";
}

export type ClientMessage =
  | IdentifyMessage
  | ClientChatMessage
  | ToggleLurkingMessage
  | ChangeRoleMessage;
