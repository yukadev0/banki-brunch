import { requireSession } from "~/lib/auth.helper";
import { UsersRepository } from "~/repositories/user/repository";
import type { Route } from "./+types/deleteUser";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  try {
    await UsersRepository.delete(context.db, session.user.id);

    return { status: "success" as const, message: "User deleted successfully" };
  } catch (error) {
    return { status: "error" as const, message: "Something went wrong" };
  }
}
