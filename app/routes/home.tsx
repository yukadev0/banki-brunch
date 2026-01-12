import { Link } from "react-router";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.VALUE_FROM_CLOUDFLARE };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h1 className="text-3xl">Welcome to React Router!</h1>
      <span className="text-sm text-gray-500">{loaderData.message}</span>
      <Link to="/users" className="cursor-pointer rounded-xl bg-blue-500 hover:bg-blue-600 transition px-4 py-2">Users</Link>
    </div>
  )
}
