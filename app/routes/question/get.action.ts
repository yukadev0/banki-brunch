import { redirect } from "react-router";
import { requireSession } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/get";

export async function action({ request, params, context }: Route.ActionArgs) {
  await requireSession(context, request);

  const formData = await request.formData();
  const intent = formData.get("intent");
  const questionId = Number(params.id);

  switch (intent) {
    case "delete": {
      try {
        await QuestionsRepository.delete(context.db, questionId);
        return redirect("/question");
      } catch (error) {
        return { status: "error", message: "Something went wrong" };
      }
    }
    default: {
      throw new Response("Invalid intent", { status: 400 });
    }
  }
}
