import { Link, useLoaderData } from "react-router";
import type { Route } from "./+types/test";
import { QuestionsRepository } from "~/repositories/question.repository";
import { useState, useEffect, useMemo } from "react";

type Answer = {
  id: number;
  content: string;
  isValidated: boolean;
  isHiddenByDefault: boolean;
};

type LoaderData = Awaited<ReturnType<typeof loader>>;

export async function loader({ context }: Route.LoaderArgs) {
  const questions = await QuestionsRepository.getAll(context.db);
  return { questions };
}

export default function Test() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const { questions } = useLoaderData<LoaderData>();

  const currentQ = questions[currentQuestionIndex];

  useEffect(() => {
    setShowAnswers(false);
    setAnswers([]);
  }, [currentQuestionIndex]);

  const handleShowAnswers = async () => {
    if (!currentQ) return;

    if (showAnswers) {
      setShowAnswers(false);
      return;
    }

    try {
      const res = await fetch(`/questions/${currentQ.id}/answers/answers.json`);
      const data: { answers: Answer[] } = await res.json();

      const visibleAnswers = data.answers;
      // .filter(
      //   (a) => a.isValidated && !a.isHiddenByDefault
      // );

      setAnswers(visibleAnswers);
      setShowAnswers(true);
    } catch {
      setAnswers([]);
      setShowAnswers(true);
    }
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No questions
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-slate-100 px-2">
      <Link
        to={`/`}
        className="absolute top-4 left-4 rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2 text-white"
      >
        Back
      </Link>

      <div className="flex flex-col gap-6 w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 p-8">
        <h1 className="text-2xl font-semibold text-center">Test</h1>

        <div className="flex flex-col gap-4">
          <h2 className="text-xl text-center">{currentQ.title}</h2>
          <p>{currentQ.content}</p>

          <button
            onClick={handleShowAnswers}
            className="bg-green-500 hover:bg-green-600 transition rounded-xl px-4 py-2"
          >
            {showAnswers ? "Hide answers" : "Show answers"}
          </button>

          {showAnswers && (
            <div className="mt-4 flex flex-col gap-2 bg-white/10 p-4 rounded-xl border border-white/20">
              {answers.length === 0 ? (
                <p className="text-slate-300 text-sm">
                  No visible answers yet.
                </p>
              ) : (
                answers.map((a) => (
                  <p key={a.id} className="text-slate-200">
                    {a.content}
                  </p>
                ))
              )}
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="bg-blue-500 hover:bg-blue-600 transition cursor-pointer rounded-xl px-4 py-2 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              className="bg-blue-500 hover:bg-blue-600 transition cursor-pointer rounded-xl px-4 py-2 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
