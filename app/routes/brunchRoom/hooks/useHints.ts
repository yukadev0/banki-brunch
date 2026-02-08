import { useState } from "react";
import type {
  HintInfo,
  ServerMessage,
} from "workers/durableObjects/brunchRoom/types";

export type HintsManager = ReturnType<typeof useHints>;

export default function useHints(onError: (message: string) => void) {
  const MAX_HINTS = 3;

  const [hints, setHints] = useState<HintInfo[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeHints, setActiveHints] = useState<HintInfo[]>([]);

  function reset() {
    setHints([]);
    setActiveHints([]);
  }

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
    reset,
    setHints,
    MAX_HINTS,
    activeHints,
    isGenerating,
    handleMessage,
  };
}
