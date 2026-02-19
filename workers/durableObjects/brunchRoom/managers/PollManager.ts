import type { BrunchRoom } from "../index";
import type { PollUpdate, RequestCastVote, UserId } from "../types";

export default class PollManager {
  private m_brunchRoom: BrunchRoom;
  private m_isPollActive: boolean = false;
  private m_pollVotes: Map<UserId, string> = new Map();
  private m_pollOptions: string[] = ["A", "B", "C", "D"];

  constructor(brunchRoom: BrunchRoom) {
    this.m_brunchRoom = brunchRoom;
  }

  public isActive() {
    return this.m_isPollActive;
  }

  public startPoll() {
    this.resetPoll();
    this.m_isPollActive = true;
  }

  public endPoll() {
    this.m_isPollActive = false;
  }

  public resetPoll() {
    this.m_pollVotes.clear();
    this.m_isPollActive = false;
  }

  public castVote(userId: UserId, option: string) {
    if (!this.m_isPollActive) return false;
    if (!this.m_pollOptions.includes(option)) return false;

    if (this.m_pollVotes.get(userId) === option) {
      this.m_pollVotes.delete(userId);
    } else {
      this.m_pollVotes.set(userId, option);
    }
    return true;
  }

  public getPollUpdate(userId: UserId): PollUpdate {
    const votes: Record<string, number> = {};
    for (const option of this.m_pollOptions) {
      votes[option] = 0;
    }
    for (const vote of this.m_pollVotes.values()) {
      if (votes[vote] !== undefined) {
        votes[vote]++;
      }
    }

    return {
      type: "poll_update",
      poll: {
        votes: votes,
        options: this.m_pollOptions,
        totalVotes: this.m_pollVotes.size,
        userVote: userId ? this.m_pollVotes.get(userId) || null : null,
      },
    };
  }

  public handleStartPoll(server: WebSocket) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    const questionService = this.m_brunchRoom.getQuestionService();
    if (!questionService.currentQuestion) return;

    this.startPoll();
    this.m_brunchRoom.broadcastPollUpdate();
  }

  public handleCastVote(server: WebSocket, data: RequestCastVote) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    const userInfo = sessionManager.getUserInfo(server);
    if (!userInfo) return;

    this.castVote(userInfo.id, data.option);
    this.m_brunchRoom.broadcastPollUpdate();
  }

  public handleEndPoll(server: WebSocket) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    this.endPoll();
    this.m_brunchRoom.broadcast({ type: "poll_ended" });
  }
}
