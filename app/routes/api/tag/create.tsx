import { requireSession } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/create";

export async function action({ request, context }: Route.ActionArgs) {
  await requireSession(context, request);

  const formData = await request.formData();
  const tagName = formData.get("name");

  if (!tagName) {
    return { error: "Tag name is required" };
  }

  try {
    await TagsRepository.create(context.db, {
      name: tagName.toString(),
    });

    return { success: "Tag created successfully" };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
