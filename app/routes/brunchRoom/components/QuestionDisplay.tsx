import { FaArrowRightLong, FaUser } from "react-icons/fa6";
import type {
  ClientQuestionInfo,
  PollInfo,
} from "workers/durableObjects/brunchRoom/types";
import PollOption from "./PollOption";

type Props = {
  question: ClientQuestionInfo;
  targetUserName: string | null;
  isPresenter: boolean;
  onGetQuestion: () => void;
  pollData: PollInfo | null;
  pollEnded: boolean;
  onStartPoll: () => void;
  onCastVote: (option: string) => void;
  onEndPoll: () => void;
};

export default function QuestionDisplay({
  question,
  targetUserName,
  isPresenter,
  onGetQuestion,
  onStartPoll,
  onCastVote,
  onEndPoll,
  pollData,
  pollEnded,
}: Props) {
  const { content, title } = question;

  const isPollActive = pollData !== null;

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4">
        <div className="flex justify-between items-center w-full flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-medium text-blue-400 bg-blue-400/10 rounded-full">
              Current Question
            </span>
            {targetUserName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                <FaUser className="w-3 h-3" />
                For {targetUserName}
              </span>
            )}
          </div>
          {isPresenter && (
            <div className="flex items-center gap-2">
              {isPollActive ? (
                <button
                  disabled={pollEnded}
                  onClick={onEndPoll}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>End Poll</span>
                </button>
              ) : (
                <button
                  onClick={onStartPoll}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <span>Start Poll</span>
                </button>
              )}

              <button
                onClick={onGetQuestion}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600"
              >
                <span>Next</span>
                <FaArrowRightLong className="text-xs" />
              </button>
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold text-white leading-tight">{title}</h1>
      </div>

      <div className="flex-1 bg-gray-900/50 rounded-xl p-6 border border-gray-700/50 mb-6">
        <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>

      {isPollActive && (
        <div className="bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Vote</h3>
            <span className="text-sm text-gray-400">
              {pollData.totalVotes} votes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pollData.options.map((option) => (
              <PollOption
                key={option}
                pollEnded={pollEnded}
                onCastVote={onCastVote}
                option={option}
                pollData={pollData}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
