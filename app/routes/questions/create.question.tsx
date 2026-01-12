import { useState, useEffect } from "react";
import { Form, isRouteErrorResponse, Link, useActionData } from "react-router";
import { QuestionsRepository } from "~/repositories/question.repository";
import type { Route } from "./+types/create.question";

type ActionData = Awaited<ReturnType<typeof action>>;

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

export default function CreateQuestion() {
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [userIdInput, setUserIdInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const actionData = useActionData<ActionData>();

  useEffect(() => {
    if (!actionData?.success) return;

    setTitleInput("");
    setContentInput("");
    setUserIdInput("");
    setShowSuccess(true);

    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [actionData]);

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-100 px-2 relative">
      <Link
        to="/questions"
        className="absolute top-4 left-4 rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
      >
        Questions
      </Link>

      {showSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          Question created
        </div>
      )}

      <div className="flex flex-col gap-6 w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 p-8">
        <h1 className="text-3xl font-semibold text-center">Create Question</h1>

        <Form method="post" className="flex flex-col gap-6">
          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              name="title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className={`rounded-lg bg-slate-900/70 px-4 py-2 ring-1 ring-white/20 focus:ring-2 focus:ring-blue-500
                ${actionData?.error ? "ring-red-500" : ""}`}
            />
          </div>

          {/* Content */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Content</label>
            <textarea
              name="content"
              rows={4}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              className="rounded-lg bg-slate-900/70 px-4 py-2 ring-1 ring-white/20 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Created By */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">User ID</label>
            <input
              type="text"
              name="createdByUserId"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              className="rounded-lg bg-slate-900/70 px-4 py-2 ring-1 ring-white/20 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {actionData?.error && (
            <span className="text-red-400 text-sm">{actionData.error}</span>
          )}

          <button
            type="submit"
            className="rounded-xl py-2.5 font-semibold bg-blue-500 hover:bg-blue-600 transition"
          >
            Create
          </button>
        </Form>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <main className="pt-16 p-4 container mx-auto">
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </main>
    );
  }

  if (error instanceof Error) {
    return (
      <main className="pt-16 p-4 container mx-auto">
        <h1>Error</h1>
        <p>{error.message}</p>
        <pre>{error.stack}</pre>
      </main>
    );
  }

  return <h1>Unknown Error</h1>;
}
