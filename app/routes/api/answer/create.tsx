import { redirect } from "react-router";
import type { Route } from "./+types/create";
import { createAuth } from "~/lib/auth.server";
import { AnswersRepository } from "~/repositories/answer/repository";

export async function action({ context, request }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  const formData = await request.formData();

  const content = formData.get("content");
  const questionId = formData.get("questionId");

  if (!questionId || !Number(questionId) || !content) {
    throw new Response("Question id or content is required", { status: 400 });
  }

  await AnswersRepository.create(context.db, {
    content: content as string,
    questionId: Number(questionId),
    createdByUserId: session.user.id,
  });
}
