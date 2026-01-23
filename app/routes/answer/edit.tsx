import { useCallback, useState } from "react";
import { Link, useFetcher } from "react-router";
import { requireOwnership } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/edit";

export function meta() {
  return [{ title: "Edit Answer" }];
}

export async function loader({ request, context, params }: Route.LoaderArgs) {
  const answer = await AnswersRepository.getById(context.db, Number(params.id));

  await requireOwnership(context, request, answer.createdByUserId);

  return { answer };
}

export default function EditPage({ loaderData }: Route.ComponentProps) {
  const { answer } = loaderData;

  const fetcher = useFetcher();
  const [content, setContent] = useState(answer.content);

  const updateAnswer = useCallback(() => {
    fetcher.submit(
      { content: content, questionId: answer.questionId },
      { method: "post", action: `/api/answer/${answer.id}/update` },
    );
  }, [content]);

  return (
    <div className="text-gray-100 flex flex-col items-center justify-center gap-8 py-12">
      <Link
        to={`/question/${answer.questionId}`}
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Back
      </Link>

      <h1 className="text-4xl font-semibold text-center text-white">
        Edit Answer
      </h1>

      <div className="flex flex-col gap-6 w-full max-w-2xl bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-lg">
        <textarea
          name="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          className="w-full hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />

        <button
          onClick={updateAnswer}
          className="self-center text-sm px-6 py-2 rounded-lg bg-green-500 hover:bg-green-600 transition"
        >
          Save
        </button>
      </div>
    </div>
  );
}
