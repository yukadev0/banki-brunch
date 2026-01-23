import { requireSession } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/create";

export async function action({ context, request }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();

  const content = formData.get("content");
  const questionId = formData.get("questionId");

  if (!questionId || !Number(questionId) || !content) {
    throw new Response("Question id or content is required", { status: 400 });
  }

  await AnswersRepository.create(context.db, {
    content: content as string,
    questionId: Number(questionId),
    createdByUserId: session.user.id,
  });
}
