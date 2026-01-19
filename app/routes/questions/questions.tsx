import { Link, type LoaderFunctionArgs } from "react-router";
import type { Route } from "./+types/questions";
import {
  QuestionsRepository,
  type GetAllQuestionsArgs,
} from "~/repositories/question.repository";

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Questions" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  return await QuestionsRepository.delete(context.db, Number(id));
}

export async function loader({ context }: Route.LoaderArgs) {
  const questions = await QuestionsRepository.getAll(context.db);
  return { questions };
}

export default function Questions({ loaderData }: Route.ComponentProps) {
  const { questions } = loaderData;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center py-10 px-4">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <h1 className="text-4xl font-semibold text-center mb-12">Questions</h1>

      <div className="w-full max-w-6xl py-6">
        {questions.length === 0 ? (
          <p className="text-center text-gray-400">No questions found</p>
        ) : (
          <ul className="space-y-6">
            {questions.map((question: GetAllQuestionsArgs[0]) => (
              <li
                key={question.id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:bg-gray-700 transition-all"
              >
                <Link to={`./${question.id}`} className="block">
                  <div className="flex items-center mb-4">
                    <div className="flex flex-col items-center text-sm text-gray-400 mr-4">
                      <button className="hover:text-green-400 transition">
                        ▲
                      </button>
                      <span className="font-semibold text-xl">0</span>
                      <button className="hover:text-red-400 transition">
                        ▼
                      </button>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-200">
                        {question.title}
                      </h2>
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {question.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex gap-2">
                      {question.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="bg-gray-700 text-sm px-3 py-1 rounded-lg"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="text-xs text-gray-400">
                      <span>
                        Asked{" "}
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                      <br />
                      <span className="font-semibold">
                        {question.author.username ?? "Anonymous"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="./create"
        className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg text-lg"
      >
        Create Question
      </Link>
    </div>
  );
}
