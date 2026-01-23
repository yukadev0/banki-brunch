import { redirect } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import { UsersRepository } from "~/repositories/user/repository";
import type { Route } from "./+types/deleteUser";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  try {
    await UsersRepository.delete(context.db, session.user.id);

    throw redirect("/");
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
