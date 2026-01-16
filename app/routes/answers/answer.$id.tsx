import { Form, Link, redirect, useLoaderData } from "react-router";
import { AnswersRepository } from "~/repositories/answer.repository";
import { UsersRepository } from "~/repositories/user.repository";
import type { Route } from "./+types/answer.$id";

type LoaderData = {
  answer: {
    id: number;
    content: string;
    isValidated: boolean;
    createdAt: number;
    createdByUserId?: number;
  };
  user: { id: number; username: string } | null;
};

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

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");
  if (!id) throw new Response("Answer id is required", { status: 400 });

  await AnswersRepository.delete(context.db, Number(id));
  return redirect(`/questions/${id}/answers`);
}

export default function AnswerPage() {
  const { answer, user } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
      <Link
        to={`/questions/${answer.id}`}
        className="absolute top-4 left-4 rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2 text-white"
      >
        ← Back to question
      </Link>

      <div className="mt-12 w-full max-w-2xl rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 shadow-2xl p-6 flex flex-col gap-6">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-2xl font-semibold text-white">Answer Details</h1>
          {answer.isValidated && (
            <span className="text-green-400 font-medium text-sm bg-green-900/30 px-2 py-1 rounded-lg">
              Validated
            </span>
          )}
        </div>

        <p className="text-slate-200 whitespace-pre-wrap">{answer.content}</p>

        <div className="text-sm text-slate-400 flex flex-col gap-1">
          <span>Created at: {new Date(answer.createdAt).toLocaleDateString()}</span>
          <span>Author: {user ? user.username : "Anonymous"}</span>
        </div>

        <Form method="post" className="mt-4 flex justify-end">
          <input type="hidden" name="id" value={answer.id} />
          <button
            type="submit"
            className="bg-red-500 hover:bg-red-600 transition cursor-pointer rounded-xl px-4 py-2 text-white"
          >
            Delete Answer
          </button>
        </Form>
      </div>
    </div>
  );
}
