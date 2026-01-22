import { useCallback, useEffect, useState } from "react";
import { Link, redirect, useFetcher } from "react-router";
import UpvoteDownvote from "~/components/UpvoteDownvote";
import { createAuth } from "~/lib/auth.server";
import { AnswersRepository } from "~/repositories/answer/repository";
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

export default function GetPage({ loaderData, params }: Route.ComponentProps) {
  const { answer, session } = loaderData;

  const fetcher = useFetcher();

  const [voteCount, setVoteCount] = useState(answer.voteCount);
  const [voteState, setVoteState] = useState<
    "upvoted" | "downvoted" | "unvoted"
  >("unvoted");

  useEffect(() => {
    if (fetcher.state !== "idle") {
      return;
    }

    setVoteCount(answer.voteCount);
    if (!answer.vote) {
      setVoteState("unvoted");
      return;
    }

    if (answer.vote.vote_type === "upvote") {
      setVoteState("upvoted");
    } else if (answer.vote.vote_type === "downvote") {
      setVoteState("downvoted");
    }
  }, [fetcher.state, answer.vote, answer.voteCount]);

  const onUpvote = useCallback(() => {
    setVoteState((prev) => (prev === "upvoted" ? "unvoted" : "upvoted"));
    setVoteCount((prev) => {
      if (voteState === "downvoted") return prev + 2;
      if (voteState === "upvoted") return prev - 1;
      return prev + 1;
    });

    fetcher.submit(
      {
        voteType: "upvote",
        questionId: params.questionId,
      },
      { method: "post", action: `/api/answer/${answer.id}/vote` },
    );
  }, [fetcher, answer.id, voteState]);

  const onDownvote = useCallback(() => {
    setVoteState((prev) => (prev === "downvoted" ? "unvoted" : "downvoted"));
    setVoteCount((prev) => {
      if (voteState === "upvoted") return prev - 2;
      if (voteState === "downvoted") return prev + 1;
      return prev - 1;
    });

    fetcher.submit(
      {
        voteType: "downvote",
        questionId: params.questionId,
      },
      { method: "post", action: `/api/answer/${answer.id}/vote` },
    );
  }, [fetcher, answer.id, voteState]);

  const deleteAnswer = useCallback(() => {
    fetcher.submit(null, {
      method: "post",
      action: `/api/answer/${answer.id}/delete`,
    });
  }, [fetcher, answer.id]);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col gap-6 items-center justify-center py-10">
      <Link
        to={`/question/${answer.questionId}`}
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Back to Question
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
            display={voteCount}
            onUpvoteClick={onUpvote}
            onDownvoteClick={onDownvote}
          />

          {session?.user.id === answer.createdByUserId && (
            <div className="flex gap-4">
              <Link
                to={`/question/${params.questionId}/answer/${answer.id}/edit`}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Edit
              </Link>
              <button
                onClick={deleteAnswer}
                className="text-sm text-red-400 hover:text-red-300 transition"
              >
                Delete Answer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
