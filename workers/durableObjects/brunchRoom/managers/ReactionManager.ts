import type { BrunchRoom } from "..";
import type { RequestReaction } from "../types";

export default class ReactionManager {
  private m_brunchRoom: BrunchRoom;

  constructor(brunchRoom: BrunchRoom) {
    this.m_brunchRoom = brunchRoom;
  }

  public handleReaction(server: WebSocket, data: RequestReaction) {
    this.m_brunchRoom.broadcast({
      type: "handle_reaction",
      reaction: data.reaction,
      from: data.userId,
    });
  }
}
