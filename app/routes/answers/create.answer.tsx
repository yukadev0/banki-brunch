import { Form, Link, useActionData, redirect } from "react-router";
import { AnswersRepository } from "~/repositories/answer.repository";
import type { Route } from "./+types/create.answer";
import { UsersRepository } from "~/repositories/user.repository";
import { useLoaderData } from "react-router";
import { useEffect, useState } from "react";

type ActionData = Awaited<ReturnType<typeof action>>;
type LoaderData = Awaited<ReturnType<typeof loader>>;

export function meta() {
  return [{ title: "Add Answer" }];
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const questionId = Number(params.questionId);
  if (!questionId) {
    throw new Response("Invalid question id", { status: 400 });
  }

  const formData = await request.formData();
  const content = formData.get("content");

  if (!content || typeof content !== "string") {
    return { error: "Content is required" };
  }

  const users = await UsersRepository.getAll(context.db);
  const createdByUserId = users[0].id;

  await AnswersRepository.create(context.db, {
    questionId,
    content,
    createdByUserId,
  });

  return { success: true };
}

export async function loader({ context }: Route.LoaderArgs) {
  const users = await UsersRepository.getAll(context.db);
  return { firstUser: users[0] };
}

export default function CreateAnswer({ params }: Route.LoaderArgs) {
  const actionData = useActionData<ActionData>();
  const { firstUser } = useLoaderData<LoaderData>();

  const [showSuccess, setShowSuccess] = useState(false);
  const [contentInput, setContentInput] = useState(`${firstUser.username}'s`);

  useEffect(() => {
    if (!actionData?.success) return;

    setContentInput("");
    setShowSuccess(true);

    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [actionData]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-100 px-2">
      <Link
        to={`/questions/${params.questionId}/answers`}
        className="absolute top-4 left-4 rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2 text-white"
      >
        Back
      </Link>

      {showSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          Question created
        </div>
      )}

      <div className="flex flex-col gap-6 w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 p-8">
        <h1 className="text-2xl font-semibold text-center">Add Answer</h1>

        <Form method="post" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="content">
              Answer content
            </label>
            <textarea
              id="content"
              name="content"
              rows={6}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              className={`hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                ${actionData && "error" in actionData ? "ring-red-500" : ""}`}
              placeholder="Write a clear, structured answer…"
            />
          </div>

          {actionData && "error" in actionData && (
            <span className="text-red-400 text-sm">{actionData.error}</span>
          )}

          <button
            type="submit"
            className="rounded-xl py-2.5 font-semibold bg-blue-500 hover:bg-blue-600 transition"
          >
            Submit answer
          </button>
        </Form>
      </div>
    </div>
  );
}
