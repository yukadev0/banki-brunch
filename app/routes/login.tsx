import { authClient } from "~/lib/auth.client";
import type { Route } from "./+types/login";
import { createAuth } from "~/lib/auth.server";
import { redirect } from "react-router";

export async function loader({ request, context }: Route.LoaderArgs) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (session) {
    return redirect("/");
  }
}

export default function Login() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="bg-gray-800 text-gray-100 rounded-xl shadow-lg border border-gray-700 p-10 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold mb-6">Welcome to Banki Brunch</h1>
        <p className="mb-8 text-gray-400">
          Sign in to continue and access your account
        </p>

        <button
          onClick={() => authClient.signIn.social({ provider: "discord" })}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-lg transition shadow-md"
        >
          Sign in with Discord
        </button>

        <p className="mt-6 text-sm text-gray-500">
          By signing in, you agree to our{" "}
          <a className="cursor-pointer underline hover:text-gray-300">
            Terms of Service
          </a>{" "}
          and{" "}
          <a className="cursor-pointer underline hover:text-gray-300">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
