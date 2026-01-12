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
] satisfies RouteConfig;
