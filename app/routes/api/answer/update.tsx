import { requireOwnership } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/update";

export async function action({ params, request, context }: Route.ActionArgs) {
  const answerId = Number(params.id);
  const answer = await AnswersRepository.getById(context.db, answerId);

  if (!answer) {
    throw new Response("Answer not found", { status: 404 });
  }

  await requireOwnership(context, request, answer.createdByUserId);

  const formData = await request.formData();
  const content = formData.get("content") as string;

  if (!content) {
    return { status: "error" as const, message: "Missing required fields" };
  }

  const questionId = Number(formData.get("questionId"));

  try {
    await AnswersRepository.update(context.db, answerId, {
      content: content,
      questionId: questionId,
      createdByUserId: answer.createdByUserId,
    });

    return {
      status: "success" as const,
      message: "Answer updated successfully",
    };
  } catch (error) {
    return { status: "error" as const, message: "Something went wrong" };
  }
}
