import { requireSession } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/delete";

export async function action({ request, context, params }: Route.ActionArgs) {
  await requireSession(context, request);

  try {
    await TagsRepository.delete(context.db, params.name);

    return { success: "Tag deleted successfully" };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
