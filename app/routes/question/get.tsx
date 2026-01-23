import { useCallback, useEffect, useMemo } from "react";
import { Link, useFetcher } from "react-router";
import UpvoteDownvote from "~/components/UpvoteDownvote";
import { getSession } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/get";
import { AnswerForm } from "./components/AnswerForm";
import { AnswerItem } from "./components/AnswerItem";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Question: ${params.id}` }];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const session = await getSession(context, request);

  const questionId = Number(params.id);
  const question = await QuestionsRepository.getById(context.db, questionId);
  const userId = session?.user?.id || "0";

  const answers = (
    await AnswersRepository.getAllByQuestionId(context.db, questionId, userId)
  ).sort((a, b) => b.voteCount - a.voteCount);

  const questionVoteCount = await QuestionsRepository.getVoteCount(
    context.db,
    questionId,
  );

  const questionVote = await QuestionsRepository.getUserVote(
    context.db,
    questionId,
    userId,
  );

  return {
    question: {
      ...question,
      vote: questionVote,
      voteCount: questionVoteCount,
    },
    answers,
    session,
  };
}

export default function GetPage({ loaderData }: Route.ComponentProps) {
  const { question, answers, session } = loaderData;

  const fetcher = useFetcher();

  const { voteState, voteDisplay } = useMemo(() => {
    let state: "upvote" | "downvote" | "unvote" = "unvote";
    let display = question.voteCount;

    if (fetcher.formData) {
      const voteType = fetcher.formData.get("voteType");
      if (voteType === "upvote") {
        state = "upvote";
        if (question.vote) {
          if (question.vote.vote_type === "downvote") {
            display = question.voteCount + 2;
          } else if (question.vote.vote_type === "upvote") {
            display = question.voteCount - 1;
            state = "unvote";
          }
        } else {
          display = question.voteCount + 1;
        }
      } else if (voteType === "downvote") {
        state = "downvote";
        if (question.vote) {
          if (question.vote.vote_type === "upvote") {
            display = question.voteCount - 2;
          } else if (question.vote.vote_type === "downvote") {
            display = question.voteCount + 1;
            state = "unvote";
          }
        } else {
          display = question.voteCount - 1;
        }
      }
    } else {
      if (question.vote) {
        state = question.vote.vote_type;
      }
    }

    return { voteState: state, voteDisplay: display };
  }, [fetcher.formData, question.vote, question.voteCount]);

  useEffect(() => {
    document.title = `Question: ${question.title}`;
  }, [question]);

  const onUpvote = useCallback(() => {
    fetcher.submit(
      { voteType: "upvote" },
      { method: "post", action: `/api/question/${question.id}/vote` },
    );
  }, [fetcher, question.id]);

  const onDownvote = useCallback(() => {
    fetcher.submit(
      { voteType: "downvote" },
      { method: "post", action: `/api/question/${question.id}/vote` },
    );
  }, [fetcher, question.id]);

  const deleteQuestion = useCallback(() => {
    fetcher.submit(null, {
      method: "post",
      action: `/api/question/${question.id}/delete`,
    });
  }, [fetcher, question.id]);

  return (
    <div className="min-h-screen text-slate-100 py-10">
      <Link
        to="/question"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Questions
      </Link>

      <div className="mx-auto max-w-5xl bg-slate-800 border border-slate-800 rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-6">{question.title}</h1>

        <div className="flex gap-6">
          <UpvoteDownvote
            state={voteState}
            display={voteDisplay}
            onUpvoteClick={onUpvote}
            onDownvoteClick={onDownvote}
          />

          <div className="flex-1 flex flex-col gap-4">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
              {question.content}
            </p>

            <div className="flex flex-wrap gap-2">
              {question.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs rounded-full bg-gray-700 text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex gap-2 items-center justify-center rounded-lg self-end text-xs text-slate-400 bg-slate-900 p-3">
              {question.author.image && (
                <img
                  src={question.author.image}
                  alt={question.author.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div>
                  asked {new Date(question.createdAt).toLocaleDateString()}
                </div>
                <div className="text-slate-200 font-medium">
                  {question.author.name}
                </div>
              </div>
            </div>
          </div>
        </div>

        {session?.user.id === question.createdByUserId && (
          <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-end gap-4">
            <div className="flex gap-4">
              <Link
                to={`/question/${question.id}/edit`}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Edit
              </Link>
            </div>

            <button
              onClick={deleteQuestion}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <div className="mt-10 mx-auto max-w-5xl">
        <h2 className="text-xl font-semibold mb-6">
          {answers.length > 0 ? answers.length : "No"} Answer
          {answers.length !== 1 && "s"}
        </h2>

        {answers.length > 0 && (
          <div className="flex flex-col gap-6">
            {answers.map((answer) => (
              <AnswerItem
                key={answer.id}
                answer={answer}
                sessionUserId={session?.user.id}
                questionId={question.id}
              />
            ))}
          </div>
        )}
      </div>

      {session && <AnswerForm questionId={question.id} />}
    </div>
  );
}
