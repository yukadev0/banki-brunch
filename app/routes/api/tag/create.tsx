import { requireAdmin } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/create";

export async function action({ request, context }: Route.ActionArgs) {
  await requireAdmin(context, request);

  const formData = await request.formData();
  const tagName = formData.get("name");

  if (!tagName) {
    return { status: "error", message: "Tag name is required" };
  }

  try {
    await TagsRepository.create(context.db, {
      name: tagName.toString(),
    });

    return { status: "success", message: "Tag created successfully" };
  } catch (error) {
    return { status: "error", message: "Something went wrong" };
  }
}
