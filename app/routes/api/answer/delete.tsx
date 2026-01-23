import { redirect } from "react-router";
import { requireOwnership } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/delete";

export async function action({ params, request, context }: Route.ActionArgs) {
  const answerId = Number(params.id);
  const answer = await AnswersRepository.getById(context.db, answerId);

  if (!answer) {
    throw new Response("Answer not found", { status: 404 });
  }

  await requireOwnership(context, request, answer.createdByUserId);

  try {
    await AnswersRepository.delete(context.db, answerId);
    throw redirect(`/question/${answer.questionId}`);
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
