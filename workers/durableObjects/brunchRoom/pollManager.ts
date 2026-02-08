import type { PollUpdateMessage } from "./types";

export class PollManager {
  private isPollActive: boolean = false;
  private pollVotes: Map<string, string> = new Map();
  private pollOptions: string[] = ["A", "B", "C", "D"];

  startPoll() {
    this.resetPoll();
    this.isPollActive = true;
  }

  endPoll() {
    this.isPollActive = false;
  }

  resetPoll() {
    this.pollVotes.clear();
    this.isPollActive = false;
  }

  castVote(userId: string, option: string) {
    if (!this.isPollActive) return false;
    if (!this.pollOptions.includes(option)) return false;

    if (this.pollVotes.get(userId) === option) {
      this.pollVotes.delete(userId);
    } else {
      this.pollVotes.set(userId, option);
    }
    return true;
  }

  isActive() {
    return this.isPollActive;
  }

  getPollUpdate(userId: string | null): PollUpdateMessage {
    const votes: Record<string, number> = {};
    for (const option of this.pollOptions) {
      votes[option] = 0;
    }
    for (const vote of this.pollVotes.values()) {
      if (votes[vote] !== undefined) {
        votes[vote]++;
      }
    }

    return {
      type: "poll_update",
      votes: votes,
      options: this.pollOptions,
      totalVotes: this.pollVotes.size,
      userVote: userId ? this.pollVotes.get(userId) || null : null,
    };
  }

  getAllPollUpdates(sessions: Map<WebSocket, { id: string }>) {
    const updates = new Map<WebSocket, PollUpdateMessage>();

    for (const [session, userInfo] of sessions) {
      updates.set(session, this.getPollUpdate(userInfo.id));
    }

    return updates;
  }
}
