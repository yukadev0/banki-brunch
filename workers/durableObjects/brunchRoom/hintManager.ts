import type { HintInfo, ServerQuestionInfo } from "./types";

export class HintManager {
  private ai: Ai<AiModels>;
  private _hints: HintInfo[] = [];
  private readonly MAX_HINTS = 3;

  constructor(ai: Ai<AiModels>) {
    this.ai = ai;
  }

  get hints() {
    return this._hints;
  }

  getActiveHints() {
    return this._hints.filter((h) => h.isVisible);
  }

  canAddHint() {
    return this._hints.length < this.MAX_HINTS;
  }

  clearHints() {
    this._hints = [];
  }

  addHint(hint: HintInfo) {
    if (!this.canAddHint()) {
      return false;
    }
    this._hints.push(hint);
    return true;
  }

  deleteHint(hintId: string) {
    const initialLength = this._hints.length;
    this._hints = this._hints.filter((h) => h.id !== hintId);
    return this._hints.length < initialLength;
  }

  toggleHint(hintId: string) {
    const hint = this._hints.find((h) => h.id === hintId);
    if (hint) {
      hint.isVisible = !hint.isVisible;
      return true;
    }
    return false;
  }

  async generateHint(currentQuestion: ServerQuestionInfo | null) {
    if (!this.ai) {
      return { success: false, error: "AI not configured" };
    }
    if (!currentQuestion) {
      return { success: false, error: "No question available" };
    }
    if (!this.canAddHint()) {
      return { success: false, error: "Maximum number of hints reached" };
    }

    try {
      const response = await this.ai.run(
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

  addCustomHint(content: string) {
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
}
