import { Link } from "react-router";
import type { Route } from "./+types/tags";
import {
  TagsRepository,
  type TagsSelectArgs,
} from "~/repositories/tags.repository";

export function meta() {
  return [{ title: "Tags" }];
}

export async function loader({ context }: Route.LoaderArgs) {
  const tags = await TagsRepository.getAll(context.db);
  return { tags };
}

export default function TagsPage({ loaderData }: Route.ComponentProps) {
  const { tags } = loaderData;

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
          <span
            key={tag.id}
            className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
          >
            {tag.name}
          </span>
        ))}
      </div>

      <Link
        to="/tags/create"
        className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
      >
        Create Tag
      </Link>
    </div>
  );
}
