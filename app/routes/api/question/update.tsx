import { redirect } from "react-router";
import type { Route } from "./+types/update";
import { createAuth } from "~/lib/auth.server";
import { QuestionsRepository } from "~/repositories/question/repository";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const questionId = Number(formData.get("id"));

  const question = await QuestionsRepository.getById(context.db, questionId);

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  if (question.createdByUserId !== session.user.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const title = formData.get("title");
  const content = formData.get("content");
  const selectedTags = (formData.get("tags") as string)?.split(",");

  await QuestionsRepository.update(context.db, questionId, {
    title: title as string,
    content: content as string,
    tags: selectedTags as string[],
    createdByUserId: session.user.id,
  });

  throw redirect(`/question/${questionId}`);
}
