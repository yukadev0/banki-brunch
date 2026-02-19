import type { BrunchRoom } from "../index";
import type {
  HintInfo,
  RequestAddCustomHint,
  RequestDeleteHint,
  RequestToggleHintVisibility,
  ServerQuestionInfo,
} from "../types";

export default class HintManager {
  private m_brunchRoom: BrunchRoom;
  private m_ai: Ai<AiModels>;
  private m_hints: HintInfo[] = [];
  private readonly MAX_HINTS = 3;

  constructor(brunchRoom: BrunchRoom, ai: Ai<AiModels>) {
    this.m_brunchRoom = brunchRoom;
    this.m_ai = ai;
  }

  public getHints(): readonly HintInfo[] {
    return this.m_hints;
  }

  public getActiveHints() {
    return this.m_hints.filter((h) => h.isVisible);
  }

  public canAddHint() {
    return this.m_hints.length < this.MAX_HINTS;
  }

  public clearHints() {
    this.m_hints = [];
  }

  public addHint(hint: HintInfo) {
    if (!this.canAddHint()) {
      return false;
    }
    this.m_hints.push(hint);
    return true;
  }

  public deleteHint(hintId: string) {
    const initialLength = this.m_hints.length;
    this.m_hints = this.m_hints.filter((h) => h.id !== hintId);
    return this.m_hints.length < initialLength;
  }

  public toggleHint(hintId: string) {
    const hint = this.m_hints.find((h) => h.id === hintId);
    if (hint) {
      hint.isVisible = !hint.isVisible;
      return true;
    }
    return false;
  }

  public async generateHint(currentQuestion: ServerQuestionInfo | null) {
    if (!this.m_ai) {
      return { success: false, error: "AI not configured" };
    }
    if (!currentQuestion) {
      return { success: false, error: "No question available" };
    }
    if (!this.canAddHint()) {
      return { success: false, error: "Maximum number of hints reached" };
    }

    try {
      const response = await this.m_ai.run(
        "@cf/mistral/mistral-7b-instruct-v0.1",
        {
          messages: [
            {
              role: "system",
              content:
                "You are a helpful assistant that provides hints for technical interview questions. Provide concise, helpful hints that guide the candidate toward the answer without giving it away completely. Keep hints under 100 words.",
            },
            {
              role: "user",
              content: `Question Title: ${currentQuestion.title}\n\nQuestion: ${currentQuestion.content}\n\nProvide a helpful hint to solve this question. The hint should guide thinking but not give the full answer.`,
            },
          ],
        },
      );

      if (!this.canAddHint()) {
        return { success: false, error: "Maximum number of hints reached" };
      }

      const hintContent = response.response || "Unable to generate hint";

      const newHint: HintInfo = {
        id: crypto.randomUUID(),
        content: hintContent,
        isVisible: false,
        createdBy: "ai",
      };

      this.addHint(newHint);
      return { success: true, hint: newHint };
    } catch (error) {
      console.error("Error generating hint:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to generate hint";
      return { success: false, error: errorMessage };
    }
  }

  public addCustomHint(content: string) {
    if (!this.canAddHint()) {
      return { success: false, error: "Maximum number of hints reached" };
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return { success: false, error: "Hint content cannot be empty" };
    }

    const newHint: HintInfo = {
      id: crypto.randomUUID(),
      content: trimmedContent.slice(0, 500),
      isVisible: false,
      createdBy: "manual",
    };

    this.addHint(newHint);
    return { success: true, hint: newHint };
  }

  public async handleGenerateHint(server: WebSocket) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    this.m_brunchRoom.sendToClient(server, { type: "hint_generating" });

    const questionService = this.m_brunchRoom.getQuestionService();
    const result = await this.generateHint(questionService.currentQuestion);

    if (result.success) {
      this.m_brunchRoom.notifyHintListToPresenter();
      this.m_brunchRoom.sendToClient(server, { type: "hint_generated" });
    } else {
      this.m_brunchRoom.sendToClient(server, {
        type: "hint_error",
        error: result.error || "Failed to generate hint",
      });
    }
  }

  public handleAddCustomHint(server: WebSocket, data: RequestAddCustomHint) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    const result = this.addCustomHint(data.content);

    if (result.success) {
      this.m_brunchRoom.notifyHintListToPresenter();
    } else {
      this.m_brunchRoom.sendToClient(server, {
        type: "hint_error",
        error: result.error || "Failed to add hint",
      });
    }
  }

  public handleDeleteHint(server: WebSocket, data: RequestDeleteHint) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    const activeHintCount = this.getActiveHints().length;

    this.deleteHint(data.hintId);
    this.m_brunchRoom.notifyHintListToPresenter();

    if (activeHintCount > 0) {
      this.m_brunchRoom.broadcastActiveHints();
    }
  }

  public handleToggleHint(
    server: WebSocket,
    data: RequestToggleHintVisibility,
  ) {
    const sessionManager = this.m_brunchRoom.getSessionManager();
    if (!sessionManager.isPresenter(server)) return;

    this.toggleHint(data.hintId);
    this.m_brunchRoom.notifyHintListToPresenter();
    this.m_brunchRoom.broadcastActiveHints();
  }
}
