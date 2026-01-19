import { Form, Link, redirect } from "react-router";
import { AnswersRepository } from "~/repositories/answer.repository";
import { UsersRepository } from "~/repositories/user.repository";
import type { Route } from "./+types/answer.$id";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Answer: ${params.id}` }];
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (!id) throw new Response("Invalid answer id", { status: 400 });

  const answer = await AnswersRepository.getById(context.db, id);
  if (!answer) throw new Response("Answer not found", { status: 404 });

  const user = answer.createdByUserId
    ? await UsersRepository.getById(context.db, answer.createdByUserId)
    : null;

  return { answer, user };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");
  if (!id) throw new Response("Answer id is required", { status: 400 });

  await AnswersRepository.delete(context.db, Number(id));

  return redirect(`/questions/${params.questionId}/answers`);
}

export default function AnswerPage({ loaderData }: Route.ComponentProps) {
  const { answer, user } = loaderData;

  return (
    <div className="min-h-screen text-slate-100 flex flex-col gap-6 items-center justify-center py-10 px-4">
      <Link
        to={`/questions/${answer.questionId}/answers`}
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Back to answers
      </Link>

      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-semibold text-white">Answer Details</h1>
          {answer.isValidated && (
            <span className="text-green-400 font-medium text-sm bg-green-900/30 px-2 py-1 rounded-lg">
              Validated
            </span>
          )}
        </div>

        <p className="whitespace-pre-wrap text-slate-200 leading-relaxed mb-4">
          {answer.content}
        </p>

        <div className="text-sm text-slate-400 flex flex-col gap-2">
          <span>
            Created at: {new Date(answer.createdAt).toLocaleDateString()}
          </span>
          <span>Author: {user ? user.name : "Anonymous"}</span>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="flex flex-col items-center text-sm text-gray-400 gap-2">
            <button className="hover:text-green-500 transition">▲</button>
            <span className="text-xl font-semibold text-white">0</span>
            <button className="hover:text-red-500 transition">▼</button>
          </div>

          <Form method="post" className="flex justify-end">
            <input type="hidden" name="id" value={answer.id} />
            <button
              type="submit"
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Delete Answer
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
