import clsx from "clsx";
import { useEffect, useState } from "react";
import {
  FaChevronDown,
  FaChevronUp,
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaRobot,
  FaSpinner,
  FaTrash,
  FaUser,
} from "react-icons/fa6";
import type { HintInfo } from "workers/durableObjects/brunchRoom/types";

type Props = {
  hints: HintInfo[];
  hasQuestion: boolean;
  isGenerating: boolean;
  maxHints: number;

  handleDeleteHint: (hintId: string) => void;
  handleToggleHint: (hintId: string) => void;
  handleGenerateHint: () => void;
  handleAddCustomHint: (content: string) => void;
};

export default function HintManager({
  hints,
  hasQuestion,
  isGenerating,
  maxHints,
  handleAddCustomHint,
  handleDeleteHint,
  handleGenerateHint,
  handleToggleHint,
}: Props) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingCustom, setIsAddingCustom] = useState(false);
  const [customContent, setCustomContent] = useState("");

  useEffect(() => {
    setIsExpanded(true);
  }, []);

  function handleAddCustom() {
    handleAddCustomHint(customContent);
    setIsAddingCustom(false);
    setCustomContent("");
  }

  const handleCancelCustom = () => {
    setIsAddingCustom(false);
    setCustomContent("");
  };

  const canGenerateMore = hints.length < maxHints;

  return (
    <div className="bg-gray-800 rounded-lg shadow-lg border p-4 border-gray-700">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">Presenter Hints</h3>
          <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-full">
            {hints.length}/{maxHints}
          </span>
        </div>
        <FaChevronDown
          className={clsx(
            "w-5 h-5 text-gray-400 transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      <div
        className={clsx(
          "flex flex-col gap-3 transition-[max-height,margin,opacity] overflow-hidden",
          isExpanded
            ? "max-h-500 opacity-100 mt-3 pointer-events-auto select-auto"
            : "max-h-0 opacity-0 pointer-events-none select-none",
        )}
      >
        {!hasQuestion ? (
          <p className="text-sm text-gray-400 text-center py-8">
            Load a question to manage hints
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handleGenerateHint}
                disabled={!canGenerateMore || isGenerating}
                className={clsx(
                  "cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  isGenerating
                    ? "bg-blue-700 text-white cursor-wait"
                    : canGenerateMore
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed",
                )}
              >
                {isGenerating ? (
                  <>
                    <FaSpinner className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <FaRobot className="w-4 h-4" />
                    <span>Generate AI Hint</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setIsAddingCustom(!isAddingCustom)}
                disabled={!canGenerateMore}
                className={clsx(
                  "cursor-pointer flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors",
                  canGenerateMore
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed",
                )}
              >
                {isAddingCustom ? (
                  <FaChevronUp className="w-4 h-4" />
                ) : (
                  <FaPlus className="w-4 h-4" />
                )}
                <span>Add Custom Hint</span>
              </button>
            </div>

            {isAddingCustom && (
              <div className="mb-5 p-4 bg-gray-900/50 rounded-lg">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Hint Content
                </label>
                <textarea
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  onKeyDown={(e) => {
                    if (!e.shiftKey && e.key === "Enter") {
                      handleAddCustom();
                    }
                  }}
                  placeholder="Enter a helpful hint for the question..."
                  className="no-scrollbar w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 transition-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-y"
                  rows={4}
                  maxLength={500}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-gray-500">
                    {customContent.length}/500 characters
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancelCustom}
                      className="cursor-pointer px-4 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddCustom}
                      disabled={!customContent.trim()}
                      className={clsx(
                        "cursor-pointer px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                        customContent.trim()
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gray-700 text-gray-500 cursor-not-allowed",
                      )}
                    >
                      Add Hint
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {hints.length === 0 ? (
                <div className="text-center py-8 bg-gray-900/30 rounded-lg border border-dashed border-gray-700">
                  <p className="text-sm text-gray-400 mb-1">No hints yet</p>
                  <p className="text-xs text-gray-500">
                    Generate AI hint or add a custom one
                  </p>
                </div>
              ) : (
                hints.map((hint, index) => (
                  <div
                    key={hint.id}
                    className={clsx(
                      "p-4 rounded-lg border transition-colors",
                      hint.isVisible
                        ? "bg-blue-900/20 border-blue-500/50"
                        : "bg-gray-700/30 border-gray-600",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-400 bg-gray-800 px-2 py-0.5 rounded">
                          Hint {index + 1}
                        </span>
                        {hint.createdBy === "ai" ? (
                          <span className="flex items-center gap-1 text-xs text-blue-400">
                            <FaRobot className="w-3 h-3" />
                            AI
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-green-400">
                            <FaUser className="w-3 h-3" />
                            Custom
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleHint(hint.id)}
                          className={clsx(
                            "cursor-pointer p-2 rounded-lg transition-colors",
                            hint.isVisible
                              ? "text-blue-400 hover:bg-blue-900/30 bg-blue-900/20"
                              : "text-gray-400 hover:bg-gray-700",
                          )}
                          title={
                            hint.isVisible
                              ? "Hide from viewers"
                              : "Show to viewers"
                          }
                        >
                          {hint.isVisible ? (
                            <FaEye className="w-4 h-4" />
                          ) : (
                            <FaEyeSlash className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteHint(hint.id)}
                          className="cursor-pointer p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete hint"
                        >
                          <FaTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed wrap-anywhere">
                      {hint.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {hints.length > 0 && (
              <p className="text-xs text-gray-500 mt-4 text-center">
                Click the eye icon to show/hide hints from viewers
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
