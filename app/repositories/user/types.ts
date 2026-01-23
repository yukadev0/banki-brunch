import { user } from "~/db/schemas/auth";

export type UserSelectArgs = typeof user.$inferSelect;
export type UserInsertArgs = typeof user.$inferInsert;
