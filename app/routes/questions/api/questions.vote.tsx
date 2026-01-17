import { QuestionsRepository } from "~/repositories/question.repository";
import type { Route } from "./+types/questions.vote";

export async function action({ context }: Route.LoaderArgs) {
  const questions = await QuestionsRepository.getAll(context.db);
  return { questions };
}
