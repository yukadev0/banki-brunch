import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  type LoaderFunctionArgs,
} from "react-router";
import {
  UsersRepository,
  type UserSelectArgs,
} from "~/repositories/user.repository";
import type { Route } from "./+types/users";

type LoaderData = Awaited<ReturnType<typeof loader>>;
type ActionData = Awaited<ReturnType<typeof action>>;

export function meta({}: LoaderFunctionArgs) {
  return [{ title: "Users" }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  const r = await UsersRepository.delete(context.db, Number(id));

  return r;
}

export async function loader({ context }: Route.LoaderArgs) {
  const allUsers = await UsersRepository.getAll(context.db);
  return { users: allUsers };
}

export default function Users() {
  const { users } = useLoaderData<LoaderData>();
  const actionData = useActionData<ActionData>();

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
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
                  {user.name}
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
