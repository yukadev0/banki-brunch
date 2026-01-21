import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "./routes/login.tsx"),

  ...prefix("api", [
    route("auth/*", "./routes/auth.tsx"),

    ...prefix("question", [
      route("vote", "routes/api/question/vote.tsx"),
      route("create", "routes/api/question/create.tsx"),
      route("update", "routes/api/question/update.tsx"),
      route("delete", "routes/api/question/delete.tsx"),
    ]),

    ...prefix("answer", [
      route("vote", "routes/api/answer/vote.tsx"),
      route("create", "routes/api/answer/create.tsx"),
      route("update", "routes/api/answer/update.tsx"),
      route("delete", "routes/api/answer/delete.tsx"),
    ]),

    ...prefix("tag", [
      route("create", "routes/api/tag/create.tsx"),
      route("delete", "routes/api/tag/delete.tsx"),
    ]),
  ]),

  ...prefix("user", [
    index("routes/user/getAll.tsx"),
    route(":id", "routes/user/get.tsx"),
  ]),

  ...prefix("tag", [
    index("routes/tag/getAll.tsx"),
    route("create", "routes/tag/create.tsx"),
  ]),

  ...prefix("question", [
    index("routes/question/getAll.tsx"),
    route(":id", "routes/question/get.tsx"),
    route("create", "routes/question/create.tsx"),
    route(":id/edit", "routes/question/edit.tsx"),

    ...prefix(":questionId/answer", [
      route(":id", "routes/answer/get.tsx"),
      route(":id/edit", "routes/answer/edit.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
