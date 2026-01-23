import { requireSession } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/vote";

export async function action({ context, request, params }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();
  const voteType = formData.get("voteType");
  const answerId = Number(params.id);
  const questionId = Number(formData.get("questionId"));

  if (
    !voteType ||
    (voteType !== "upvote" && voteType !== "downvote") ||
    !answerId ||
    !questionId
  ) {
    return { error: "Missing required fields" };
  }

  try {
    await AnswersRepository.vote(
      context.db,
      session.user.id,
      answerId,
      questionId,
      voteType as "upvote" | "downvote",
    );

    return { success: "Answer voted successfully" };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
