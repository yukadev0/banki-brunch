import { Link } from "react-router";
import type { Route } from "./+types/test";
import { QuestionsRepository } from "~/repositories/question.repository";
import { useState, useEffect } from "react";

type Answer = {
  id: number;
  content: string;
  isValidated: boolean;
  isHiddenByDefault: boolean;
};

export function meta() {
  return [{ title: "Test" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const questions = await QuestionsRepository.getAll(context.db);
  return { questions };
}

export default function Test({ loaderData }: Route.ComponentProps) {
  const { questions } = loaderData;

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswers, setShowAnswers] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);

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
      setAnswers(data.answers);
      setShowAnswers(true);
    } catch {
      setAnswers([]);
      setShowAnswers(true);
    }
  };

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        No questions available.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center text-white px-4 py-12">
      <Link
        to={`/`}
        className="absolute top-4 left-4 cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2 text-white"
      >
        Back
      </Link>

      <div className="flex flex-col gap-8 w-full max-w-3xl rounded-2xl bg-white/10 shadow-2xl border border-white/20 p-8">
        <h1 className="text-3xl font-semibold text-center">Test</h1>

        <div className="flex flex-col gap-6">
          <h2 className="text-2xl text-center">{currentQ.title}</h2>
          <p className="text-lg text-slate-300">{currentQ.content}</p>

          <button
            onClick={handleShowAnswers}
            className="bg-green-500 hover:bg-green-600 transition rounded-xl px-6 py-3 text-lg"
          >
            {showAnswers ? "Hide answers" : "Show answers"}
          </button>

          {showAnswers && (
            <div className="mt-6 flex flex-col gap-4 bg-white/10 p-6 rounded-xl border border-white/20">
              {answers.length === 0 ? (
                <p className="text-slate-300 text-sm">
                  No visible answers yet.
                </p>
              ) : (
                answers.map((a) => (
                  <div
                    key={a.id}
                    className="text-slate-200 text-lg border-b border-slate-600 pb-4"
                  >
                    <p>{a.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-between mt-8">
            <button
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
              className="bg-blue-500 hover:bg-blue-600 transition cursor-pointer rounded-xl px-6 py-3 text-lg disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={currentQuestionIndex === questions.length - 1}
              onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
              className="bg-blue-500 hover:bg-blue-600 transition cursor-pointer rounded-xl px-6 py-3 text-lg disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
