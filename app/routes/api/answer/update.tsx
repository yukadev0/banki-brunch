import { redirect } from "react-router";
import { requireOwnership } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/update";

export async function action({ params, request, context }: Route.ActionArgs) {
  const answerId = Number(params.id);
  const answer = await AnswersRepository.getById(context.db, answerId);

  if (!answer) {
    throw new Response("Answer not found", { status: 404 });
  }

  const session = await requireOwnership(
    context,
    request,
    answer.createdByUserId,
  );

  const formData = await request.formData();
  const content = formData.get("content") as string;
  const questionId = Number(formData.get("questionId"));

  await AnswersRepository.update(context.db, answerId, {
    content: content,
    questionId: questionId,
    createdByUserId: session.user.id,
  });

  throw redirect(`/question/${questionId}/answer/${answerId}`);
}
