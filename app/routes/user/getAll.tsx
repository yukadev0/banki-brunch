import { Link, redirect, type LoaderFunctionArgs } from "react-router";
import { UsersRepository } from "~/repositories/user/repository";
import type { UserSelectArgs } from "~/repositories/user/types";
import type { Route } from "./+types/getAll";

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Users" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  await UsersRepository.delete(context.db, id as string);

  return redirect("/users");
}

export async function loader({ context }: Route.LoaderArgs) {
  const users = await UsersRepository.getAll(context.db);
  return { users };
}

export default function Users({ loaderData }: Route.ComponentProps) {
  const { users } = loaderData;

  return (
    <div className="min-h-screen text-gray-100 flex flex-col gap-8 items-center justify-center">
      <Link
        to="/"
        className="absolute top-4 left-4 text-sm text-blue-400 hover:underline"
      >
        Home
      </Link>

      <h1 className="text-4xl font-semibold text-center text-gray-50">Users</h1>

      <div className="w-full max-w-6xl py-6">
        {users.length === 0 ? (
          <p className="text-center text-gray-400">No users found</p>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {users.map((user: UserSelectArgs) => (
              <li
                key={user.id}
                className="bg-gray-800 hover:bg-gray-700 transition cursor-pointer rounded-lg border border-gray-700 shadow-lg"
              >
                <Link to={`./${user.id}`} className="block p-6 text-center">
                  {user.image && (
                    <img
                      src={user.image}
                      alt={user.name}
                      className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-gray-600"
                    />
                  )}

                  <div className="text-lg font-medium text-white mb-1">
                    {user.name}
                  </div>

                  <div className="text-sm text-gray-400">
                    Joined on{" "}
                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
