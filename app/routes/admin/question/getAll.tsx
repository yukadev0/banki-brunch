import { Link } from "react-router";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/getAll";
import { QuestionItem } from "./components/QuestionItem";

export function meta() {
  return [{ title: "Admin Questions" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const questions = await QuestionsRepository.getAll(context.db);
  return { questions };
}

export default function GetAllPage({ loaderData }: Route.ComponentProps) {
  const { questions } = loaderData;

  return (
    <div className="max-w-7xl mx-auto py-10 px-4">
      <Link
        to="/admin"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Back
      </Link>

      <h1 className="text-3xl font-semibold mb-6 text-white">
        Admin Questions
      </h1>

      <div className="overflow-hidden bg-gray-800 shadow-xl rounded-lg">
        <table className="min-w-full">
          <thead className="bg-gray-900 text-gray-300">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium">
                Question
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium">
                Author
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium">Tags</th>
              <th className="px-6 py-3 text-left text-sm font-medium">
                Validated
              </th>
              <th className="px-6 py-3 text-left text-sm font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {questions.map((question: any) => (
              <QuestionItem question={question} key={question.id} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
