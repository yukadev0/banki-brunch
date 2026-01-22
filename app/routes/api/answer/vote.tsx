import { redirect } from "react-router";
import { createAuth } from "~/lib/auth.server";
import { AnswersRepository } from "~/repositories/answer/repository";
import type { Route } from "./+types/vote";

export async function action({ context, request, params }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  const formData = await request.formData();
  const answerId = params.id;
  const answer = await AnswersRepository.getById(context.db, Number(answerId));

  if (!answer) {
    throw new Response("Answer not found", { status: 404 });
  }

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
