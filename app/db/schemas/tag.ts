import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tagsSchema = sqliteTable("tags", {
  name: text("name").notNull().unique(),
});
