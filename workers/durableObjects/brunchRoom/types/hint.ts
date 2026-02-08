export type HintInfo = {
  id: string;
  content: string;
  isVisible: boolean;
  createdBy: "ai" | "manual";
};

export type GenerateHintMessage = {
  type: "generate_hint";
};

export type AddCustomHintMessage = {
  type: "add_custom_hint";
  content: string;
};

export type DeleteHintMessage = {
  type: "delete_hint";
  hintId: string;
};

export type ToggleHintMessage = {
  type: "toggle_hint";
  hintId: string;
};

export type ShowSelectedHintsMessage = {
  type: "show_selected_hints";
};

export type HintsListMessage = {
  type: "hints_list";
  hints: HintInfo[];
};

export type ActiveHintsMessage = {
  type: "active_hints";
  hints: HintInfo[];
};

export type HintGeneratingMessage = {
  type: "hint_generating";
};

export type HintGeneratedMessage = {
  type: "hint_generated";
};

export type HintErrorMessage = {
  type: "hint_error";
  error: string;
};
