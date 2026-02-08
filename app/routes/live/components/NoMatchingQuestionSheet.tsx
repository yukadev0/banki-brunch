import { HiExclamation } from "react-icons/hi";
import {
  HiArrowPath,
  HiForward,
  HiTag,
  HiUser,
  HiXMark,
} from "react-icons/hi2";
import type { NoMatchingQuestionMessage } from "workers/durableObjects/brunchRoom/types";

interface Props {
  data: NoMatchingQuestionMessage;
  onSkip: () => void;
  onClose: () => void;
  onGetRandom: () => void;
  onResetQuestions: () => void;
  onRequestTagChange: () => void;
}

export default function NoMatchingQuestionSheet({
  data,
  onSkip,
  onClose,
  onGetRandom,
  onResetQuestions,
  onRequestTagChange,
}: Props) {
  const hasUser = data.forUserId !== undefined;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 rounded-t-2xl border-t border-gray-700 shadow-2xl z-50 max-h-[85vh] overflow-hidden">
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
        </div>

        <div className="px-6 pb-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-full">
              <HiExclamation className="w-6 h-6 text-amber-500" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">
                No Matching Question
              </h2>
              {hasUser && (
                <p className="text-sm text-gray-400 flex items-center gap-1">
                  <HiUser className="w-4 h-4" />
                  For {data.forUserName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
            >
              <HiXMark className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 overflow-y-auto max-h-[40vh]">
          {hasUser && data.requestedTags && data.requestedTags.length > 0 && (
            <>
              <p className="text-sm text-gray-300 mb-3">
                No questions found matching the requested tags:
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {data.requestedTags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </>
          )}
          <p className="text-sm text-gray-400">What would you like to do?</p>
        </div>

        <div className="px-6 py-4 border-t border-gray-700 space-y-2 bg-gray-800/50">
          {hasUser && (
            <button
              onClick={onRequestTagChange}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              <HiTag className="w-4 h-4" />
              Ask {data.forUserName} to Change Tags
            </button>
          )}

          {hasUser && (
            <button
              onClick={onGetRandom}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              <HiArrowPath className="w-4 h-4" />
              Get Random Question {hasUser && `for ${data.forUserName}`}
            </button>
          )}

          <button
            onClick={onResetQuestions}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <HiArrowPath className="w-4 h-4" />
            Reset Asked Questions
          </button>

          {hasUser && (
            <button
              onClick={onSkip}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-400 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600"
            >
              <HiForward className="w-4 h-4" />
              Skip to Next User
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-400 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
