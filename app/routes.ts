import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("test", "routes/test.tsx"),

  ...prefix("users", [
    index("routes/users/users.tsx"),
    route(":id", "routes/users/user.$id.tsx"),
    route("create", "routes/users/create.user.tsx"),
  ]),

  ...prefix("questions", [
    index("routes/questions/questions.tsx"),
    route(":id", "routes/questions/question.$id.tsx"),
    route("create", "routes/questions/create.question.tsx"),

    ...prefix(":questionId/answers", [
      route("answers.json", "routes/answers/answers.json.tsx"),
      index("routes/answers/answers.tsx"),
      route(":id", "routes/answers/answer.$id.tsx"),
      route("create", "routes/answers/create.answer.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
