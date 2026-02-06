import { HiExclamation } from "react-icons/hi";
import type { NoMatchingQuestionMessage } from "~/types/brunch-presenter.types";

interface Props {
  data: NoMatchingQuestionMessage;
  onSkip: () => void;
  onClose: () => void;
  onGetRandom: () => void;
  onResetQuestions: () => void;
  onRequestTagChange: () => void;
}

export default function NoMatchingQuestionModal({
  data,
  onSkip,
  onClose,
  onGetRandom,
  onResetQuestions,
  onRequestTagChange,
}: Props) {
  if (data.forUserId === undefined) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full shadow-2xl">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-full">
                <HiExclamation className="w-6 h-6 text-amber-500" />
              </div>
              <h2 className="text-lg font-bold text-white">
                No Matching Question
              </h2>
            </div>
          </div>

          <div className="p-6">
            <p className="text-sm text-gray-300 mb-4">No questions found:</p>
            <p className="text-sm text-gray-400">What would you like to do?</p>
          </div>

          <div className="p-6 border-t border-gray-700 space-y-3">
            <button
              onClick={onResetQuestions}
              className="w-full px-4 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Reset Asked Questions
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 max-w-md w-full shadow-2xl">
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-full">
              <HiExclamation className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                No Matching Question
              </h2>
              <p className="text-sm text-gray-400">For {data.forUserName}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-300 mb-4">
            No questions found matching the requested tags:
          </p>
          <div className="flex flex-wrap gap-2 mb-6">
            {data.requestedTags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-sm text-gray-400">What would you like to do?</p>
        </div>

        <div className="p-6 border-t border-gray-700 space-y-3">
          <button
            onClick={onRequestTagChange}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Ask {data.forUserName} to Change Tags
          </button>
          <button
            onClick={onGetRandom}
            className="w-full px-4 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Get Random Question for {data.forUserName}
          </button>
          <button
            onClick={onResetQuestions}
            className="w-full px-4 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Reset Asked Questions
          </button>
          <button
            onClick={onSkip}
            className="w-full px-4 py-3 text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600"
          >
            Skip to Next User
          </button>
          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
