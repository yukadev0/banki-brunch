import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New Banki Brunch App" },
    { name: "description", content: "Welcome to Banki Brunch!" },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl">Welcome to Banki Brunch!</h1>
      <div className="flex gap-2">
        <Link
          to="/users"
          className="cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
        >
          Users
        </Link>

        <Link
          to="/questions"
          className="cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2"
        >
          Questions
        </Link>
      </div>
    </div>
  );
}
