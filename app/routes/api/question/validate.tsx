import { requireAdmin } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/validate";

export async function action({ params, request, context }: Route.ActionArgs) {
  const questionId = Number(params.id);
  const question = await QuestionsRepository.getById(context.db, questionId);

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  const session = await requireAdmin(context, request);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  try {
    await QuestionsRepository.validate(context.db, questionId, session.user.id);

    return { success: "Question updated successfully" };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
