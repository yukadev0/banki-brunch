import { createAuth } from "~/lib/auth.server";
import { Form, Link, redirect, useFetcher } from "react-router";
import { useCallback, useEffect, useState } from "react";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/create";

export function meta() {
  return [{ title: "Create Tag" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }
}

export default function CreatePage() {
  const fetcher = useFetcher();
  const [tagNameInput, setTagNameInput] = useState("");

  useEffect(() => {
    setTagNameInput("");
  }, [fetcher.state]);

  const createTag = useCallback(() => {
    fetcher.submit(
      {
        name: tagNameInput,
      },
      { method: "post", action: "/api/tag/create" },
    );
  }, [tagNameInput]);

  return (
    <div className="min-h-screen text-slate-100 py-10 flex flex-col gap-6 items-center justify-center">
      <Link
        to="/tag"
        className="absolute top-4 left-4 cursor-pointer text-sm text-blue-400 hover:underline"
      >
        Back to Tags
      </Link>

      <div className="w-full max-w-xl rounded-2xl bg-slate-800 border border-slate-700 p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Create a New Tag
        </h1>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="tag-name">
              Tag Name
            </label>
            <input
              id="tag-name"
              value={tagNameInput}
              placeholder="Tag name"
              onChange={(e) => setTagNameInput(e.target.value)}
              className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <button
            onClick={createTag}
            className="rounded-xl py-2.5 font-semibold bg-blue-500 hover:bg-blue-600 transition"
          >
            Create Tag
          </button>
        </div>
      </div>
    </div>
  );
}
