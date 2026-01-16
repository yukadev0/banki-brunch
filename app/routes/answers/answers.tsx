import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
import {
  AnswersRepository,
  type AnswerSelectArgs,
} from "~/repositories/answer.repository";
import type { Route } from "./+types/answers";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Answers" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  return await AnswersRepository.delete(context.db, Number(id));
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const answers = await AnswersRepository.getByQuestionId(
    context.db,
    Number(params.questionId)
  );
  return { answers };
}

export default function Answers() {
  const { answers } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
      <h1 className="text-4xl">Answers</h1>
      <div className="py-12">
        {answers.length === 0 ? (
          <p>No answers found</p>
        ) : (
          <ul className="text-center flex gap-2 max-w-xl flex-wrap justify-center">
            {answers.map((answer: AnswerSelectArgs) => (
              <li
                key={answer.id}
                className="bg-green-500 hover:bg-green-600 transition cursor-pointer rounded-xl"
              >
                <Link to={`./${answer.id}`} className="px-4 py-2 block">
                  <p>{answer.content}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        to="./create"
        className="cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
      >
        Create Answer
      </Link>
    </div>
  );
}
