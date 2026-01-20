import { QuestionsRepository } from "~/repositories/question.repository";
import type { Route } from "./+types/questions.vote";
import { redirect } from "react-router";
import { createAuth } from "~/lib/auth.server";

export async function action({ context, request }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return redirect("/login");
  }

  const requestBody: { questionId: number; voteType: "up" | "down" } =
    await request.json();

  const question = await QuestionsRepository.getById(
    context.db,
    requestBody.questionId,
  );

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  if (requestBody.voteType === "up") {
    await QuestionsRepository.upvote(
      context.db,
      requestBody.questionId,
      session.user.id,
    );
  }
  // else if (requestBody.voteType === "down") {
  //   QuestionsRepository.downvote(context.db, requestBody.questionId);
  // }
}
