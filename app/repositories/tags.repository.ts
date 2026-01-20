import type { DrizzleD1Database } from "drizzle-orm/d1";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tagsTable = sqliteTable("tags", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export type TagsSelectArgs = typeof tagsTable.$inferSelect;
export type TagsInsertArgs = typeof tagsTable.$inferInsert;

export const TagsRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return await db.select().from(tagsTable);
  },

  async create(db: DrizzleD1Database<any>, data: TagsInsertArgs) {
    if (!data.name) {
      throw new Error("Tag name is required");
    }
    
    await db.insert(tagsTable).values(data);
  },
};
