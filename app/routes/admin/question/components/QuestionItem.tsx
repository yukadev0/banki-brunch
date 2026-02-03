import clsx from "clsx";
import { Form, Link } from "react-router";

type Props = {
  question: {
    tags: string[];
    author: {
      id: string;
      name: string;
      image: string | null;
    };
    validated: {
      id: number;
      questionId: number;
      validatedByUserId: string;
    } | null;
    id: number;
    title: string;
    content: string;
    status: "pending" | "approved" | "rejected";
    interviewCount: number;
    createdByUserId: string;
    createdAt: Date;
  };
};

export function QuestionItem({ question }: Props) {
  const validated = question.validated !== null;

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
        <Form method="post">
          <input type="hidden" name="intent" value="validate" />
          <input type="hidden" name="id" value={question.id} />
          <button
            type="submit"
            className={clsx(
              "flex items-center justify-center cursor-pointer appearance-none border focus:ring duration-300 shrink-0 w-6 h-6 rounded before:block before:clip-close before:origin-bottom-left before:scale-0 before:transition before:bg-green-400 before:w-3 before:h-3",
              validated && "before:scale-100",
            )}
          />
        </Form>
      </td>
      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-300">
        <Link
          to={`/question/${question.id}/edit`}
          className="text-indigo-400 hover:text-indigo-500 mr-2 transition duration-150 ease-in-out"
        >
          Edit
        </Link>

        <Form method="post">
          <input type="hidden" name="intent" value="delete" />
          <input type="hidden" name="id" value={question.id} />
          <button
            type="submit"
            className="text-red-400 hover:text-red-500 transition duration-150 ease-in-out cursor-pointer"
          >
            Delete
          </button>
        </Form>
      </td>
    </tr>
  );
}
