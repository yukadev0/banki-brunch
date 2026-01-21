import { Form, Link, redirect } from "react-router";
import { useEffect } from "react";
import { createAuth } from "~/lib/auth.server";
import { UsersRepository } from "~/repositories/user/repository";
import type { Route } from "./+types/get";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `User: ${params.id}` }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session || !session.user?.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const id = formData.get("id");

  if (!id || session.user.id !== id.toString()) {
    throw new Response("Unauthorized", { status: 401 });
  }

  await UsersRepository.delete(context.db, id.toString());

  return redirect("/users");
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  const user = await UsersRepository.getById(context.db, params.id);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return { user, session };
}

export default function UserPage({ loaderData }: Route.ComponentProps) {
  const { user, session } = loaderData;

  useEffect(() => {
    document.title = `User: ${user.name}`;
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-100">
      <Link
        to="/users"
        className="absolute top-4 left-4 text-sm text-blue-500 hover:underline"
      >
        Back to Users
      </Link>

      <div className="flex flex-col items-center w-full max-w-md bg-gray-800 rounded-xl shadow-lg border border-gray-700 p-8 gap-6">
        {user.image && (
          <img
            src={user.image}
            alt={user.name}
            className="w-24 h-24 rounded-full border-2 border-gray-600"
          />
        )}

        <h1 className="text-3xl font-semibold text-center">{user.name}</h1>

        <p className="text-sm text-gray-400">
          Joined on{" "}
          {new Date(user.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        {session?.user.id == user.id && (
          <Form method="post" className="flex flex-col items-center gap-6">
            <input type="hidden" name="id" value={user.id} />
            <button
              type="submit"
              className="text-sm text-red-400 hover:text-red-300 transition"
            >
              Delete User
            </button>
          </Form>
        )}
      </div>
    </div>
  );
}
