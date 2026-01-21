import { Form, Link, redirect, useFetcher } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { createAuth } from "~/lib/auth.server";
import UpvoteDownvote from "~/components/UpvoteDownvote";
import { QuestionsRepository } from "~/repositories/question/repository";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/get";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Question: ${params.id}` }];
}

export async function action({ request, context, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  switch (intent) {
    case "delete":
      const id = formData.get("id");
      if (!id) {
        throw new Response("Question id is required", { status: 400 });
      }

      const question = await QuestionsRepository.getById(
        context.db,
        Number(id),
      );

      if (session.user.id !== question.createdByUserId) {
        throw new Response("Unauthorized", { status: 401 });
      }

      await QuestionsRepository.delete(context.db, Number(id));
      return redirect("/questions");

    case "create-answer":
      const questionId = params.id;
      const content = formData.get("content");

      if (!questionId || !content) {
        throw new Response("Missing required fields", { status: 400 });
      }

      await AnswersRepository.create(context.db, {
        questionId: Number(questionId),
        content: content as string,
        createdByUserId: session.user.id,
      });

      return redirect(`/question/${questionId}`);

    default:
      throw new Response("Invalid intent", { status: 400 });
  }
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  const question = await QuestionsRepository.getById(
    context.db,
    Number(params.id),
  );

  const answers = (
    await AnswersRepository.getByQuestionId(context.db, Number(params.id))
  ).sort((a, b) => b.voteCount - a.voteCount);

  const questionVoteCount = await QuestionsRepository.getVoteCount(
    context.db,
    Number(params.id),
  );

  const questionVote = await QuestionsRepository.getVote(
    context.db,
    question.id,
    session?.user?.id || "0",
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
              {answer.author.name || "Anonymous"}
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

export function AnswerForm() {
  const [answerInput, setAnswerInput] = useState("");

  // useEffect(() => {
  //   setAnswerInput("");
  // }, []);

  return (
    <div className="mt-10 mx-auto max-w-5xl bg-slate-800 border border-slate-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold mb-4">Your Answer</h2>

      <Form method="post" className="flex flex-col items-start gap-4">
        <input type="hidden" name="intent" value="create-answer" />
        <textarea
          name="content"
          rows={6}
          value={answerInput}
          onChange={(e) => setAnswerInput(e.target.value)}
          placeholder="Write your answer here..."
          className="w-full rounded-lg bg-slate-900/70 px-4 py-3 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          className="rounded-lg px-6 py-2 font-semibold bg-blue-500 hover:bg-blue-600 transition"
        >
          Post Answer
        </button>
      </Form>
    </div>
  );
}

export default function GetPage({ loaderData }: Route.ComponentProps) {
  const { question, answers, session } = loaderData;

  const fetcher = useFetcher();
  const [voteState, setVoteState] = useState<
    "upvoted" | "downvoted" | "unvoted"
  >("unvoted");

  useEffect(() => {
    document.title = `Question: ${question.title}`;
  }, [question]);

  useEffect(() => {
    if (question.vote === null) {
      setVoteState("unvoted");
      return;
    }

    if (question.vote.vote_type === "upvote") {
      setVoteState("upvoted");
    } else if (question.vote.vote_type === "downvote") {
      setVoteState("downvoted");
    }
  }, [question.vote]);

  const onUpvote = useCallback(() => {
    fetcher.submit(
      { questionId: question.id, voteType: "upvote" },
      { method: "post", action: "/api/question/vote" },
    );
  }, [fetcher, question.id]);

  const onDownvote = useCallback(() => {
    fetcher.submit(
      { questionId: question.id, voteType: "downvote" },
      { method: "post", action: "/api/question/vote" },
    );
  }, [fetcher, question.id]);

  return (
    <div className="min-h-screen text-slate-100 py-10">
      <Link
        to="/questions"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Questions
      </Link>

      <div className="mx-auto max-w-5xl bg-slate-800 border border-slate-800 rounded-xl p-6">
        <h1 className="text-2xl font-semibold mb-6">{question.title}</h1>

        <div className="flex gap-6">
          <UpvoteDownvote
            state={voteState}
            onUpvoteClick={onUpvote}
            display={question.voteCount}
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
                  {question.author.name || "Anonymous"}
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

            <Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={question.id} />
              <button
                type="submit"
                className="text-sm text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </Form>
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

      {session && <AnswerForm />}
    </div>
  );
}
