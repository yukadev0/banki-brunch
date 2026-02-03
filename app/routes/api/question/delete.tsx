import { requireOwnership } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/delete";

export async function action({ params, context, request }: Route.ActionArgs) {
  const questionId = Number(params.id);
  const question = await QuestionsRepository.getById(context.db, questionId);

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  await requireOwnership(context, request, question.createdByUserId);

  try {
    await QuestionsRepository.delete(context.db, Number(questionId));

    return {
      status: "success" as const,
      message: "Question deleted successfully",
    };
  } catch (error) {
    return { status: "error" as const, message: "Something went wrong" };
  }
}
