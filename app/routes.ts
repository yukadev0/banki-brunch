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
    ...prefix("auth", [
      route("*", "./routes/auth.tsx"),
      route("delete-user", "./routes/api/auth/deleteUser.tsx"),
    ]),

    ...prefix("question", [
      route("create", "routes/api/question/create.tsx"),

      ...prefix(":id", [
        route("update", "routes/api/question/update.tsx"),
        route("delete", "routes/api/question/delete.tsx"),

        route("vote", "routes/api/question/vote.tsx"),
      ]),
    ]),

    ...prefix("answer", [
      route(":questionId/create", "routes/api/answer/create.tsx"),

      ...prefix(":id", [
        route("update", "routes/api/answer/update.tsx"),
        route("delete", "routes/api/answer/delete.tsx"),

        route("vote", "routes/api/answer/vote.tsx"),
      ]),
    ]),

    ...prefix("tag", [
      route("create", "routes/api/tag/create.tsx"),
      route(":name/delete/", "routes/api/tag/delete.tsx"),
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
