import { redirect } from "react-router";
import { createAuth } from "~/lib/auth.server";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/delete";

export async function action({ params, context, request }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  const formData = await request.formData();

  const id = params.id;
  if (!id) {
    throw new Response("Question id is required", { status: 400 });
  }

  const question = await QuestionsRepository.getById(context.db, Number(id));

  if (!question) {
    throw new Response("Question not found", { status: 404 });
  }

  if (session.user.id !== question.createdByUserId) {
    throw new Response("Unauthorized", { status: 401 });
  }

  await QuestionsRepository.delete(context.db, Number(id));

  throw redirect("/question");
}
