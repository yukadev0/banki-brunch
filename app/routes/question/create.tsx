import { useCallback, useEffect, useState } from "react";
import { Link, useFetcher } from "react-router";
import { tagsSchema } from "~/db/schemas/tag";
import { requireSession } from "~/lib/auth.helper";
import type { Route } from "./+types/create";

export function meta() {
  return [{ title: "Create Question" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  await requireSession(context, request);

  const allTags = await context.db.select().from(tagsSchema);
  return { allTags };
}

export default function CreatePage({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const [titleInput, setTitleInput] = useState("");
  const [contentInput, setContentInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = loaderData?.allTags ?? [];

  const toggleTag = (tagName: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagName)
        ? prev.filter((t) => t !== tagName)
        : [...prev, tagName],
    );
  };

  const createQuestion = useCallback(
    () =>
      fetcher.submit(
        {
          title: titleInput,
          content: contentInput,
          tags: JSON.stringify(selectedTags),
        },
        { method: "post", action: "/api/question/create" },
      ),
    [titleInput, contentInput, selectedTags],
  );

  useEffect(() => {
    if (fetcher.state !== "loading") return;

    setTitleInput("");
    setContentInput("");
    setSelectedTags([]);
  }, [fetcher.state]);

  return (
    <div className="min-h-screen text-slate-100 py-10 flex flex-col gap-6 items-center justify-center">
      <Link
        to="/question"
        className="absolute top-4 left-4 cursor-pointer text-sm text-blue-400 hover:underline"
      >
        Back to Questions
      </Link>

      <div className="w-full max-w-xl rounded-2xl bg-slate-800 border border-slate-700 p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Create a New Question
        </h1>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="title">
              Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="content">
              Content
            </label>
            <textarea
              name="content"
              id="content"
              rows={6}
              value={contentInput}
              onChange={(e) => setContentInput(e.target.value)}
              className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag.name}
                type="button"
                onClick={() => toggleTag(tag.name)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  selectedTags.includes(tag.name)
                    ? "bg-blue-500 text-white"
                    : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          <button
            onClick={createQuestion}
            className="rounded-xl py-2.5 font-semibold bg-blue-500 hover:bg-blue-600 transition"
          >
            Create Question
          </button>
        </div>
      </div>
    </div>
  );
}
