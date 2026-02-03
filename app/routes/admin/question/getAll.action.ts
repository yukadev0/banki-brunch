import { requireAdmin } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/getAll";

export async function action({ context, request }: Route.ActionArgs) {
  const session = await requireAdmin(context, request);

  const formData = await request.formData();

  const intent = formData.get("intent");
  const questionId = Number(formData.get("id"));

  switch (intent) {
    case "delete": {
      try {
        await QuestionsRepository.delete(context.db, questionId);
        return {
          status: "success" as const,
          message: "Question deleted successfully",
        };
      } catch (error) {
        return { status: "error" as const, message: "Something went wrong" };
      }
    }
    case "validate": {
      try {
        await QuestionsRepository.validate(
          context.db,
          questionId,
          session.user.id,
        );
        return {
          status: "success" as const,
          message: "Question validated successfully",
        };
      } catch (error) {
        return { status: "error" as const, message: "Something went wrong" };
      }
    }
    default: {
      throw new Response("Invalid intent", { status: 400 });
    }
  }
}
