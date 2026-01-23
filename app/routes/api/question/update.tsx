import { requireOwnership } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/update";

export async function action({ params, request, context }: Route.ActionArgs) {
  const questionId = Number(params.id);
  const question = await QuestionsRepository.getById(context.db, questionId);

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  const session = await requireOwnership(
    context,
    request,
    question.createdByUserId,
  );

  const formData = await request.formData();
  const title = formData.get("title");
  const content = formData.get("content");
  const selectedTags = JSON.parse(formData.get("tags") as string);

  try {
    await QuestionsRepository.update(context.db, questionId, {
      title: title as string,
      content: content as string,
      tags: selectedTags as string[],
      createdByUserId: session.user.id,
    });

    return { success: "Question updated successfully" };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
