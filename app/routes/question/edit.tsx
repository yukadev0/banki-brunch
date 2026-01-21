import { createAuth } from "~/lib/auth.server";
import { Form, Link, redirect } from "react-router";
import { useState } from "react";
import { QuestionsRepository } from "~/repositories/question/repository";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/edit";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit Question" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) return redirect("/login");

  const questionId = Number(params.id);
  if (!questionId) throw new Response("Invalid question id", { status: 400 });

  const question = await QuestionsRepository.getById(context.db, questionId);
  if (!question) throw new Response("Question not found", { status: 404 });
  if (question.createdByUserId !== session.user.id)
    throw new Response("Unauthorized", { status: 401 });

  const allTags = await TagsRepository.getAll(context.db);

  return { question, allTags };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) return redirect("/login");

  const questionId = Number(params.id);
  if (!questionId) throw new Response("Invalid question id", { status: 400 });

  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");
  const selectedTags = formData.getAll("tags");

  await QuestionsRepository.update(context.db, questionId, {
    tags: selectedTags as string[],
    title: title as string,
    content: content as string,
    createdByUserId: session.user.id,
  });

  return redirect(`/question/${questionId}`);
}

export default function EditPage({ loaderData }: Route.ComponentProps) {
  const { question, allTags } = loaderData;
  const [tags, setTags] = useState<string[]>(question.tags ?? []);

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

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
        <Form method="post" className="flex flex-col gap-6">
          <input
            name="title"
            defaultValue={question.title}
            className="w-full hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <textarea
            name="content"
            defaultValue={question.content}
            rows={5}
            className="w-full hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-2">Tags</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {allTags.map((tag: { name: string }) => {
                const active = tags.includes(tag.name);
                return (
                  <label
                    key={tag.name}
                    className={`flex items-center gap-2 px-3 py-1 text-xs rounded-full cursor-pointer select-none ${
                      active
                        ? "bg-blue-500 text-white"
                        : "bg-gray-700 text-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="tags"
                      value={tag.name}
                      checked={active}
                      onChange={() => toggleTag(tag.name)}
                      className="hidden"
                    />
                    {tag.name}
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="self-center text-sm px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition"
          >
            Save
          </button>
        </Form>
      </div>
    </div>
  );
}
