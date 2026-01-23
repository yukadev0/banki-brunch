import { redirect, type AppLoadContext } from "react-router";
import { createAuth } from "./auth.server";

export async function getSession(context: AppLoadContext, request: Request) {
  return createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });
}

export async function requireSession(
  context: AppLoadContext,
  request: Request,
) {
  const session = await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });

  if (!session) {
    throw redirect("/login");
  }

  return session;
}

export async function requireOwnership(
  context: AppLoadContext,
  request: Request,
  ownerId: string,
) {
  const session = await requireSession(context, request);

  if (ownerId !== session.user.id) {
    throw new Response("Unauthorized", { status: 401 });
  }

  return session;
}
