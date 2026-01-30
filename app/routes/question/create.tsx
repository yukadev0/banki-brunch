import { Suspense, useState } from "react";
import { Await, Form, Link, redirect, useNavigation } from "react-router";
import { tagsSchema } from "~/db/schemas/tag";
import { requireSession } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/create";
import Tags from "./components/Tags";

export function meta() {
  return [{ title: "Create Question" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  await requireSession(context, request);

  const allTags = context.db
    .select()
    .from(tagsSchema)
    .then((tags) => tags);

  return { allTags };
}

export async function action({ request, context }: Route.ActionArgs) {
  const session = await requireSession(context, request);
  const formData = await request.formData();

  const title = formData.get("title")?.toString().trim();
  const content = formData.get("content")?.toString().trim();
  const tags = formData.getAll("tags") as string[];

  if (!title || !content || tags.length === 0) {
    return {
      status: "error" as const,
      message: "Please fill all required fields and select at least one tag",
    };
  }

  try {
    await QuestionsRepository.create(context.db, {
      tags,
      title,
      content,
      createdByUserId: session.user.id,
    });
    return redirect("/question");
  } catch (error) {
    console.error("Question creation failed:", error);
    return {
      status: "error" as const,
      message: "Failed to create question. Please try again.",
    };
  }
}
export default function CreatePage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const { allTags } = loaderData;

  return (
    <div className="min-h-screen text-slate-100 py-10 flex flex-col gap-6 items-center justify-center">
      <Link
        to="/question"
        className="absolute top-4 left-4 cursor-pointer text-sm text-blue-400 hover:underline"
      >
        Back to Questions
      </Link>

      <div className="w-full max-w-xl rounded-2xl bg-slate-800 border border-slate-700 p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Create a New Question
        </h1>

        <Form method="post" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              disabled={isSubmitting}
              className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="content">
              Content *
            </label>
            <textarea
              name="content"
              id="content"
              rows={6}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              disabled={isSubmitting}
              className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <Suspense fallback={<div className="h-14">Loading tags...</div>}>
            <Await
              resolve={allTags}
              errorElement={
                <div className="text-red-500">Could not load tags</div>
              }
            >
              {(allTagsResolved) => (
                <Tags
                  allTags={allTagsResolved}
                  selectedTags={selectedTags}
                  setSelectedTags={setSelectedTags}
                />
              )}
            </Await>
          </Suspense>

          {actionData?.status === "error" && (
            <p className="text-sm text-red-500">{actionData.message}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl py-2.5 font-semibold bg-blue-500 hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating..." : "Create Question"}
          </button>
        </Form>
      </div>
    </div>
  );
}
