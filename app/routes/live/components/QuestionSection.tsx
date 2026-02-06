import type {
  ClientQuestionInfo,
  Hint,
  PollUpdateMessage,
} from "~/types/brunch-presenter.types";
import QuestionDisplay from "./QuestionDisplay";
import QuestionEmptyState from "./QuestionEmptyState";

interface Props {
  isPresenter: boolean;
  question: ClientQuestionInfo | null;
  questionForUser: { id: string; name: string } | null;
  onGetQuestion: () => void;
  pollData: PollUpdateMessage | null;
  onStartPoll: () => void;
  onCastVote: (option: string) => void;
  onEndPoll: () => void;
  activeHints: Hint[];
}

export default function QuestionSection({
  question,
  questionForUser,
  onGetQuestion,
  isPresenter,
  pollData,
  onStartPoll,
  onCastVote,
  onEndPoll,
  activeHints,
}: Props) {
  return (
    <div className="flex flex-col gap-2">
      <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 min-h-100 flex flex-col">
        {!question ? (
          <QuestionEmptyState
            isPresenter={isPresenter}
            onGetQuestion={onGetQuestion}
          />
        ) : (
          <QuestionDisplay
            question={question}
            questionForUser={questionForUser}
            isPresenter={isPresenter}
            onGetQuestion={onGetQuestion}
            pollData={pollData}
            onStartPoll={onStartPoll}
            onCastVote={onCastVote}
            onEndPoll={onEndPoll}
            activeHints={activeHints}
          />
        )}
      </div>
    </div>
  );
}
