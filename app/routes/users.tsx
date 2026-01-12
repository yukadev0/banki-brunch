import { drizzle } from "drizzle-orm/d1";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { usersTable, type UserSelect } from "~/repositories/user.repository";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export async function loader({ context }: LoaderFunctionArgs) {
  const db = drizzle(context.cloudflare.env.banki_brunch_db);
  const allUsers = await db.select().from(usersTable);
  return { users: allUsers };
}

export default function Users() {
  const { users } = useLoaderData<LoaderData>();

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
      <h1 className="text-4xl">Users</h1>
      <ul className="text-xl">
        {users.map((user: UserSelect) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
