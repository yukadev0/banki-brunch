import {
  type RouteConfig,
  index,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  ...prefix("users", [
    index("routes/users/users.tsx"),
    route(":id", "routes/users/user.$id.tsx"),
    route("create", "routes/users/create.user.tsx"),
  ]),

  ...prefix("questions", [
    index("routes/questions/questions.tsx"),
    route(":id", "routes/questions/question.$id.tsx"),
    route("create", "routes/questions/create.question.tsx"),
  ]),
] satisfies RouteConfig;
