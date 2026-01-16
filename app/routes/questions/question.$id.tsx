import { Form, Link, redirect, useLoaderData } from "react-router";
import { QuestionsRepository } from "~/repositories/question.repository";
import { useEffect } from "react";
import type { Route } from "./+types/question.$id";
import { UsersRepository } from "~/repositories/user.repository";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Question: ${params.id}` }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  if (!id) {
    throw new Response("Question id is required", { status: 400 });
  }

  await QuestionsRepository.delete(context.db, Number(id));

  return redirect("/questions");
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const question = await QuestionsRepository.getById(
    context.db,
    Number(params.id)
  );

  const user = await UsersRepository.getById(
    context.db,
    question.createdByUserId
  );

  return { question, user };
}

export default function Question() {
  const { question, user } = useLoaderData<LoaderData>();

  useEffect(() => {
    document.title = `Question: ${question.title}`;
  }, [question]);

  return (
    <div className="min-h-screen flex flex-col gap-6 items-center justify-center px-4">
      <Link
        to="/questions"
        className="absolute top-4 left-4 cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
      >
        Questions
      </Link>

      <div className="max-w-xl w-full rounded-2xl bg-white/10 backdrop-blur-lg border border-white/20 p-6 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">{question.title}</h1>

        <p className="text-slate-200 whitespace-pre-wrap">{question.content}</p>

        <div>
          <div className="text-sm text-slate-400 flex flex-col gap-1">
            <span>Status: {question.status}</span>
            <span>Created at: {question.createdAt.toLocaleDateString()}</span>
            <span>Author: {user.username}</span>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Link
            to={`./answers`}
            className="bg-blue-500 hover:bg-blue-600 transition cursor-pointer rounded-xl px-4 py-2 text-white"
          >
            Answers
          </Link>
          <Form method="post">
            <input type="hidden" name="id" value={question.id} />
            <button
              type="submit"
              className="bg-red-500 hover:bg-red-600 transition cursor-pointer rounded-xl px-4 py-2 text-white"
            >
              Delete Question
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
