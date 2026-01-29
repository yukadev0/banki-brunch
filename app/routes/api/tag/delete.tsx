import { requireAdmin } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/delete";

export async function action({ request, context, params }: Route.ActionArgs) {
  await requireAdmin(context, request);

  try {
    await TagsRepository.delete(context.db, params.name);
    return { status: "success", message: "Tag deleted successfully" };
  } catch (error) {
    return { status: "error", message: "Something went wrong" };
  }
}
