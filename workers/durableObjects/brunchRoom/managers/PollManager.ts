import type { PollUpdate, UserId } from "../types";

export default class PollManager {
  private m_isPollActive: boolean = false;
  private m_pollVotes: Map<UserId, string> = new Map();
  private m_pollOptions: string[] = ["A", "B", "C", "D"];

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
}
