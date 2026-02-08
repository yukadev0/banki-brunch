import type { UserInfo } from "./types";

export class SessionManager {
  private viewerQueue: string[] = [];
  private currentQueueIndex: number = 0;
  private _sessions: Map<WebSocket, UserInfo> = new Map();

  get sessions() {
    return this._sessions;
  }

  getUserInfo(server: WebSocket) {
    return this._sessions.get(server);
  }

  setUserInfo(server: WebSocket, userInfo: UserInfo) {
    this._sessions.set(server, userInfo);
  }

  deleteSession(server: WebSocket) {
    this._sessions.delete(server);
  }

  getSessionByUserId(id: string) {
    for (const [socket, user] of this._sessions) {
      if (user.id === id) return socket;
    }
    return null;
  }

  getUserById(id: string) {
    for (const user of this._sessions.values()) {
      if (user.id === id) return user;
    }
    return null;
  }

  getCurrentPresenter() {
    for (const [session, userInfo] of this._sessions) {
      if (userInfo.role === "presenter") {
        return { session, userInfo };
      }
    }
    return null;
  }

  isPresenter(server: WebSocket) {
    const userInfo = this._sessions.get(server);
    return !!userInfo && userInfo.role === "presenter";
  }

  getAllUsers() {
    return Array.from(this._sessions.values());
  }

  updateViewerQueue() {
    const activeViewers = Array.from(this._sessions.values())
      .filter((user) => user.role === "viewer" && !user.isLurking)
      .map((user) => user.id);

    const newQueue = this.viewerQueue.filter((id) =>
      activeViewers.includes(id),
    );

    for (const id of activeViewers) {
      if (!newQueue.includes(id)) {
        newQueue.push(id);
      }
    }

    const currentId = this.viewerQueue[this.currentQueueIndex];
    this.viewerQueue = newQueue;
    this.currentQueueIndex = this.viewerQueue.indexOf(currentId);
    if (this.currentQueueIndex === -1) {
      this.currentQueueIndex = 0;
    }
  }

  getNextViewer() {
    if (this.viewerQueue.length === 0) return null;

    const startIndex = this.currentQueueIndex;
    let index = startIndex;

    do {
      const id = this.viewerQueue[index];
      const user = this.getUserById(id);

      if (user && user.role === "viewer" && !user.isLurking) {
        this.currentQueueIndex = index;
        return user;
      }

      index = (index + 1) % this.viewerQueue.length;
    } while (index !== startIndex);

    return null;
  }

  advanceQueue() {
    if (this.viewerQueue.length === 0) return;
    this.currentQueueIndex =
      (this.currentQueueIndex + 1) % this.viewerQueue.length;
  }

  getQueueState() {
    return {
      queue: this.viewerQueue,
      currentQueueIndex: this.currentQueueIndex,
    };
  }

  hasQueue() {
    return this.viewerQueue.length > 0;
  }
}
