import { requireSession } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/vote";

export async function action({ params, context, request }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();
  const voteType = formData.get("voteType");

  if (!voteType || (voteType !== "upvote" && voteType !== "downvote")) {
    return { error: "Missing required fields" };
  }

  const questionId = Number(params.id);

  try {
    await QuestionsRepository.vote(
      context.db,
      questionId,
      session.user.id,
      voteType,
    );

    return { success: "Question voted successfully" };
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
