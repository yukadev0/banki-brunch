import { Link, type LoaderFunctionArgs } from "react-router";
import type { Route } from "./+types/questions";
import {
  QuestionsRepository,
  type GetAllQuestionsArgs,
} from "~/repositories/question.repository";
import { createAuth } from "~/lib/auth.server";
import { useState } from "react";

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Questions" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  return await QuestionsRepository.delete(context.db, Number(id));
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  const questions = await QuestionsRepository.getAll(context.db);

  return { session, questions };
}

export default function Questions({ loaderData }: Route.ComponentProps) {
  const { questions, session } = loaderData;
  const [search, setSearch] = useState("");

  return (
    <div className="min-h-screen text-white flex flex-col items-center py-10 px-4">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <h1 className="text-4xl font-semibold text-center mb-12">Questions</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search..."
        className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
      />

      <div className="w-full max-w-6xl py-6">
        {questions.length === 0 ? (
          <p className="text-center text-gray-400">No questions found</p>
        ) : (
          <ul className="space-y-6">
            {questions
              .filter((question) => question.title.toLowerCase().includes(search.toLowerCase()))
              .map((question: GetAllQuestionsArgs[0]) => (
                <li
                  key={question.id}
                  className="bg-gray-800 rounded-lg border border-gray-700 p-6 hover:bg-gray-700 transition"
                >
                  <Link to={`./${question.id}`} className="block">
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
                      <div className="flex gap-2">
                        {question.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-700 text-sm px-3 py-1 rounded-lg"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

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
        <Link
          to="./create"
          className="mt-6 inline-block bg-blue-500 hover:bg-blue-600 text-white py-2 px-6 rounded-lg text-lg"
        >
          Create Question
        </Link>
      )}
    </div>
  );
}
