import { Form, Link, redirect, useLoaderData } from "react-router";
import { UsersRepository } from "~/repositories/user.repository";
import type { Route } from "./+types/user.$id";
import { useEffect } from "react";

type LoaderData = Awaited<ReturnType<typeof loader>>;

export function meta({ params }: Route.MetaArgs) {
  return [{ title: `User: ${params.id}` }];
}

export async function action({ request, context }: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");

  await UsersRepository.delete(context.db, Number(id));

  return redirect("/users");
}

export async function loader({ params, context }: Route.LoaderArgs) {
  const user = await UsersRepository.getById(context.db, Number(params.id));
  return { user };
}

export default function User() {
  const { user } = useLoaderData<LoaderData>();

  useEffect(() => {
    document.title = `User: ${user.name}`;
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col gap-4 items-center justify-center">
      <Link
        to="/users"
        className="absolute top-4 left-4 cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
      >
        Users
      </Link>

      <h1 className="text-2xl">User: {user.name}</h1>

      <Form method="post">
        <input type="hidden" name="id" value={user.id} />
        <button
          type="submit"
          className="bg-red-400 hover:bg-red-500 transition cursor-pointer rounded-xl px-4 py-2"
        >
          Delete
        </button>
      </Form>
    </div>
  );
}
