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

  return { session };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { session } = loaderData;

  return (
    <div className="min-h-screen text-gray-100 flex flex-col items-center justify-center gap-8 py-12">
      {session && (
        <button
          onClick={() => {
            authClient.signOut();
            window.location.reload();
          }}
          className="absolute top-4 right-4 text-sm text-red-400 hover:text-red-300 transition"
        >
          Log out
        </button>
      )}

      <h1 className="text-4xl font-semibold text-center text-white">
        Welcome {session !== null ? session.user.name : "Guest"}, to Banki
        Brunch!
      </h1>

      <div className="flex gap-2 flex-wrap justify-center">
        <Link
          to="/user"
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
        >
          Users
        </Link>

        <Link
          to="/question"
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
        >
          Questions
        </Link>

        <Link
          to="/tag"
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
        >
          Tags
        </Link>
      </div>

      {!session && (
        <Link
          to="/login"
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
        >
          Login
        </Link>
      )}
    </div>
  );
}
