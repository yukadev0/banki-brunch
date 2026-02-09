import type { HintInfo, ServerQuestionInfo } from "../types";

export default class HintManager {
  private m_ai: Ai<AiModels>;
  private m_hints: HintInfo[] = [];
  private readonly MAX_HINTS = 3;

  constructor(ai: Ai<AiModels>) {
    this.m_ai = ai;
  }

  public getHints(): readonly HintInfo[] {
    return this.m_hints;
  }

  public getHintsClone() {
    return [...this.m_hints];
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
}
