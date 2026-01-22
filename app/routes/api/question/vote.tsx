import { redirect } from "react-router";
import { createAuth } from "~/lib/auth.server";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/vote";

export async function action({ params, context, request }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

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
