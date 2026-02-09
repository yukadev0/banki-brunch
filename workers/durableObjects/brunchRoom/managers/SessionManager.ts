import type { UserInfo } from "../types";

export default class SessionManager {
  private m_viewerQueue: string[] = [];
  private m_currentQueueIndex: number = 0;
  private m_sessions: Map<WebSocket, UserInfo> = new Map();

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

  public updateViewerQueue() {
    const activeViewers = Array.from(this.m_sessions.values())
      .filter((user) => user.role === "viewer" && !user.isLurking)
      .map((user) => user.id);

    const newQueue = this.m_viewerQueue.filter((id) =>
      activeViewers.includes(id),
    );

    for (const id of activeViewers) {
      if (!newQueue.includes(id)) {
        newQueue.push(id);
      }
    }

    const currentId = this.m_viewerQueue[this.m_currentQueueIndex];
    this.m_viewerQueue = newQueue;
    this.m_currentQueueIndex = this.m_viewerQueue.indexOf(currentId);
    if (this.m_currentQueueIndex === -1) {
      this.m_currentQueueIndex = 0;
    }
  }

  public getNextViewer() {
    if (this.m_viewerQueue.length === 0) return null;

    const startIndex = this.m_currentQueueIndex;
    let index = startIndex;

    do {
      const id = this.m_viewerQueue[index];
      const user = this.getUserById(id);

      if (user && user.role === "viewer" && !user.isLurking) {
        this.m_currentQueueIndex = index;
        return user;
      }

      index = (index + 1) % this.m_viewerQueue.length;
    } while (index !== startIndex);

    return null;
  }

  public advanceQueue() {
    if (this.m_viewerQueue.length === 0) return;
    this.m_currentQueueIndex =
      (this.m_currentQueueIndex + 1) % this.m_viewerQueue.length;
  }

  public getQueueState() {
    return {
      queue: this.m_viewerQueue,
      currentQueueIndex: this.m_currentQueueIndex,
    };
  }

  public hasQueue() {
    return this.m_viewerQueue.length > 0;
  }
}
