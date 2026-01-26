import { redirect, type AppLoadContext } from "react-router";
import { createAuth } from "./auth.server";

export async function getSession(context: AppLoadContext, request: Request) {
  return await createAuth(context.cloudflare.env).api.getSession({
    headers: request.headers,
  });
}

export async function requireSession(
  context: AppLoadContext,
  request: Request,
) {
  const session = await getSession(context, request);

  if (!session) {
    throw redirect("/login");
  }

  return session;
}

export async function requireAdmin(context: AppLoadContext, request: Request) {
  const session = await requireSession(context, request);

  if (session.user.role !== "admin") {
    throw new Response("Unauthorized", { status: 401 });
  }

  return session;
}

export async function requireOwnership(
  context: AppLoadContext,
  request: Request,
  ownerId: string,
) {
  const session = await requireSession(context, request);

  if (ownerId !== session.user.id && session.user.role !== "admin") {
    throw new Response("Unauthorized", { status: 401 });
  }

  return session;
}
