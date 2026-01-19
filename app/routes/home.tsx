import { Link } from "react-router";
import type { Route } from "./+types/home";
import { authClient } from "~/lib/auth.client";
import { createAuth } from "~/lib/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New Banki Brunch App" },
    { name: "description", content: "Welcome to Banki Brunch!" },
  ];
}
export async function loader({ request, context }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  return { user: session?.user.name };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { user } = loaderData;

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center gap-8 py-12 px-6">
        <h1 className="text-4xl font-semibold text-center text-white">
          Welcome to Banki Brunch!
        </h1>
        <button
          onClick={() => authClient.signIn.social({ provider: "discord" })}
          className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-3 rounded-lg text-lg transition transform hover:scale-105 active:scale-95 shadow-md"
        >
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center gap-8 py-12 px-6">
      <h1 className="text-4xl font-semibold text-center text-white">
        Welcome {user} to Banki Brunch!
      </h1>

      <div className="flex gap-2 flex-wrap justify-center">
        <Link
          to="/users"
          className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-3 rounded-lg text-lg transition transform hover:scale-105 active:scale-95 shadow-md"
        >
          Users
        </Link>

        <Link
          to="/questions"
          className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-3 rounded-lg text-lg transition transform hover:scale-105 active:scale-95 shadow-md"
        >
          Questions
        </Link>

        <Link
          to="/test"
          className="bg-blue-500 text-white hover:bg-blue-600 px-6 py-3 rounded-lg text-lg transition transform hover:scale-105 active:scale-95 shadow-md"
        >
          Test
        </Link>
      </div>
    </div>
  );
}
