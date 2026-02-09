import type {
  HintInfo,
  ServerMessage,
} from "workers/durableObjects/brunchRoom/types";
import type BrunchRoomApp from "../BrunchRoomApp";

export default class HintManager {
  public readonly MAX_HINTS = 3;

  private m_isGenerating = false;
  private m_hints: HintInfo[] = [];
  private m_brunchApp: BrunchRoomApp;
  private m_activeHints: HintInfo[] = [];

  constructor(brunchApp: BrunchRoomApp) {
    this.m_brunchApp = brunchApp;
  }

  public getHints(): readonly HintInfo[] {
    return this.m_hints;
  }

  public get isGenerating() {
    return this.m_isGenerating;
  }

  public addHint(hint: HintInfo) {
    if (this.m_hints.length < this.MAX_HINTS) {
      this.m_hints.push(hint);
    }
  }

  public hintCount() {
    return this.m_hints.length;
  }

  public canGenerateHint() {
    return this.m_hints.length < this.MAX_HINTS && !this.m_isGenerating;
  }

  public get activeHints() {
    return this.m_activeHints;
  }

  public setHints(hints: HintInfo[]) {
    this.m_hints = hints;
  }

  public setActiveHints(activeHints: HintInfo[]) {
    this.m_activeHints = activeHints;
  }

  public reset() {
    this.setHints([]);
    this.setActiveHints([]);
    this.m_isGenerating = false;
  }

  public handleMessage(data: ServerMessage) {
    switch (data.type) {
      case "hints_list_snapshot":
        this.setHints(data.hints);
        break;
      case "active_hints_snapshot":
        this.setActiveHints(data.hints);
        break;
      case "hint_generating":
        this.m_isGenerating = true;
        break;
      case "hint_generated":
      case "hint_error":
        this.m_isGenerating = false;
        break;
    }
  }

  public handleRequestGenerateHint = () => {
    if (this.hintCount() < this.MAX_HINTS) {
      this.m_brunchApp.sendToServer({ type: "request_generate_hint" });
    }
  };

  public handleRequestAddCustomHint = (content: string) => {
    if (this.hintCount() < this.MAX_HINTS) {
      content = content.trim();
      if (content) {
        this.m_brunchApp.sendToServer({
          type: "request_add_custom_hint",
          content: content.slice(0, 500),
        });
      }
    }
  };

  public handleRequestDeleteHint = (hintId: string) => {
    if (this.m_brunchApp.isSelfPresenter) {
      this.m_brunchApp.sendToServer({ type: "request_delete_hint", hintId });
    }
  };

  public handleRequestToggleHintVisibility = (hintId: string) => {
    if (this.m_brunchApp.isSelfPresenter) {
      this.m_brunchApp.sendToServer({
        type: "request_toggle_hint_visibility",
        hintId,
      });
    }
  };
}
