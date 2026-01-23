import { requireSession } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/vote";

export async function action({ params, context, request }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();
  const questionId = Number(params.id);
  const voteType = formData.get("voteType");

  try {
    await QuestionsRepository.vote(
      context.db,
      questionId,
      session.user.id,
      voteType as "upvote" | "downvote",
    );
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
