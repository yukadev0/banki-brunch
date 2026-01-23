import { useMemo, useState } from "react";
import { Form, Link, redirect, type LoaderFunctionArgs } from "react-router";
import { getSession } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/getAll";

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Questions" }];
}

export async function action({ context }: Route.ActionArgs) {
  const question = await QuestionsRepository.getRandom(context.db);

  if (question) {
    return redirect(`/question/${question.id}`);
  }
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await getSession(context, request);

  const questions = await QuestionsRepository.getAll(context.db);
  const tags = await TagsRepository.getAll(context.db);

  return { session, questions, tags };
}

export default function GetAllPage({ loaderData }: Route.ComponentProps) {
  const { questions, session, tags } = loaderData;
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredQuestions = useMemo(() => {
    if (selectedTags.length === 0) {
      return questions;
    }

    return questions.filter((q) =>
      selectedTags.every((t) => q.tags.includes(t)),
    );
  }, [questions, selectedTags]);

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-10 max-w-5xl m-auto">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <h1 className="text-4xl font-semibold text-center mb-6">Questions</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        {tags.map((tag: { name: string }) => {
          const active = selectedTags.includes(tag.name);
          return (
            <button
              key={tag.name}
              onClick={() =>
                setSelectedTags((prev) =>
                  active
                    ? prev.filter((t) => t !== tag.name)
                    : [...prev, tag.name],
                )
              }
              className={`cursor-pointer px-3 py-1 rounded-full text-sm border ${
                active
                  ? "bg-blue-500 border-blue-500"
                  : "bg-gray-800 border-gray-600"
              }`}
            >
              {tag.name}
            </button>
          );
        })}
      </div>

      <div className="w-full max-w-6xl py-6">
        {filteredQuestions.length === 0 ? (
          <p className="text-center text-gray-400">No questions found</p>
        ) : (
          <ul className="space-y-6">
            {filteredQuestions.map((question) => (
              <li
                key={question.id}
                className="bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-700 transition"
              >
                <Link to={`./${question.id}`} className="block p-6">
                  <div className="flex items-center mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-200">
                        {question.title}
                      </h2>
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {question.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="text-xs text-gray-400">
                      <span>
                        Asked{" "}
                        {new Date(question.createdAt).toLocaleDateString()}
                      </span>
                      <br />
                      <span className="font-semibold">
                        {question.author.name ?? "Anonymous"}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {session && (
        <div className="flex gap-2 mt-6">
          <Link
            to="./create"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg"
          >
            Create Question
          </Link>
          <Form method="post">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg"
            >
              Random Question
            </button>
          </Form>
        </div>
      )}
    </div>
  );
}
