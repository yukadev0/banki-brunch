import { Link, useLoaderData, type LoaderFunctionArgs } from "react-router";
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

  return await UsersRepository.delete(context.db, Number(id));
}

export async function loader({ context }: Route.LoaderArgs) {
  const users = await UsersRepository.getAll(context.db);
  return { users };
}

export default function Users() {
  const { users } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
      <Link
        to="/"
        className="absolute top-4 left-4 cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
      >
        Home
      </Link>

      <h1 className="text-4xl">Users</h1>
      <div className="py-12">
        {users.length === 0 ? (
          <p>No users found</p>
        ) : (
          <ul className="text-center flex gap-2 max-w-xl flex-wrap justify-center">
            {users.map((user: UserSelectArgs) => (
              <li
                key={user.id}
                className="bg-green-500 hover:bg-green-600 transition cursor-pointer rounded-xl"
              >
                <Link to={`./${user.id}`} className="px-4 py-2 block">
                  {user.username}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <Link
        to="./create"
        className="cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
      >
        Create User
      </Link>
    </div>
  );
}
