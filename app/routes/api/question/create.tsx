import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/create";
import { redirect } from "react-router";
import { QuestionsRepository } from "~/repositories/question/repository";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  const formData = await request.formData();

  const title = formData.get("title");
  const content = formData.get("content");
  const selectedTags = JSON.parse(formData.get("tags") as string);

  if (!title || !content) {
    throw new Response("Title and content are required", { status: 400 });
  }

  await QuestionsRepository.create(context.db, {
    tags: selectedTags,
    title: title as string,
    content: content as string,
    createdByUserId: session.user.id,
  });
}
