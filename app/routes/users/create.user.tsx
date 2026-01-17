import { useState, useEffect } from "react";
import { Form, Link, useActionData } from "react-router";
import { UsersRepository } from "~/repositories/user.repository";
import type { Route } from "./+types/create.user";

type ActionData = Awaited<ReturnType<typeof action>>;

export function meta() {
  return [{ title: "Create User" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name");

  if (!name) {
    return { error: "Name is required" };
  }

  await UsersRepository.create(context.db, {
    username: name as string,
  });

  return { success: true };
}

export default function CreateUser() {
  const [nameInput, setNameInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const actionData = useActionData<ActionData>();

  useEffect(() => {
    if (!actionData?.success) return;

    setNameInput("");
    setShowSuccess(true);

    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [actionData]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 py-10 px-4">
      <Link
        to="/users"
        className="absolute top-4 left-4 text-sm text-blue-500 hover:underline"
      >
        Back to Users
      </Link>

      {showSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fadeIn">
          User added successfully!
        </div>
      )}

      <div className="flex flex-col gap-6 w-full max-w-lg bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
        <h1 className="text-3xl font-semibold text-center text-white mb-6">
          Create User
        </h1>

        <Form method="post" className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className={`bg-gray-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all
                ${actionData?.error ? "ring-2 ring-red-500" : "ring-1 ring-gray-600"}`}
            />
            {actionData?.error && (
              <span className="text-red-400 text-sm mt-1">
                {actionData.error}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="py-2 px-6 rounded-xl bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition duration-150"
          >
            Create
          </button>
        </Form>
      </div>
    </div>
  );
}
