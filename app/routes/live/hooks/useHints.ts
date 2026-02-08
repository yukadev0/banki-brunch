import { useState } from "react";
import type {
  Hint,
  ServerMessage,
} from "workers/durableObjects/brunchRoom/types";

export function useHints(onError: (message: string) => void) {
  const MAX_HINTS = 3;

  const [hints, setHints] = useState<Hint[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeHints, setActiveHints] = useState<Hint[]>([]);

  function handleMessage(data: ServerMessage) {
    switch (data.type) {
      case "hints_list":
        setHints(data.hints);
        break;
      case "active_hints":
        setActiveHints(data.hints);
        break;
      case "hint_generating":
        setIsGenerating(true);
        break;
      case "hint_generated":
        setIsGenerating(false);
        break;
      case "hint_error":
        setIsGenerating(false);
        onError(`Failed to generate hint: ${data.error}`);
        break;
    }
  }

  return {
    hints,
    MAX_HINTS,
    activeHints,
    isGenerating,
    handleMessage,
  };
}
