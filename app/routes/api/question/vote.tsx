import { requireSession } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/vote";

export async function action({ params, context, request }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();
  const voteType = formData.get("voteType");
  const questionId = Number(params.id);

  if (
    !voteType ||
    (voteType !== "upvote" && voteType !== "downvote") ||
    !questionId
  ) {
    return { status: "error", message: "Missing required fields" };
  }

  try {
    await QuestionsRepository.vote(
      context.db,
      questionId,
      session.user.id,
      voteType,
    );

    return { status: "success", message: "Question voted successfully" };
  } catch (error) {
    return { status: "error", message: "Something went wrong" };
  }
}
