import { Form, Link, redirect, useLoaderData } from "react-router";
import { QuestionsRepository } from "~/repositories/question.repository";
import { useEffect } from "react";
import type { Route } from "./+types/question.$id";
import { UsersRepository } from "~/repositories/user.repository";
import { AnswersRepository } from "~/repositories/answer.repository";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `Question: ${params.id}` }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  if (!id) {
    throw new Response("Question id is required", { status: 400 });
  }

  await QuestionsRepository.delete(context.db, Number(id));

  return redirect("/questions");
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const question = await QuestionsRepository.getById(
    context.db,
    Number(params.id),
  );

  const answers = await AnswersRepository.getByQuestionId(
    context.db,
    Number(params.id),
  );

  const questionAuthor = await UsersRepository.getById(
    context.db,
    question.createdByUserId,
  );

  return { question, questionAuthor, answers };
}

export default function QuestionPage() {
  const { question, questionAuthor, answers } = useLoaderData<LoaderData>();

  useEffect(() => {
    document.title = `Question: ${question.title}`;
  }, [question]);

  return (
    <div className="min-h-screen text-slate-100 px-4 py-10">
      <Link
        to="/questions"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Questions
      </Link>

      <div className="flex flex-col gap-4 mx-auto max-w-5xl bg-slate-800 border border-slate-800 rounded-xl p-6">
        <h1 className="text-2xl font-semibold">{question.title}</h1>

        <div className="flex gap-6">
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <button className="hover:text-blue-400 transition">▲</button>
            <span className="text-lg font-medium">0</span>
            <button className="hover:text-blue-400 transition">▼</button>
          </div>

          <div className="flex-1">
            <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
              {question.content}
            </p>

            <div className="flex gap-2">
              {question.tags.length > 0 &&
                question.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-slate-800 px-2 py-1 rounded"
                  >
                    {tag}
                  </span>
                ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                {answers.length > 0 && (
                  <div className="mt-8 border-t border-slate-800 pt-6">
                    <h2 className="text-xl font-semibold mb-6">
                      {answers.length} Answer{answers.length !== 1 && "s"}
                    </h2>

                    <div className="flex flex-col gap-6">
                      {answers.map((answer) => (
                        <div
                          key={answer.id}
                          className="flex gap-6 border-t border-slate-900 pt-6"
                        >
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <button className="hover:text-blue-400 transition">
                              ▲
                            </button>
                            <span className="text-sm font-medium">0</span>
                            <button className="hover:text-blue-400 transition">
                              ▼
                            </button>
                          </div>

                          <div className="flex-1">
                            <p className="whitespace-pre-wrap leading-relaxed text-slate-200">
                              {answer.content}
                            </p>

                            <div className="flex justify-end mt-4">
                              <div className="text-xs text-slate-400 bg-slate-800 rounded p-3">
                                <div>
                                  answered{" "}
                                  {new Date(
                                    answer.createdAt,
                                  ).toLocaleDateString()}
                                </div>
                                <div className="text-slate-200 font-medium">
                                  {answer.author.username || "Anonymous"}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-xs text-slate-400 bg-slate-800 rounded p-3">
                <div>asked {question.createdAt.toLocaleDateString()}</div>
                <div className="text-slate-200 font-medium">
                  {questionAuthor.username}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Form method="post">
            <input type="hidden" name="id" value={question.id} />
            <button
              type="submit"
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Delete Question
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}
