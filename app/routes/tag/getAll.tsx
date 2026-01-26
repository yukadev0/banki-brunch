import { useCallback } from "react";
import { Link, useFetcher } from "react-router";
import { getSession } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { TagsSelectArgs } from "~/repositories/tag/types";
import { deleteTag } from "../api/tag/helpers";
import type { Route } from "./+types/getAll";

export function meta() {
  return [{ title: "Tags" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await getSession(context, request);

  const tags = await TagsRepository.getAll(context.db);
  return { tags, session };
}

function TagItem({ tag }: { tag: TagsSelectArgs }) {
  const fetcher = useFetcher();

  const deleteTagCallback = useCallback(() => {
    deleteTag(tag.name, fetcher);
  }, [tag.name]);

  return (
    <span>
      <button
        onClick={deleteTagCallback}
        className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
      >
        {tag.name}
      </button>
    </span>
  );
}

export default function GetAllPage({ loaderData }: Route.ComponentProps) {
  const { tags, session } = loaderData;

  return (
    <div className="min-h-screen flex flex-col gap-16 items-center justify-center">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <h1 className="text-4xl font-semibold text-center">Tags</h1>

      <div className="flex gap-2 flex-wrap text-sm">
        {tags.map((tag: TagsSelectArgs) => (
          <TagItem key={tag.id} tag={tag} />
        ))}
      </div>

      {session && (
        <Link
          to="/tag/create"
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
        >
          Create Tag
        </Link>
      )}
    </div>
  );
}
