export interface UserInfo {
  id: string;
  name: string;
  isLurking: boolean;
  role: "viewer" | "presenter";
  image?: string | null | undefined;
}

export interface ServerQuestionInfo {
  id: number;
  title: string;
  content: string;
}

export type ClientQuestionInfo = Omit<ServerQuestionInfo, "id">;

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

export interface QuestionMessage extends BaseMessage {
  type: "question";
  question: ClientQuestionInfo;
}

export interface DuplicateSessionMessage extends BaseMessage {
  type: "duplicate_session";
  message: string;
}

export type DisplayMessage = SystemMessage | DuplicateSessionMessage;

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

export interface GetQestionMessage {
  type: "get_question";
}

export type ServerMessage =
  | UsersMessage
  | SystemMessage
  | DuplicateSessionMessage
  | QuestionMessage;

export type ClientMessage =
  | IdentifyMessage
  | ClientChatMessage
  | ToggleLurkingMessage
  | ChangeRoleMessage
  | GetQestionMessage;
