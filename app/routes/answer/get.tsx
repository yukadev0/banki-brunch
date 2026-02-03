import { useCallback, useMemo } from "react";
import { Link, useFetcher } from "react-router";
import UpvoteDownvote from "~/components/UpvoteDownvote";
import { requireOwnership } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import { deleteAnswer, voteAnswer } from "../api/answer/helpers";
import type { Route } from "./+types/get";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Answer: ${params.id}` }];
}

export async function loader({ params, context, request }: Route.LoaderArgs) {
  const answer = await AnswersRepository.getById(context.db, Number(params.id));

  const session = await requireOwnership(
    context,
    request,
    answer.createdByUserId,
  );

  return {
    user: session
      ? {
          id: session.user.id,
          role: session.user.role,
        }
      : null,
    answer: {
      id: answer.id,
      content: answer.content,
      voteCount: answer.voteCount,
      createdAt: answer.createdAt,
      questionId: answer.questionId,
      isValidated: answer.isValidated,
      author: { name: answer.author.name },
      createdByUserId: answer.createdByUserId,
      vote: {
        vote_type: answer.vote ? answer.vote.vote_type : ("unvote" as const),
      },
    },
  };
}

export default function GetPage({ loaderData, params }: Route.ComponentProps) {
  const { answer, user } = loaderData;

  const fetcher = useFetcher();

  const { voteState, voteDisplay } = useMemo(() => {
    let state: "upvote" | "downvote" | "unvote" = "unvote";
    let display = answer.voteCount;

    if (fetcher.formData) {
      const voteType = fetcher.formData.get("voteType");
      if (voteType === "upvote") {
        state = "upvote";
        if (answer.vote) {
          if (answer.vote.vote_type === "downvote") {
            display = answer.voteCount + 2;
          } else if (answer.vote.vote_type === "upvote") {
            display = answer.voteCount - 1;
            state = "unvote";
          }
        } else {
          display = answer.voteCount + 1;
        }
      } else if (voteType === "downvote") {
        state = "downvote";
        if (answer.vote) {
          if (answer.vote.vote_type === "upvote") {
            display = answer.voteCount - 2;
          } else if (answer.vote.vote_type === "downvote") {
            display = answer.voteCount + 1;
            state = "unvote";
          }
        } else {
          display = answer.voteCount - 1;
        }
      }
    } else {
      if (answer.vote) {
        state = answer.vote.vote_type;
      }
    }

    return { voteState: state, voteDisplay: display };
  }, [fetcher.formData, answer.vote, answer.voteCount]);

  const onUpvote = useCallback(() => {
    voteAnswer(answer.id, Number(params.questionId), "upvote", fetcher);
  }, [answer.id, params.questionId, fetcher]);

  const onDownvote = useCallback(() => {
    voteAnswer(answer.id, Number(params.questionId), "downvote", fetcher);
  }, [answer.id, params.questionId, fetcher]);

  const onDeleteAnswer = useCallback(() => {
    deleteAnswer(answer.id, fetcher);
  }, [answer.id, fetcher]);

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
            display={voteDisplay}
            onUpvoteClick={onUpvote}
            onDownvoteClick={onDownvote}
          />

          {user &&
            (user.id === answer.createdByUserId || user.role === "admin") && (
              <div className="flex gap-4">
                <Link
                  to={`/question/${params.questionId}/answer/${answer.id}/edit`}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  Edit
                </Link>
                <button
                  onClick={onDeleteAnswer}
                  className="cursor-pointer text-sm text-red-400 hover:text-red-300 transition"
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
