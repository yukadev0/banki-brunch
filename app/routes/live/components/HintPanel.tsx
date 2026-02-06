import { useState } from "react";
import {
  FaEye,
  FaEyeSlash,
  FaPlus,
  FaRobot,
  FaTrash,
  FaUser,
} from "react-icons/fa6";
import type { Hint } from "~/types/brunch-presenter.types";
import CustomHintModal from "./CustomHintModal";

interface Props {
  hints: Hint[];
  canGenerateMore: boolean;
  socket: WebSocket;
  hasQuestion: boolean;
}

export default function HintPanel({
  hints,
  canGenerateMore,
  socket,
  hasQuestion,
}: Props) {
  const [showCustomModal, setShowCustomModal] = useState(false);

  const handleGenerateHint = () => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "generate_hint" }));
    }
  };

  const handleAddCustomHint = (content: string) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "add_custom_hint", content }));
    }
    setShowCustomModal(false);
  };

  const handleDeleteHint = (hintId: string) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "delete_hint", hintId }));
    }
  };

  const handleToggleHint = (hintId: string) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "toggle_hint", hintId }));
    }
  };

  return (
    <>
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Hints</h3>
          <span className="text-xs text-gray-400">{hints.length}/3</span>
        </div>

        {!hasQuestion ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Load a question to manage hints
          </p>
        ) : (
          <>
            <div className="flex gap-2 mb-4">
              <button
                onClick={handleGenerateHint}
                disabled={!canGenerateMore}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  canGenerateMore
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                <FaRobot className="w-4 h-4" />
                <span>AI Hint</span>
              </button>
              <button
                onClick={() => setShowCustomModal(true)}
                disabled={!canGenerateMore}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  canGenerateMore
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }`}
              >
                <FaPlus className="w-4 h-4" />
                <span>Custom</span>
              </button>
            </div>

            <div className="space-y-3">
              {hints.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">
                  No hints yet. Generate or add one!
                </p>
              ) : (
                hints.map((hint, index) => (
                  <div
                    key={hint.id}
                    className={`p-3 rounded-lg border transition-all ${
                      hint.isVisible
                        ? "bg-blue-900/30 border-blue-500/50"
                        : "bg-gray-700/50 border-gray-600"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400">
                          Hint {index + 1}
                        </span>
                        {hint.createdBy === "ai" ? (
                          <FaRobot
                            className="w-3 h-3 text-blue-400"
                            title="AI Generated"
                          />
                        ) : (
                          <FaUser
                            className="w-3 h-3 text-green-400"
                            title="Manual"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleHint(hint.id)}
                          className={`p-1.5 rounded transition-colors ${
                            hint.isVisible
                              ? "text-blue-400 hover:bg-blue-900/50"
                              : "text-gray-400 hover:bg-gray-600"
                          }`}
                          title={
                            hint.isVisible
                              ? "Hide from viewers"
                              : "Show to viewers"
                          }
                        >
                          {hint.isVisible ? (
                            <FaEye className="w-3.5 h-3.5" />
                          ) : (
                            <FaEyeSlash className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteHint(hint.id)}
                          className="p-1.5 text-red-400 hover:bg-red-900/50 rounded transition-colors"
                          title="Delete hint"
                        >
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-300 line-clamp-3">
                      {hint.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {hints.length > 0 && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Click the eye icon to show/hide hints from viewers
              </p>
            )}
          </>
        )}
      </div>

      <CustomHintModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSubmit={handleAddCustomHint}
      />
    </>
  );
}
