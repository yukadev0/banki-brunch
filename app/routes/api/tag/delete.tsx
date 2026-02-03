import { requireAdmin } from "~/lib/auth.helper";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/delete";

export async function action({ request, context, params }: Route.ActionArgs) {
  await requireAdmin(context, request);

  try {
    await TagsRepository.delete(context.db, params.name);
    return { status: "success" as const, message: "Tag deleted successfully" };
  } catch (error) {
    return { status: "error" as const, message: "Something went wrong" };
  }
}
