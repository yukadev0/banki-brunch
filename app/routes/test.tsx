import { useFetcher } from "react-router";
import type { Route } from "./+types/test";

export async function loader() {
  return {
    task: {
      title: "Test Task",
      status: "incomplete",
    },
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const status = formData.get("status");

  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { status };
}

export default function Task({ loaderData }: Route.ComponentProps) {
  const fetcher = useFetcher();
  const { task } = loaderData;

  let isComplete = task.status === "complete";
  if (fetcher.formData) {
    isComplete = fetcher.formData.get("status") === "complete";
  }

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
      <div>{task.title}</div>
      <fetcher.Form method="post">
        <button
          name="status"
          value={isComplete ? "incomplete" : "complete"}
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
        >
          {isComplete ? "Mark Incomplete" : "Mark Complete"}
        </button>
      </fetcher.Form>
    </div>
  );
}
