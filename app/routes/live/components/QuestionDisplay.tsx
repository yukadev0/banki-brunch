import { FaArrowRightLong } from "react-icons/fa6";
import type {
  ClientQuestionInfo,
  PollUpdateMessage,
} from "~/types/brunch-presenter.types";
import Option from "./Option";

interface Props {
  question: ClientQuestionInfo;
  isPresenter: boolean;
  onGetQuestion: () => void;
  pollData: PollUpdateMessage | null;
  onStartPoll: () => void;
  onCastVote: (option: string) => void;
  onEndPoll: () => void;
}

export default function QuestionDisplay({
  question,
  isPresenter,
  onGetQuestion,
  pollData,
  onStartPoll,
  onCastVote,
  onEndPoll,
}: Props) {
  const { content, title } = question;

  const isPollActive = pollData !== null;

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <span className="inline-block px-3 py-1 text-xs font-medium text-blue-400 bg-blue-400/10 rounded-full mb-3">
            Current Question
          </span>
          <h1 className="text-3xl font-bold text-white leading-tight">
            {title}
          </h1>
        </div>

        {isPresenter && (
          <div className="flex items-center gap-2">
            {isPollActive ? (
              <button
                onClick={onEndPoll}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                <span>End Poll</span>
              </button>
            ) : (
              <button
                onClick={onStartPoll}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <span>Start Poll</span>
              </button>
            )}

            <button
              onClick={onGetQuestion}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600"
            >
              <span>Next</span>
              <FaArrowRightLong className="text-xs" />
            </button>
          </div>
        )}
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
              <Option
                key={option}
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
