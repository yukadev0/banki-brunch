import { useState, useEffect } from "react";
import { Form, isRouteErrorResponse, Link, useActionData } from "react-router";
import { UsersRepository } from "~/repositories/user.repository";
import type { Route } from "./+types/create.user";

type ActionData = Awaited<ReturnType<typeof action>>;

export function meta() {
  return [{ title: "Create User" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name");

  const user = await UsersRepository.create(context.db, {
    name: name as string,
  });

  return user;
}

export default function CreateUser() {
  const [nameInput, setNameInput] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const actionData = useActionData<ActionData>();

  useEffect(() => {
    if (!actionData?.success) {
      return;
    }

    setNameInput("");
    setShowSuccess(true);
    const timer = setTimeout(() => setShowSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [actionData]);

  return (
    <div className="min-h-screen flex items-center justify-center via-slate-800 to-slate-900 text-slate-100 px-2 relative">
      <Link
        to="/users"
        className="absolute top-4 left-4 cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
      >
        Users
      </Link>
      
      {showSuccess && (
        <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded shadow-lg animate-fadeIn">
          User added
        </div>
      )}

      <div className="flex flex-col gap-4 w-full max-w-md rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-white/20 p-8">
        <h1 className="text-3xl font-semibold text-center">Create User</h1>

        <Form method="post" className="flex flex-col gap-8">
          <div className="flex flex-col gap-2">
            <label
              htmlFor="name"
              className="text-sm font-medium text-slate-200"
            >
              Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter name"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className={`hover:ring-blue-500 rounded-lg bg-slate-900/70 px-4 py-2 text-slate-100 ring-1 ring-white/20 focus:outline-none focus:ring-2 focus:ring-blue-500 transition
                ${actionData?.error ? "ring-red-500" : ""}`}
            />
            {actionData?.error && (
              <span className="text-red-400 text-sm mt-1">
                {actionData.error}
              </span>
            )}
          </div>

          <button
            type="submit"
            className="rounded-xl py-2.5 font-semibold text-white bg-blue-500 hover:bg-blue-600 active:scale-[0.98] transition duration-200 cursor-pointer"
          >
            Create
          </button>
        </Form>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <main className="pt-16 p-4 container mx-auto">
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </main>
    );
  } else if (error instanceof Error) {
    return (
      <main className="pt-16 p-4 container mx-auto">
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </main>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
