import type {
  QueueInfo,
  UserId,
} from "workers/durableObjects/brunchRoom/types";
import type BrunchRoomApp from "../BrunchRoomApp";

export default class QueueManager {
  private m_brunchApp: BrunchRoomApp;
  private m_queueData: QueueInfo | null = null;

  constructor(brunchApp: BrunchRoomApp) {
    this.m_brunchApp = brunchApp;
  }

  public get queueData() {
    return this.m_queueData;
  }

  public setQueueData(queueData: QueueInfo) {
    this.m_queueData = queueData;
  }

  public getQueuePosition(userId: UserId) {
    if (!this.m_queueData) return -1;
    return this.m_queueData.queue.indexOf(userId);
  }

  public isNextInQueue(userId: UserId) {
    if (!this.m_queueData || this.m_queueData.queue.length === 0) return false;
    return (
      this.m_queueData.queue[this.m_queueData.currentQueueIndex] === userId
    );
  }

  public getNextUserId() {
    if (!this.m_queueData || this.m_queueData.queue.length === 0)
      return undefined;
    return this.m_queueData.queue[this.m_queueData.currentQueueIndex];
  }

  public reset() {
    this.m_queueData = null;
  }
}
