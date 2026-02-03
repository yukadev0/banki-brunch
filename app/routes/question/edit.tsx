import clsx from "clsx";
import { useCallback, useState } from "react";
import { Form, Link, redirect } from "react-router";
import { requireOwnership } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/edit";

export function meta() {
  return [{ title: "Edit Question" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const question = await QuestionsRepository.getById(
    context.db,
    Number(params.id),
  );

  await requireOwnership(context, request, question.createdByUserId);

  const allTags = await TagsRepository.getAll(context.db);

  return {
    question: {
      id: question.id,
      tags: question.tags,
      title: question.title,
      content: question.content,
    },
    allTags: allTags.map((tag) => tag.name),
  };
}

export async function action({ params, request, context }: Route.ActionArgs) {
  const questionId = Number(params.id);
  const question = await QuestionsRepository.getById(context.db, questionId);

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  await requireOwnership(context, request, question.createdByUserId);

  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");

  if (!title || !content) {
    return { status: "error" as const, message: "Missing required fields" };
  }

  const tags = formData.getAll("tags");

  if (tags.length === 0) {
    return {
      status: "error" as const,
      message: "Please select at least one tag",
    };
  }

  try {
    await QuestionsRepository.update(context.db, questionId, {
      title: title as string,
      content: content as string,
      tags: tags as string[],
      createdByUserId: question.createdByUserId,
    });

    return redirect(`/question/${questionId}`);
  } catch (error) {
    return { status: "error" as const, message: "Something went wrong" };
  }
}

export default function EditPage({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const { question, allTags } = loaderData;

  const [tags, setTags] = useState<string[]>(question.tags ?? []);
  const [titleInput, setTitleInput] = useState(question.title);
  const [contentInput, setContentInput] = useState(question.content);

  const toggleTag = useCallback((tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  return (
    <div className="text-gray-100 flex flex-col items-center justify-center gap-8 pt-12">
      <Link
        to={`/question/${question.id}`}
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Back
      </Link>

      <h1 className="text-4xl font-semibold text-center text-white">
        Edit Question
      </h1>

      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-lg">
        <div className="flex flex-col gap-6">
          <input
            name="title"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            className="w-full hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <textarea
            name="content"
            value={contentInput}
            onChange={(e) => setContentInput(e.target.value)}
            rows={5}
            className="w-full hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <div>
            <h3 className="text-sm font-semibold text-gray-300">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <label
                    key={tag}
                    className={clsx(
                      "flex items-center gap-2 px-3 py-1 text-xs rounded-full cursor-pointer select-none",
                      active
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-200",
                    )}
                  >
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag}
                      checked={active}
                      onChange={() => toggleTag(tag)}
                      className="hidden"
                    />
                    {tag}
                  </label>
                );
              })}
            </div>
          </div>

          {actionData && (
            <p
              className={clsx(
                "text-sm",
                actionData.status === "error"
                  ? "text-red-500"
                  : "text-green-500",
              )}
            >
              {actionData.message}
            </p>
          )}

          <Form method="post" className="self-center">
            <input type="hidden" name="title" value={titleInput} />
            <input type="hidden" name="content" value={contentInput} />
            {tags.map((tag) => (
              <input
                key={tag}
                type="hidden"
                name="tags"
                value={tag}
                className="hidden"
              />
            ))}
            <button
              type="submit"
              className="text-sm px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition"
            >
              Save
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
