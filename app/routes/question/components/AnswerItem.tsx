import { useCallback, useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import UpvoteDownvote from "~/components/UpvoteDownvote";

export function AnswerItem({
  answer,
  sessionUserId,
  questionId,
}: {
  answer: any;
  sessionUserId?: string;
  questionId: number;
}) {
  const fetcher = useFetcher();
  const [voteState, setVoteState] = useState<
    "upvoted" | "downvoted" | "unvoted"
  >("unvoted");

  const onUpvote = useCallback(() => {
    fetcher.submit(
      { answerId: answer.id, voteType: "upvote", questionId: questionId },
      { method: "post", action: "/api/answer/vote" },
    );
  }, [fetcher, answer.id]);

  const onDownvote = useCallback(() => {
    fetcher.submit(
      { answerId: answer.id, voteType: "downvote", questionId: questionId },
      { method: "post", action: "/api/answer/vote" },
    );
  }, [fetcher, answer.id]);

  useEffect(() => {
    if (!answer.vote) {
      setVoteState("unvoted");
      return;
    }

    if (answer.vote.vote_type === "upvote") {
      setVoteState("upvoted");
    } else if (answer.vote.vote_type === "downvote") {
      setVoteState("downvoted");
    }
  }, [answer.vote]);

  return (
    <div className="flex gap-6 bg-slate-800 border border-slate-800 rounded-xl p-6">
      <UpvoteDownvote
        state={voteState}
        onUpvoteClick={onUpvote}
        display={answer.voteCount}
        onDownvoteClick={onDownvote}
      />

      <div className="flex flex-col flex-1">
        <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
          {answer.content}
        </p>

        <div className="flex gap-2 items-center justify-center rounded-lg self-end text-xs text-slate-400 bg-slate-900 p-3">
          {answer.author.image && (
            <img
              src={answer.author.image}
              alt={answer.author.name}
              className="w-10 h-10 rounded-full"
            />
          )}
          <div>
            <div>
              answered {new Date(answer.createdAt).toLocaleDateString()}
            </div>
            <div className="text-slate-200 font-medium">
              {answer.author.name}
            </div>
          </div>
        </div>

        {sessionUserId === answer.createdByUserId && (
          <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-end gap-4">
            <div className="flex gap-4">
              <Link
                to={`/question/${questionId}/answer/${answer.id}`}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
