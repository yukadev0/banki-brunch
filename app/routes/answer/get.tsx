import { Form, Link, redirect, useFetcher } from "react-router";
import { createAuth } from "~/lib/auth.server";
import UpvoteDownvote from "~/components/UpvoteDownvote";
import { AnswersRepository } from "~/repositories/answer/repository";
import { useCallback, useEffect, useState } from "react";
import type { Route } from "./+types/get";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Answer: ${params.id}` }];
}

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (!id) {
    throw new Response("Invalid answer id", { status: 400 });
  }

  const answer = await AnswersRepository.getById(context.db, id);
  if (!answer) {
    throw new Response("Answer not found", { status: 404 });
  }

  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  if (session.user.id !== answer.createdByUserId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return { session, answer };
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  if (!id) {
    throw new Response("Answer id is required", { status: 400 });
  }

  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  const answer = await AnswersRepository.getById(context.db, Number(id));
  if (session.user.id !== answer.createdByUserId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  await AnswersRepository.delete(context.db, Number(id));

  return redirect(`/question/${params.questionId}`);
}

export default function GetPage({
  loaderData,
  params,
}: Route.ComponentProps) {
  const { answer, session } = loaderData;

  const fetcher = useFetcher();
  const [voteState, setVoteState] = useState<
    "upvoted" | "downvoted" | "unvoted"
  >("unvoted");

  const onUpvote = useCallback(() => {
    fetcher.submit(
      {
        answerId: answer.id,
        voteType: "upvote",
        questionId: params.questionId,
      },
      { method: "post", action: "/api/answer/vote" },
    );
  }, [fetcher, answer.id]);

  const onDownvote = useCallback(() => {
    fetcher.submit(
      {
        answerId: answer.id,
        voteType: "downvote",
        questionId: params.questionId,
      },
      { method: "post", action: "/api/answer/vote" },
    );
  }, [fetcher, answer.id]);

  useEffect(() => {
    if (answer.vote?.vote_type === "upvote") {
      setVoteState("upvoted");
    } else if (answer.vote?.vote_type === "downvote") {
      setVoteState("downvoted");
    } else {
      setVoteState("unvoted");
    }
  }, [answer.vote]);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col gap-6 items-center justify-center py-10">
      <Link
        to={`/question/${answer.questionId}/answers`}
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Back to answers
      </Link>

      <div className="w-full max-w-2xl bg-slate-800 rounded-2xl border border-slate-700 p-6 shadow-lg">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-semibold text-white">Answer Details</h1>
          {answer.isValidated && (
            <span className="text-green-400 font-medium text-sm bg-green-900/30 px-2 py-1 rounded-lg">
              Validated
            </span>
          )}
        </div>

        <p className="whitespace-pre-wrap text-slate-200 leading-relaxed mb-4">
          {answer.content}
        </p>

        <div className="text-sm text-slate-400 flex flex-col gap-2">
          <span>
            Created at: {new Date(answer.createdAt).toLocaleDateString()}
          </span>
          <span>Author: {answer.author.name}</span>
        </div>

        <div className="mt-6 flex justify-between items-end">
          <UpvoteDownvote
            state={voteState}
            onUpvoteClick={onUpvote}
            display={answer.voteCount}
            onDownvoteClick={onDownvote}
          />

          {session?.user.id === answer.createdByUserId && (
            <div className="flex gap-2">
              <div className="flex gap-4">
                <Link
                  to={`/question/${params.questionId}/answer/${answer.id}/edit`}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Edit
                </Link>
              </div>
              <Form method="post" className="flex justify-end">
                <input type="hidden" name="id" value={answer.id} />
                <button
                  type="submit"
                  className="text-sm text-red-400 hover:text-red-300 transition"
                >
                  Delete Answer
                </button>
              </Form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
