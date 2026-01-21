import { redirect } from "react-router";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/create";
import { TagsRepository } from "~/repositories/tag/repository";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const tagName = formData.get("name");

  if (!tagName) {
    throw new Response("Tag name is required", { status: 400 });
  }

  await TagsRepository.create(context.db, {
    name: tagName.toString(),
  });
}
