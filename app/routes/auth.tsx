import type { Route } from "./+types/auth";
import { createAuth } from "~/lib/auth.server";

export function loader({ request, context }: Route.LoaderArgs) {
  return createAuth(context.cloudflare.env).handler(request);
}

export function action({ request, context }: Route.ActionArgs) {
  return createAuth(context.cloudflare.env).handler(request);
}
