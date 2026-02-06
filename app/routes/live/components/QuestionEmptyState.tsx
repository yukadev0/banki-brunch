interface Props {
  isPresenter: boolean;
  onGetQuestion: () => void;
}

export default function QuestionEmptyState({
  isPresenter,
  onGetQuestion,
}: Props) {
  if (isPresenter) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-300 mb-2">
            Ready to Start
          </h2>
          <p className="text-gray-400">Click the button to get a question</p>
        </div>
        <button
          onClick={onGetQuestion}
          className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
        >
          Get Question
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-12">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-300 mb-2">
          Waiting for the Presenter
        </h2>
        <p className="text-gray-400">
          The presenter will start a question soon
        </p>
      </div>
    </div>
  );
}
