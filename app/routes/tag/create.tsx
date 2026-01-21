import { createAuth } from "~/lib/auth.server";
import { Form, Link, redirect } from "react-router";
import { useEffect, useState } from "react";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/create";

export function meta() {
  return [{ title: "Create Tag" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();

  const tagName = formData.get("tag-name");

  if (!tagName) {
    return { error: "Tag name is required" };
  }

  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  await TagsRepository.create(context.db, {
    name: tagName.toString(),
  });

  return { success: true };
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }
}

export default function CreatePage({ actionData }: Route.ComponentProps) {
  const [tagNameInput, setTagNameInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!actionData?.success) return;

    setTagNameInput("");
    setShowSuccess(true);

    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [actionData]);

  return (
    <div className="min-h-screen text-slate-100 py-10 flex flex-col gap-6 items-center justify-center">
      <Link
        to="/tags"
        className="absolute top-4 left-4 cursor-pointer text-sm text-blue-400 hover:underline"
      >
        Back to Tags
      </Link>

      {showSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg">
          Tag created successfully!
        </div>
      )}

      <div className="w-full max-w-xl rounded-2xl bg-slate-800 border border-slate-700 p-8 shadow-lg">
        <h1 className="text-3xl font-semibold text-center mb-8">
          Create a New Tag
        </h1>

        <Form method="post" className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="tag-name">
              Tag Name
            </label>
            <textarea
              name="tag-name"
              id="tag-name"
              rows={6}
              value={tagNameInput}
              onChange={(e) => setTagNameInput(e.target.value)}
              className="hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
          </div>

          {actionData?.error && (
            <span className="text-red-400 text-sm">{actionData.error}</span>
          )}

          <button
            type="submit"
            className="rounded-xl py-2.5 font-semibold bg-blue-500 hover:bg-blue-600 transition"
          >
            Create Tag
          </button>
        </Form>
      </div>
    </div>
  );
}
