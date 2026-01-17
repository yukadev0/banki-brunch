import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import {
  AnswersRepository,
  type AnswerSelectArgs,
} from "~/repositories/answer.repository";
import type { Route } from "./+types/answers";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Answers" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  return await AnswersRepository.delete(context.db, Number(id));
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const answers = await AnswersRepository.getByQuestionId(
    context.db,
    Number(params.questionId),
  );
  return { answers };
}

export default function Answers({ params }: Route.LoaderArgs) {
  const { answers } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col gap-6 items-center justify-center py-10 px-4">
      <Link
        to={`/questions/${params.questionId}`}
        className="absolute top-4 left-4 cursor-pointer text-sm text-blue-400 hover:underline"
      >
        Back to question
      </Link>

      <h1 className="text-4xl font-semibold text-center mb-12">Answers</h1>

      <div className="w-full max-w-6xl py-6">
        {answers.length === 0 ? (
          <p className="text-center text-gray-400">No answers found</p>
        ) : (
          <ul className="space-y-6">
            {answers.map((answer: AnswerSelectArgs) => (
              <li
                key={answer.id}
                className="bg-slate-800 rounded-lg border border-slate-700 p-6 shadow-lg hover:bg-slate-700 transition-all"
              >
                <Link to={`./${answer.id}`} className="block">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex flex-col items-center text-sm text-gray-400 gap-2">
                      <button className="hover:text-green-500 transition">
                        ▲
                      </button>
                      <span className="text-xl font-semibold text-white">
                        0
                      </span>
                      <button className="hover:text-red-500 transition">
                        ▼
                      </button>
                    </div>

                    <div className="flex-1">
                      <p className="text-slate-200 line-clamp-3">
                        {answer.content}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-slate-400">
                    Created at:{" "}
                    {new Date(answer.createdAt).toLocaleDateString()}
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
        Create Answer
      </Link>
    </div>
  );
}
