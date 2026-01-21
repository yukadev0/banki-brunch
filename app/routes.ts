import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "./routes/login.tsx"),
  route("api/auth/*", "./routes/auth.tsx"),

  route("test", "routes/test.tsx"),

  ...prefix("api", [
    ...prefix("question", [route("vote", "routes/api/question/vote.tsx")]),

    ...prefix("answer", [route("vote", "routes/api/answer/vote.tsx")]),
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
