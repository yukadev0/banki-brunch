import { useCallback, useEffect, useState } from "react";
import { useFetcher } from "react-router";

export function AnswerForm({ questionId }: { questionId: number }) {
  const fetcher = useFetcher();
  const [answerInput, setAnswerInput] = useState("");

  useEffect(() => {
    setAnswerInput("");
  }, [fetcher.state]);

  const createAnswer = useCallback(() => {
    fetcher.submit(
      { content: answerInput, questionId: questionId },
      { method: "post", action: "/api/answer/create" },
    );
  }, [answerInput]);

  return (
    <div className="flex flex-col gap-4 items-start mx-auto max-w-5xl bg-slate-800 border border-slate-800 rounded-xl p-6 mt-6">
      <h2 className="text-xl font-semibold">Your Answer</h2>

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
        onClick={createAnswer}
        className="rounded-lg px-6 py-2 font-semibold bg-blue-500 hover:bg-blue-600 transition"
      >
        Post Answer
      </button>
    </div>
  );
}
