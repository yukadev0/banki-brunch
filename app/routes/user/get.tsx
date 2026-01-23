import { useEffect } from "react";
import { Link } from "react-router";
import { getSession } from "~/lib/auth.helper";
import { UsersRepository } from "~/repositories/user/repository";
import type { Route } from "./+types/get";

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `User: ${params.id}` }];
}

export async function loader({ request, params, context }: Route.LoaderArgs) {
  const session = await getSession(context, request);
  const user = await UsersRepository.getById(context.db, params.id);

  if (!user) {
    throw new Response("User not found", { status: 404 });
  }

  return { user, session };
}

export default function GetPage({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  useEffect(() => {
    document.title = `User: ${user.name}`;
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-gray-100">
      <Link
        to="/user"
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
      </div>
    </div>
  );
}
