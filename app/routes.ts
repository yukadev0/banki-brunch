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

  ...prefix("users", [
    index("routes/users/users.tsx"),
    route(":id", "routes/users/user.$id.tsx"),
  ]),

  ...prefix("tags", [
    index("routes/tags/tags.tsx"),
    route("create", "routes/tags/create.tag.tsx"),
  ]),

  ...prefix("questions", [
    index("routes/questions/questions.tsx"),
    route(":id", "routes/questions/question.$id.tsx"),
    route("create", "routes/questions/create.question.tsx"),
    route(":id/edit", "routes/questions/question.edit.$id.tsx"),

    ...prefix(":questionId/answers", [
      route(":id", "routes/answers/answer.$id.tsx"),
      route(":id/edit", "routes/answers/answer.edit.$id.tsx"),

      route("answers.json", "routes/answers/answers.json.tsx"),

      ...prefix("api", [
        route("vote", "routes/questions/api/questions.vote.tsx"),
      ]),
    ]),
  ]),
] satisfies RouteConfig;
