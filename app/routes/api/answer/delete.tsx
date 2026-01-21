import { redirect } from "react-router";
import type { Route } from "./+types/delete";
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

  if (!answerId) {
    throw new Response("Answer id is required", { status: 400 });
  }

  const answer = await AnswersRepository.getById(context.db, Number(answerId));
  if (session.user.id !== answer.createdByUserId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  await AnswersRepository.delete(context.db, Number(answerId));

  throw redirect(`/question/${answer.questionId}`);
}
