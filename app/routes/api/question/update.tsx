import { redirect } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/update";

export async function action({ params, request, context }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();
  const questionId = Number(params.id);

  const question = await QuestionsRepository.getById(context.db, questionId);

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  if (question.createdByUserId !== session.user.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const title = formData.get("title");
  const content = formData.get("content");
  const selectedTags = (formData.get("tags") as string)?.split(",");

  await QuestionsRepository.update(context.db, questionId, {
    title: title as string,
    content: content as string,
    tags: selectedTags as string[],
    createdByUserId: session.user.id,
  });

  throw redirect(`/question/${questionId}`);
}
