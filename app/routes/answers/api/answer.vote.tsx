import { redirect } from "react-router";
import { createAuth } from "~/lib/auth.server";
import type { Route } from "./+types/answer.vote";
import { AnswersRepository } from "~/repositories/answer/repository";

export async function action({ context, request }: Route.ActionArgs) {
  // const session = await createAuth(context.cloudflare.env).api.getSession({
  //   headers: request.headers,
  // });

  // if (!session) {
  //   throw redirect("/login");
  // }

  // const formData = await request.formData();
  // const questionId = formData.get("questionId");
  // const voteType = formData.get("voteType");

  // const question = await AnswersRepository.getById(
  //   context.db,
  //   Number(questionId),
  // );

  // if (!question) {
  //   throw new Response("Question not found", { status: 404 });
  // }

  // await AnswersRepository.vote(
  //   context.db,
  //   Number(questionId),
  //   session.user.id,
  //   voteType as "upvote" | "downvote",
  // );
}
