import type {
  ClientQuestionInfo,
  PollInfo,
} from "workers/durableObjects/brunchRoom/types";
import QuestionDisplay from "./QuestionDisplay";
import QuestionEmptyState from "./QuestionEmptyState";

type Props = {
  isPresenter: boolean;
  question: ClientQuestionInfo | null;
  onGetQuestion: () => void;
  pollData: PollInfo | null;
  pollEnded: boolean;
  onStartPoll: () => void;
  onCastVote: (option: string) => void;
  onEndPoll: () => void;
};

export default function QuestionSection({
  question,
  onGetQuestion,
  pollData,
  pollEnded,
  isPresenter,
  onStartPoll,
  onCastVote,
  onEndPoll,
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
            pollData={pollData}
            pollEnded={pollEnded}
            question={question}
            isPresenter={isPresenter}
            onGetQuestion={onGetQuestion}
            onStartPoll={onStartPoll}
            onCastVote={onCastVote}
            onEndPoll={onEndPoll}
          />
        )}
      </div>
    </div>
  );
}
