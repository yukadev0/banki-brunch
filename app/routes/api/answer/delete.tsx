import { redirect } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/delete";

export async function action({ params, request, context }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const answerId = Number(params.id);
  if (!answerId) {
    throw new Response("Answer id is required", { status: 400 });
  }

  const answer = await AnswersRepository.getById(context.db, answerId);

  if (!answer) {
    throw new Response("Answer not found", { status: 404 });
  }

  if (session.user.id !== answer.createdByUserId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  await AnswersRepository.delete(context.db, answerId);

  throw redirect(`/question/${answer.questionId}`);
}
