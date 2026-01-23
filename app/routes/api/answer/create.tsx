import { requireSession } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/create";

export async function action({ context, request, params }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();
  const content = formData.get("content") as string;

  if (!content) {
    return { error: "Missing required fields" };
  }

  const questionId = Number(params.questionId);

  try {
    await AnswersRepository.create(context.db, {
      content: content,
      questionId: questionId,
      createdByUserId: session.user.id,
    });

    return { success: "Answer created successfully" };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
