import type { tagsSchema } from "~/db/schemas/tag";

export type TagsSelectArgs = typeof tagsSchema.$inferSelect;
export type TagsInsertArgs = typeof tagsSchema.$inferInsert;
