export type RequestGenerateHint = {
  type: "request_generate_hint";
};

export type RequestAddCustomHint = {
  type: "request_add_custom_hint";
  content: string;
};

export type RequestDeleteHint = {
  type: "request_delete_hint";
  hintId: string;
};

export type RequestToggleHintVisibility = {
  type: "request_toggle_hint_visibility";
  hintId: string;
};
