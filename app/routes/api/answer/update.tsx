import { redirect } from "react-router";
import type { Route } from "./+types/update";
import { createAuth } from "~/lib/auth.server";
import { AnswersRepository } from "~/repositories/answer/repository";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const answerId = formData.get("answerId");

  const answer = await AnswersRepository.getById(context.db, Number(answerId));
  
  if (!answer) {
    throw new Response("Answer not found", { status: 404 });
  }

  if (answer.createdByUserId !== session.user.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const content = formData.get("content");
  const questionId = formData.get("questionId");

  await AnswersRepository.update(context.db, Number(answerId), {
    content: content as string,
    questionId: Number(questionId),
    createdByUserId: session.user.id,
  });

  throw redirect(`/question/${questionId}/answer/${answerId}`);
}
