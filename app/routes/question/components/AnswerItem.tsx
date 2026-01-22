import { useCallback, useMemo } from "react";
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
    fetcher.submit(
      { voteType: "upvote", questionId: questionId },
      { method: "post", action: `/api/answer/${answer.id}/vote` },
    );
  }, [fetcher, answer.id]);

  const onDownvote = useCallback(() => {
    fetcher.submit(
      { voteType: "downvote", questionId: questionId },
      { method: "post", action: `/api/answer/${answer.id}/vote` },
    );
  }, [fetcher, answer.id]);

  return (
    <div className="flex gap-6 bg-slate-800 border border-slate-800 rounded-xl p-6">
      <UpvoteDownvote
        state={voteState}
        display={voteDisplay}
        onUpvoteClick={onUpvote}
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
