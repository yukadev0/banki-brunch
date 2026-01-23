import { requireSession } from "~/lib/auth.helper";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/vote";

export async function action({ context, request, params }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();

  const answerId = params.id;
  const voteType = formData.get("voteType");
  const questionId = formData.get("questionId");

  try {
    await AnswersRepository.vote(
      context.db,
      session.user.id,
      Number(answerId),
      Number(questionId),
      voteType as "upvote" | "downvote",
    );
  } catch (error) {
    return { error: "Something went wrong" };
  }
}
