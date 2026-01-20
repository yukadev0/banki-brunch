import { Form, Link, redirect } from "react-router";
import { useEffect, useState } from "react";
import type { Route } from "./+types/question.$id";
import { QuestionsRepository } from "~/repositories/question.repository";
import { UsersRepository } from "~/repositories/user.repository";
import { AnswersRepository } from "~/repositories/answer.repository";
import { createAuth } from "~/lib/auth.server";
import UpvoteDownvote from "~/components/UpvoteDownvote";

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

      return redirect(`/questions/${questionId}`);

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
  ).sort((a, b) => b.upvotes - b.downvotes - (a.upvotes - a.downvotes));

  const questionAuthor = await UsersRepository.getById(
    context.db,
    question.createdByUserId,
  );

  return { question, questionAuthor, answers, session };
}

export default function QuestionPage({ loaderData }: Route.ComponentProps) {
  const { question, questionAuthor, answers, session } = loaderData;
  const [answerInput, setAnswerInput] = useState("");

  useEffect(() => {
    document.title = `Question: ${question.title}`;
  }, [question]);

  useEffect(() => {
    setAnswerInput("");
  }, [answers]);

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
            display={0}
            state="unvoted"
            onUpvoteClick={() => console.log("upvote")}
            onDownvoteClick={() => console.log("downvote")}
          />

          <div className="flex-1 flex flex-col gap-4">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
              {question.content}
            </p>

            <div className="flex gap-2 items-center justify-center rounded-lg self-end text-xs text-slate-400 bg-slate-900 p-3">
              {questionAuthor.image && (
                <img
                  src={questionAuthor.image}
                  alt={questionAuthor.name}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <div>
                  asked {new Date(question.createdAt).toLocaleDateString()}
                </div>
                <div className="text-slate-200 font-medium">
                  {questionAuthor.name || "Anonymous"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {session?.user.id === question.createdByUserId && (
          <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-end gap-4">
            <div className="flex gap-4">
              <Link
                to={`/questions/${question.id}/edit`}
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
              <div
                key={answer.id}
                className="flex gap-6 bg-slate-800 border border-slate-800 rounded-xl p-6"
              >
                <UpvoteDownvote
                  display={0}
                  state="unvoted"
                  onUpvoteClick={() => console.log("upvote")}
                  onDownvoteClick={() => console.log("downvote")}
                />

                <div className="flex flex-col flex-1">
                  <div className="flex gap-4">
                    <div className="flex flex-col gap-2 items-center"></div>
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
                      {answer.content}
                    </p>
                  </div>

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
                        answered{" "}
                        {new Date(answer.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-slate-200 font-medium">
                        {answer.author.name || "Anonymous"}
                      </div>
                    </div>
                  </div>

                  {session?.user.id === answer.createdByUserId && (
                    <div className="mt-6 pt-4 border-t border-slate-700 flex items-center justify-end gap-4">
                      <div className="flex gap-4">
                        <Link
                          to={`/questions/${question.id}/answers/${answer.id}`}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {session && (
        <div className="mt-10 mx-auto max-w-5xl bg-slate-800 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Your Answer</h2>

          <Form method="post">
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
              className="mt-4 rounded-lg px-6 py-2 font-semibold bg-blue-500 hover:bg-blue-600 transition"
            >
              Post Answer
            </button>
          </Form>
        </div>
      )}
    </div>
  );
}
