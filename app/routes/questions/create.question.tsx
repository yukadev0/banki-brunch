import { useState, useEffect } from "react";
import { Form, Link } from "react-router";
import { QuestionsRepository } from "~/repositories/question.repository";
import type { Route } from "./+types/create.question";
import { UsersRepository } from "~/repositories/user.repository";

export function meta() {
  return [{ title: "Create Question" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();

  const title = formData.get("title");
  const content = formData.get("content");
  const createdByUserId = formData.get("createdByUserId");

  if (!title || !content || !createdByUserId) {
    return { error: "All fields are required" };
  }

  await QuestionsRepository.create(context.db, {
    title: title as string,
    content: content as string,
    createdByUserId: Number(createdByUserId),
  });

  return { success: true };
}

export async function loader({ context }: Route.LoaderArgs) {
  const users = await UsersRepository.getAll(context.db);
  return { firstUser: users[0] };
}

export default function CreateQuestion({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { firstUser } = loaderData;

  const [titleInput, setTitleInput] = useState(`${firstUser.username}'s`);
  const [contentInput, setContentInput] = useState(
    `${firstUser.username}'s content`,
  );
  const [userIdInput, setUserIdInput] = useState(firstUser.id.toString());
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!actionData?.success) return;

    setTitleInput(`${firstUser.username}'s Question`);
    setContentInput(`${firstUser.username}'s Question content`);
    setUserIdInput(firstUser.id.toString());
    setShowSuccess(true);

    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [actionData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-10 flex flex-col gap-6 items-center justify-center">
      <Link
        to="/questions"
        className="absolute top-4 left-4 cursor-pointer text-sm text-blue-400 hover:underline"
      >
        Back to Questions
      </Link>

      {showSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          Question created successfully!
        </div>
      )}

      <div className="w-full max-w-xl rounded-2xl bg-slate-800 border border-slate-700 p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Create a New Question
        </h1>

        <Form method="post" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className={`hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                ${actionData?.error ? "ring-red-500" : ""}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="content">
              Content
            </label>
            <textarea
              name="content"
              id="content"
              rows={6}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              className={`hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                ${actionData?.error ? "ring-red-500" : ""}`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="createdByUserId">
              User ID
            </label>
            <input
              type="text"
              id="createdByUserId"
              name="createdByUserId"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className={`hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                ${actionData?.error ? "ring-red-500" : ""}`}
            />
          </div>

          {actionData?.error && (
            <span className="text-red-400 text-sm">{actionData.error}</span>
          )}

          <button
            type="submit"
            className="rounded-xl py-2.5 font-semibold bg-blue-500 hover:bg-blue-600 transition"
          >
            Create Question
          </button>
        </Form>
      </div>
    </div>
  );
}
