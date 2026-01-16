import {
  Link,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import type { Route } from "./+types/questions";
import {
  QuestionsRepository,
  type QuestionSelectArgs,
} from "~/repositories/question.repository";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Questions" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  return await QuestionsRepository.delete(context.db, Number(id));
}

export async function loader({ context }: Route.LoaderArgs) {
  const questions = await QuestionsRepository.getAll(context.db);
  return { questions };
}

export default function Questions() {
  const { questions } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
      <Link
        to="/"
        className="absolute top-4 left-4 cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
      >
        Home
      </Link>

      <h1 className="text-4xl">Questions</h1>
      <div className="py-12">
        {questions.length === 0 ? (
          <p>No questions found</p>
        ) : (
          <ul className="text-center flex gap-2 max-w-xl flex-wrap justify-center">
            {questions.map((question: QuestionSelectArgs) => (
              <li
                key={question.id}
                className="bg-green-500 hover:bg-green-600 transition cursor-pointer rounded-xl"
              >
                <Link to={`./${question.id}`} className="px-4 py-2 block">
                  <h1 className="text-lg">{question.title}</h1>
                  <p>{question.content}</p>
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
        Create Question
      </Link>
    </div>
  );
}
