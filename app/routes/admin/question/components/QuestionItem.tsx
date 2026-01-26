import { useCallback, useMemo } from "react";
import { Link, useFetcher } from "react-router";
import {
  deleteQuestion,
  validateQuestion,
} from "~/routes/api/question/helpers";

export function QuestionItem({ question }: any) {
  const fetcher = useFetcher();

  const deleteQuestionCallback = useCallback(() => {
    deleteQuestion(question.id, fetcher);
  }, [question.id]);

  const handleValidate = useCallback(() => {
    validateQuestion(question.id, fetcher);
  }, [question.id]);

  const validated = useMemo(() => {
    if (fetcher.formAction !== "/api/question/validate") {
      return question.validated !== null;
    }

    if (fetcher.formData) {
      return question.validated === null;
    }

    return question.validated !== null;
  }, [fetcher.formData, question.validated]);

  return (
    <tr className="text-sm hover:bg-gray-700 transition duration-200 ease-in-out">
      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-300">
        {question.title}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
        {question.author?.name}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-gray-400">
        {question.tags.join(", ")}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <input
          type="checkbox"
          onClick={handleValidate}
          checked={validated}
          readOnly
          className="flex items-center justify-center cursor-pointer appearance-none border focus:ring duration-300 shrink-0 w-6 h-6 rounded before:block before:clip-close before:origin-bottom-left before:scale-0 checked:before:scale-100 before:transition before:bg-green-400 before:w-3 before:h-3"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-300">
        <Link
          to={`/question/${question.id}/edit`}
          className="text-indigo-400 hover:text-indigo-500 mr-2 transition duration-150 ease-in-out"
        >
          Edit
        </Link>
        <button
          onClick={deleteQuestionCallback}
          className="text-red-400 hover:text-red-500 transition duration-150 ease-in-out"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
