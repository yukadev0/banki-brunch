import type { ClientQuestionInfo } from "~/types/brunch-presenter.types";
import QuestionDisplay from "./QuestionDisplay";
import QuestionEmptyState from "./QuestionEmptyState";

interface Props {
  isPresenter: boolean;
  question: ClientQuestionInfo | null;
  onGetQuestion: () => void;
}

export default function QuestionSection({
  question,
  onGetQuestion,
  isPresenter,
}: Props) {
  return (
    <div className="bg-gray-800 rounded-xl p-8 shadow-lg border border-gray-700 min-h-100 flex flex-col">
      {!question ? (
        <QuestionEmptyState
          isPresenter={isPresenter}
          onGetQuestion={onGetQuestion}
        />
      ) : (
        <QuestionDisplay
          question={question}
          isPresenter={isPresenter}
          onGetQuestion={onGetQuestion}
        />
      )}
    </div>
  );
}
