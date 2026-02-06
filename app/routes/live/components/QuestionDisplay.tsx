import { FaArrowRightLong, FaLightbulb, FaUser } from "react-icons/fa6";
import type {
  ClientQuestionInfo,
  Hint,
  PollUpdateMessage,
} from "~/types/brunch-presenter.types";
import Option from "./Option";

interface Props {
  question: ClientQuestionInfo;
  questionForUser: { id: string; name: string } | null;
  isPresenter: boolean;
  onGetQuestion: () => void;
  pollData: PollUpdateMessage | null;
  onStartPoll: () => void;
  onCastVote: (option: string) => void;
  onEndPoll: () => void;
  activeHints: Hint[];
}

export default function QuestionDisplay({
  question,
  questionForUser,
  isPresenter,
  onGetQuestion,
  pollData,
  onStartPoll,
  onCastVote,
  onEndPoll,
  activeHints,
}: Props) {
  const { content, title } = question;

  const isPollActive = pollData !== null;

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex flex-col items-start justify-between gap-4">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <span className="inline-block px-3 py-1 text-xs font-medium text-blue-400 bg-blue-400/10 rounded-full">
              Current Question
            </span>
            {questionForUser && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-green-400 bg-green-400/10 rounded-full">
                <FaUser className="w-3 h-3" />
                For {questionForUser.name}
              </span>
            )}
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

      {activeHints.length > 0 && (
        <div className="bg-linear-to-r from-amber-900/30 to-orange-900/30 rounded-xl p-6 border border-amber-700/50">
          <div className="flex items-center gap-2 mb-4">
            <FaLightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Hints</h3>
          </div>

          <div className="space-y-3">
            {activeHints.map((hint, index) => (
              <div
                key={hint.id}
                className="bg-gray-900/50 rounded-lg p-4 border border-amber-600/30"
              >
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-amber-600/20 text-amber-400 rounded-full text-sm font-semibold">
                    {index + 1}
                  </span>
                  <p className="text-gray-300 leading-relaxed flex-1">
                    {hint.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
