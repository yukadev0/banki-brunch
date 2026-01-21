import { useState, useEffect } from "react";
import { Form, Link, redirect } from "react-router";
import type { Route } from "./+types/create.question";
import { createAuth } from "~/lib/auth.server";
import { QuestionsRepository } from "~/repositories/question/repository";
import { tagsSchema } from "~/db/tag-schema";

export function meta() {
  return [{ title: "Create Question" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();

  const title = formData.get("title");
  const content = formData.get("content");
  const selectedTags = formData.getAll("tags") as string[];

  if (!title || !content) {
    return { error: "All fields are required" };
  }

  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  await QuestionsRepository.create(context.db, {
    title: title as string,
    content: content as string,
    createdByUserId: session.user.id,
    tags: selectedTags,
  });

  return { success: true };
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  const allTags = await context.db.select().from(tagsSchema);
  return { allTags };
}

export default function CreateQuestion({
  actionData,
  loaderData,
}: Route.ComponentProps) {
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = loaderData?.allTags ?? [];

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  useEffect(() => {
    if (!actionData?.success) return;

    setTitleInput("");
    setContentInput("");
    setSelectedTags([]);
    setShowSuccess(true);

    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [actionData]);

  return (
    <div className="min-h-screen text-slate-100 py-10 flex flex-col gap-6 items-center justify-center">
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
              className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
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
              className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.name}
                type="button"
                onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  selectedTags.includes(tag.name)
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {actionData?.error && (
            <span className="text-red-400 text-sm">{actionData.error}</span>
          )}

          {selectedTags.map((t) => (
            <input key={t} type="hidden" name="tags" value={t} />
          ))}

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
