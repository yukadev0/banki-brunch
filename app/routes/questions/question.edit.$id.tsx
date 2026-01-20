import type { Route } from "./+types/question.edit.$id";
import { createAuth } from "~/lib/auth.server";
import { Form, Link, redirect } from "react-router";
import { QuestionsRepository } from "~/repositories/question.repository";
import { useState } from "react";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit Question" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  const questionId = Number(params.id);

  if (!questionId) {
    throw new Response("Invalid question id", { status: 400 });
  }

  const question = await QuestionsRepository.getById(context.db, questionId);

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  if (question.createdByUserId !== session.user.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return { question };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  const questionId = Number(params.id);

  if (!questionId) {
    throw new Response("Invalid question id", { status: 400 });
  }

  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");

  await QuestionsRepository.update(context.db, questionId, {
    title: title as string,
    content: content as string,
    createdByUserId: session.user.id,
  });

  return redirect(`/questions/${questionId}`);
}

export default function EditQuestion({ loaderData }: Route.ComponentProps) {
  const { question } = loaderData;

  const [tagInput, setTagInput] = useState("");

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== "Enter") return;
    e.preventDefault();

    const value = tagInput.trim();
    if (!value) return;

    setTagInput("");
  }

  return (
    <div className="text-gray-100 flex flex-col items-center justify-center gap-8 pt-12 ">
      <Link
        to={`/questions/${question.id}`}
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

            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={addTag}
              placeholder="Add a tag and press Enter"
              className="w-full hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
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
