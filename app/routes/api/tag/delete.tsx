import { redirect } from "react-router";
import { createAuth } from "~/lib/auth.server";
import { TagsRepository } from "~/repositories/tag/repository";
import type { Route } from "./+types/delete";

export async function action({ request, context, params }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  await TagsRepository.delete(context.db, params.name);
}
