import clsx from "clsx";
import { useEffect, useState } from "react";
import { Form } from "react-router";

type Props = {
  actionData:
    | {
        status: "error";
        message: string;
      }
    | {
        status: "success";
        message: string;
      }
    | undefined;
};

export function AnswerForm({ actionData }: Props) {
  const [answerInput, setAnswerInput] = useState("");

  useEffect(() => {
    if (actionData && actionData.status === "success") {
      setAnswerInput("");
    }
  }, [actionData]);

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

      {actionData && (
        <p
          className={clsx(
            "text-sm",
            actionData.status === "error" ? "text-red-500" : "text-green-500",
          )}
        >
          {actionData.message}
        </p>
      )}

      <Form method="post">
        <input type="hidden" name="intent" value="create-answer" />
        <input type="hidden" name="content" value={answerInput} />
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
