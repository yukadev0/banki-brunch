import { Form, Link, redirect } from "react-router";
import { UsersRepository } from "~/repositories/user.repository";
import type { Route } from "./+types/user.$id";
import { useEffect } from "react";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `User: ${params.id}` }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  await UsersRepository.delete(context.db, id as string);

  return redirect("/users");
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = await UsersRepository.getById(context.db, params.id);
  return { user };
}

export default function UserPage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  useEffect(() => {
    document.title = `User: ${user.name}`;
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-gray-100 py-12 px-6">
      <Link
        to="/users"
        className="absolute top-4 left-4 text-sm text-blue-500 hover:underline"
      >
        Back to Users
      </Link>

      <div className="flex flex-col items-center w-full max-w-md bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8">
        <h1 className="text-3xl font-semibold text-center mb-4">{user.name}</h1>

        <Form method="post" className="flex flex-col items-center gap-6">
          <input type="hidden" name="id" value={user.id} />
          <button
            type="submit"
            className="text-sm text-red-400 hover:text-red-300 transition"
          >
            Delete User
          </button>
        </Form>
      </div>
    </div>
  );
}
