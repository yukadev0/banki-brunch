import type { BrunchRoom } from "../index";
import type { UserInfo } from "../types";

export default class QueueManager {
  private m_brunchRoom: BrunchRoom;
  private m_viewerQueue: string[] = [];
  private m_currentQueueIndex: number = 0;

  constructor(brunchRoom: BrunchRoom) {
    this.m_brunchRoom = brunchRoom;
  }

  public get viewerQueue() {
    return this.m_viewerQueue;
  }

  public get currentQueueIndex() {
    return this.m_currentQueueIndex;
  }

  public updateViewerQueue(activeViewers: UserInfo[]) {
    const viewerIds = activeViewers
      .filter((user) => user.role === "viewer" && !user.isLurking)
      .map((user) => user.id);

    const newQueue = this.m_viewerQueue.filter((id) => viewerIds.includes(id));

    for (const id of viewerIds) {
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

  public getNextViewer(): UserInfo | null {
    if (this.m_viewerQueue.length === 0) return null;

    const startIndex = this.m_currentQueueIndex;
    let index = startIndex;

    do {
      const id = this.m_viewerQueue[index];
      const user = this.m_brunchRoom.getSessionManager().getUserById(id);

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

  public resetQueue() {
    this.m_viewerQueue = [];
    this.m_currentQueueIndex = 0;
  }
}
