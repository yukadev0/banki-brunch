import { Link } from "react-router";
import { requireAdmin } from "~/lib/auth.helper";
import type { Route } from "./+types";

export function meta() {
  return [{ title: "Admin Panel" }];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  await requireAdmin(context, request);
}

export default function AdminPanelIndex() {
  return (
    <div className="min-h-screen text-gray-100 flex flex-col items-center justify-center gap-8 py-12">
      <h1 className="text-4xl font-semibold text-center text-white">
        Admin Panel
      </h1>

      <div className="flex gap-2 flex-wrap justify-center">
        <Link
          to="/"
          className="bg-red-500 text-white hover:bg-red-600 px-4 py-2 rounded-lg transition transform shadow-md"
        >
          Home
        </Link>

        <Link
          to="./question"
          className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md"
        >
          Questions
        </Link>
      </div>
    </div>
  );
}
