import { AnswersRepository } from "~/repositories/answer.repository";
import type { Route } from "./+types/answers.json";

export async function loader({ params, context }: Route.LoaderArgs) {
  const questionId = Number(params.questionId);
  if (!questionId)
    throw new Response("Question id is required", { status: 400 });

  const answers = await AnswersRepository.getByQuestionId(
    context.db,
    questionId
  );

  return { answers };
}
