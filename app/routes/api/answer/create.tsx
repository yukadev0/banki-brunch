import { requireSession } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/create";

export async function action({ context, request }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();
  const content = formData.get("content") as string;
  const questionId = Number(formData.get("questionId"));

  if (!content || !questionId) {
    return { status: "error", message: "Missing required fields" };
  }

  try {
    await AnswersRepository.create(context.db, {
      content: content,
      questionId: questionId,
      createdByUserId: session.user.id,
    });

    return { status: "success", message: "Answer created successfully" };
  } catch (error) {
    return { status: "error", message: "Something went wrong" };
  }
}
