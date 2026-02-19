import type { WebSocketHook } from "react-use-websocket/dist/lib/types";
import type {
  ClientMessage,
  RoleChangeRejectedReason,
  ServerMessage,
  UserId,
} from "workers/durableObjects/brunchRoom/types";
import HintManager from "./managers/HintManager";
import PollManager from "./managers/PollManager";
import QuestionManager from "./managers/QuestionManager";
import QueueManager from "./managers/QueueManager";
import UserManager from "./managers/UserManager";

export type BrunchRoomAppOptions = {
  onNoMatchingQuestion?: () => void;
  onTagChangeRequested?: () => void;
  onHintError?: (message: string) => void;
  onRoleChangeRejected?: (reason: RoleChangeRejectedReason) => void;
};

export default class BrunchRoomApp {
  private m_selfId: UserId;
  private m_webSocketHook: WebSocketHook | null = null;

  private m_userManager: UserManager;
  private m_pollManager: PollManager;
  private m_hintManager: HintManager;
  private m_queueManager: QueueManager;
  private m_questionManager: QuestionManager;

  private m_options: BrunchRoomAppOptions;

  constructor(selfId: UserId, options?: BrunchRoomAppOptions) {
    this.m_selfId = selfId;

    this.m_pollManager = new PollManager(this);
    this.m_hintManager = new HintManager(this);
    this.m_userManager = new UserManager(this);
    this.m_queueManager = new QueueManager(this);
    this.m_questionManager = new QuestionManager(this);

    this.m_options = options || {};
  }

  public setWebSocketHook(webSocketHook: WebSocketHook) {
    this.m_webSocketHook = webSocketHook;
  }

  public get selfId() {
    return this.m_selfId;
  }

  public get isSelfPresenter() {
    const user = this.m_userManager.getUserInfo(this.m_selfId);
    return !!user && user.role === "presenter";
  }

  public getPollManager() {
    return this.m_pollManager;
  }

  public getUserManager() {
    return this.m_userManager;
  }

  public getHintManager() {
    return this.m_hintManager;
  }

  public getQueueManager() {
    return this.m_queueManager;
  }

  public getQuestionManager() {
    return this.m_questionManager;
  }

  public sendToServer(message: ClientMessage) {
    if (!this.m_webSocketHook) return;
    try {
      this.m_webSocketHook.sendMessage(JSON.stringify(message));
    } catch (err) {
      console.error("Error sending to server:", err);
    }
  }

  public onWebSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data) as ServerMessage;

      switch (data.type) {
        case "handle_reaction":
          console.log(data);
          break;

        case "queue_update":
          this.m_queueManager.setQueueData(data.queue);
          break;

        case "no_matching_question":
          this.m_options.onNoMatchingQuestion?.();
          break;

        case "tag_change_requested":
          this.m_options.onTagChangeRequested?.();
          break;

        case "role_change_rejected":
          this.m_options.onRoleChangeRejected?.(data.reason);
          break;

        case "users_snapshot":
        case "user_role_changed":
          this.m_userManager.handleMessage(data);
          break;

        case "question":
        case "targeted_question":
          this.m_pollManager.reset();
          this.m_hintManager.reset();

          this.m_questionManager.handleMessage(data);
          break;

        case "poll_ended":
        case "poll_update":
          this.m_pollManager.handleMessage(data);
          break;

        case "hint_error":
          this.m_options.onHintError?.(data.error);
        case "hint_generated":
        case "hint_generating":
        case "hints_list_snapshot":
        case "active_hints_snapshot":
          this.m_hintManager.handleMessage(data);
          break;

        default:
          console.warn("Unknown message type:", (data as ServerMessage).type);
      }
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  };
}
