import type { HintInfo } from "../../types";

export type HintsListSnapshot = {
  type: "hints_list_snapshot";
  hints: HintInfo[];
};

export type ActiveHintsSnapshot = {
  type: "active_hints_snapshot";
  hints: HintInfo[];
};

export type HintGenerating = {
  type: "hint_generating";
};

export type HintGenerated = {
  type: "hint_generated";
};

export type HintError = {
  type: "hint_error";
  error: string;
};
