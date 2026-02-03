import { requireSession } from "~/lib/auth.helper";
import { QuestionsRepository } from "~/repositories/question/repository";
import type { Route } from "./+types/create";

export async function action({ request, context }: Route.ActionArgs) {
  const session = await requireSession(context, request);

  const formData = await request.formData();

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const tags = JSON.parse(formData.get("tags") as string);

  if (!title || !content || !tags) {
    return { status: "error" as const, message: "Missing required fields" };
  }

  try {
    await QuestionsRepository.create(context.db, {
      tags: tags,
      title: title,
      content: content,
      createdByUserId: session.user.id,
    });

    return {
      status: "success" as const,
      message: "Question created successfully",
    };
  } catch (error) {
    return { status: "error" as const, message: "Something went wrong" };
  }
}
