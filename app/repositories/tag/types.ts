import type { tagsSchema } from "~/db/tag-schema";

export type TagsSelectArgs = typeof tagsSchema.$inferSelect;
export type TagsInsertArgs = typeof tagsSchema.$inferInsert;
