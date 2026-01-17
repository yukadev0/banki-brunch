import {
  Link,
  redirect,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import {
  UsersRepository,
  type UserSelectArgs,
} from "~/repositories/user.repository";
import type { Route } from "./+types/users";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Users" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  await UsersRepository.delete(context.db, Number(id));

  return redirect("/users");
}

export async function loader({ context }: Route.LoaderArgs) {
  const users = await UsersRepository.getAll(context.db);
  return { users };
}

export default function Users() {
  const { users } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col gap-8 items-center justify-center py-12 px-6">
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
          <ul className="space-y-6">
            {users.map((user: UserSelectArgs) => (
              <li
                key={user.id}
                className="bg-gray-800 hover:bg-gray-700 transition cursor-pointer rounded-lg border border-gray-700 p-6 shadow-lg"
              >
                <Link
                  to={`./${user.id}`}
                  className="block text-center text-lg font-medium text-white"
                >
                  <div className="flex justify-between items-center mb-4">
                    <span>{user.username}</span>
                  </div>
                  <div className="text-sm text-gray-400">{user.role}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Link
        to="./create"
        className="mt-8 inline-block bg-blue-500 text-white py-2 px-6 rounded-lg text-lg hover:bg-blue-600 transition duration-300"
      >
        Create User
      </Link>
    </div>
  );
}
