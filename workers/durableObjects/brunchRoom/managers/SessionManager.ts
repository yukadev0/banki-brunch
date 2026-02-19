import type { BrunchRoom } from "../index";
import type {
  Identify,
  RequestSetTagPreferences,
  RequestTagChange,
  UserInfo,
} from "../types";

export default class SessionManager {
  private m_brunchRoom: BrunchRoom;
  private m_sessions: Map<WebSocket, UserInfo> = new Map();

  constructor(brunchRoom: BrunchRoom) {
    this.m_brunchRoom = brunchRoom;
  }

  public get sessions() {
    return this.m_sessions;
  }

  public getUserInfo(server: WebSocket) {
    return this.m_sessions.get(server);
  }

  public setUserInfo(server: WebSocket, userInfo: UserInfo) {
    this.m_sessions.set(server, userInfo);
  }

  public deleteSession(server: WebSocket) {
    this.m_sessions.delete(server);
  }

  public getSessionByUserId(id: string) {
    for (const [socket, user] of this.m_sessions) {
      if (user.id === id) return socket;
    }
    return null;
  }

  public getUserById(id: string) {
    for (const user of this.m_sessions.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  public getCurrentPresenter() {
    for (const [session, userInfo] of this.m_sessions) {
      if (userInfo.role === "presenter") {
        return { session, userInfo };
      }
    }
    return null;
  }

  public isPresenter(server: WebSocket) {
    const userInfo = this.m_sessions.get(server);
    return !!userInfo && userInfo.role === "presenter";
  }

  public getAllUsers() {
    return Array.from(this.m_sessions.values());
  }

  public handleIdentify(server: WebSocket, data: Identify) {
    const existingSession = this.getSessionByUserId(data.id);

    if (existingSession) {
      try {
        existingSession.close(1000, "Reconnected");
      } catch {}
      this.deleteSession(existingSession);
    }

    const userInfo: UserInfo = {
      id: data.id,
      role: "viewer",
      name: data.name,
      image: data.image,
      isLurking: true,
      preferredTags: data.preferredTags || [],
    };

    this.setUserInfo(server, userInfo);
    this.m_brunchRoom.broadcastUserList();

    this.m_brunchRoom.sendInitialStateToClient(server, userInfo);
  }

  public handleToggleLurking(server: WebSocket) {
    const userInfo = this.getUserInfo(server);
    if (!userInfo) return;

    userInfo.isLurking = !userInfo.isLurking;
    this.setUserInfo(server, userInfo);

    if (userInfo.role !== "presenter") {
      const queueManager = this.m_brunchRoom.getQueueManager();
      queueManager.updateViewerQueue(this.getAllUsers());
      this.m_brunchRoom.broadcastQueueUpdate();
    }

    this.m_brunchRoom.broadcastUserList();
  }

  public handleChangeRole(server: WebSocket) {
    const userInfo = this.getUserInfo(server);
    if (!userInfo) return;

    if (userInfo.role === "viewer") {
      const presenter = this.getCurrentPresenter();
      if (presenter) {
        this.m_brunchRoom.sendToClient(server, {
          type: "role_change_rejected",
          reason: "presenter_exists",
        });
        return;
      }
    }

    const newRole = userInfo.role === "viewer" ? "presenter" : "viewer";
    userInfo.role = newRole;

    if (newRole === "presenter") {
      this.m_brunchRoom.notifyHintListToPresenter();
    }

    this.setUserInfo(server, userInfo);

    const queueManager = this.m_brunchRoom.getQueueManager();
    queueManager.updateViewerQueue(this.getAllUsers());
    this.m_brunchRoom.broadcastQueueUpdate();
    this.m_brunchRoom.broadcast({
      type: "user_role_changed",
      id: userInfo.id,
      role: newRole,
    });
  }

  public handleSetTagPreferences(
    server: WebSocket,
    data: RequestSetTagPreferences,
  ) {
    const userInfo = this.getUserInfo(server);
    if (!userInfo) return;

    userInfo.preferredTags = data.tags;
    this.setUserInfo(server, userInfo);
    this.m_brunchRoom.broadcastUserList();
  }

  public handleRequestTagChange(server: WebSocket, data: RequestTagChange) {
    if (!this.isPresenter(server)) return;

    const targetSocket = this.getSessionByUserId(data.userId);
    if (targetSocket) {
      this.m_brunchRoom.sendToClient(targetSocket, {
        type: "tag_change_requested",
      });
    }
  }

  public handleClose(server: WebSocket) {
    const userInfo = this.getUserInfo(server);
    this.deleteSession(server);

    if (userInfo?.role === "presenter") {
      this.m_brunchRoom.resetPresenterState();
    }

    const queueManager = this.m_brunchRoom.getQueueManager();
    queueManager.updateViewerQueue(this.getAllUsers());
    this.m_brunchRoom.broadcastUserList();
  }

  public handleError(server: WebSocket, error: Event) {
    console.error("WebSocket error in DO:", error);
    const userInfo = this.getUserInfo(server);
    this.deleteSession(server);

    if (userInfo?.role === "presenter") {
      this.m_brunchRoom.resetPresenterState();
    }

    const queueManager = this.m_brunchRoom.getQueueManager();
    queueManager.updateViewerQueue(this.getAllUsers());
    this.m_brunchRoom.broadcastUserList();
  }
}
