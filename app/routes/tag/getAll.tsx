import { Link } from "react-router";
import { getSession, requireAdmin } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/getAll";
import { TagItem } from "./components/TagItem";

export function meta() {
  return [{ title: "Tags" }];
}

export async function loader({ context, request }: Route.LoaderArgs) {
  const session = await getSession(context, request);

  const tags = await TagsRepository.getAll(context.db);

  return { tags: tags.map((tag) => tag.name), role: session?.user.role };
}

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(context, request);

  const formdata = await request.formData();
  const tagName = formdata.get("name");

  try {
    await TagsRepository.delete(context.db, tagName as string);
    return { status: "success" as const, message: "Tag deleted successfully" };
  } catch (error) {
    return { status: "error" as const, message: "Something went wrong" };
  }
}

export default function GetAllPage({ loaderData }: Route.ComponentProps) {
  const { tags, role } = loaderData;

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
        {tags.map((tag) => (
          <TagItem key={tag} tag={tag} />
        ))}
      </div>

      {role && role === "admin" && (
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
