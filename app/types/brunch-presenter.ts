export interface UserInfo {
  name: string;
  image?: string;
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

export type ServerMessage =
  | SystemMessage
  | ChatMessage
  | UsersMessage
  | CountMessage;

export interface IdentifyMessage {
  type: "identify";
  name: string;
  image?: string;
}

export interface ClientChatMessage {
  type: "message";
  message: string;
}

export type ClientMessage = IdentifyMessage | ClientChatMessage;
