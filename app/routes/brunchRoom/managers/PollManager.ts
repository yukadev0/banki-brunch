import type {
  PollInfo,
  ServerMessage,
} from "workers/durableObjects/brunchRoom/types";
import type BrunchRoomApp from "../BrunchRoomApp";

export default class PollManager {
  private m_isEnded = false;
  private m_brunchApp: BrunchRoomApp;
  private m_pollData: PollInfo | null = null;

  constructor(brunchApp: BrunchRoomApp) {
    this.m_brunchApp = brunchApp;
  }

  public get isEnded() {
    return this.m_isEnded;
  }

  public get pollData() {
    return this.m_pollData;
  }

  public reset() {
    this.m_isEnded = false;
    this.m_pollData = null;
  }

  public handleMessage(data: ServerMessage) {
    switch (data.type) {
      case "poll_ended":
        this.m_isEnded = true;
        break;
      case "poll_update":
        this.m_pollData = data.poll;
        break;
    }
  }
}
