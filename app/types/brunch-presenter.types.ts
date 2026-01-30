export interface UserInfo {
  id: string;
  name: string;
  isLurking: boolean;
  image?: string | null | undefined;
}

export interface BaseMessage {
  timestamp: string;
}

export interface SystemMessage extends BaseMessage {
  type: "system";
  message: string;
}

export interface ChatMessage extends BaseMessage {
  type: "message";
  message: string;
  user?: UserInfo;
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
  | ChatMessage
  | UsersMessage
  | CountMessage
  | SystemMessage
  | DuplicateSessionMessage;

export type DisplayMessage =
  | ChatMessage
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

export type ClientMessage =
  | IdentifyMessage
  | ClientChatMessage
  | ToggleLurkingMessage;
