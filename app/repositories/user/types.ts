import { user } from "~/db/schema";

export type UserSelectArgs = typeof user.$inferSelect;
export type UserInsertArgs = typeof user.$inferInsert;
