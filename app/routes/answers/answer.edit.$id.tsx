import { createAuth } from "~/lib/auth.server";
import { Form, Link, redirect } from "react-router";
import { useState } from "react";
import type { Route } from "./+types/answer.edit.$id";
import { AnswersRepository } from "~/repositories/answer/repository";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Edit Answer" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  const answerId = Number(params.id);
  if (!answerId) {
    throw new Response("Invalid answer id", { status: 400 });
  }

  const answer = await AnswersRepository.getById(context.db, answerId);
  if (!answer) {
    throw new Response("Answer not found", { status: 404 });
  }

  if (answer.createdByUserId !== session.user.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return { answer };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  const answerId = Number(params.id);
  if (!answerId) {
    throw new Response("Invalid answer id", { status: 400 });
  }

  const formData = await request.formData();
  const content = formData.get("content");

  await AnswersRepository.update(context.db, answerId, {
    content: content as string,
    createdByUserId: session.user.id,
    questionId: Number(params.questionId),
  });

  return redirect(`/questions/${params.questionId}`);
}

export default function EditAnswer({ loaderData }: Route.ComponentProps) {
  const { answer } = loaderData;
  const [content, setContent] = useState(answer.content);

  return (
    <div className="text-gray-100 flex flex-col items-center justify-center gap-8 py-12">
      <Link
        to={`/questions/${answer.questionId}`}
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Back
      </Link>

      <h1 className="text-4xl font-semibold text-center text-white">
        Edit Answer
      </h1>

      <div className="w-full max-w-2xl bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-lg">
        <Form method="post" className="flex flex-col gap-6">
          <textarea
            name="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />

          <input type="hidden" name="questionId" value={answer.questionId} />

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
