import { FaArrowRightLong } from "react-icons/fa6";
import type { ClientQuestionInfo } from "~/types/brunch-presenter.types";

interface Props {
  question: ClientQuestionInfo;
  isPresenter: boolean;
  onGetQuestion: () => void;
}

export default function QuestionDisplay({
  question,
  isPresenter,
  onGetQuestion,
}: Props) {
  const { content, title } = question;

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
          <button
            onClick={onGetQuestion}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-600"
          >
            <span>Next</span>
            <FaArrowRightLong className="text-xs" />
          </button>
        )}
      </div>

      <div className="flex-1 bg-gray-900/50 rounded-xl p-6 border border-gray-700/50">
        <p className="text-lg text-gray-300 leading-relaxed whitespace-pre-wrap">
          {content}
        </p>
      </div>
    </div>
  );
}
