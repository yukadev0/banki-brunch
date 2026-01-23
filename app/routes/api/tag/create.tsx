import { requireSession } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/create";

export async function action({ request, context }: Route.ActionArgs) {
  await requireSession(context, request);

  const formData = await request.formData();
  const tagName = formData.get("name");

  if (!tagName) {
    throw new Response("Tag name is required", { status: 400 });
  }

  await TagsRepository.create(context.db, {
    name: tagName.toString(),
  });
}
