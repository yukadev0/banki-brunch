import type { DrizzleD1Database } from "drizzle-orm/d1";
import { type TagsInsertArgs } from "./types";
import { tagsSchema } from "~/db/tag-schema";

export const TagsRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return await db.select().from(tagsSchema);
  },

  async create(db: DrizzleD1Database<any>, data: TagsInsertArgs) {
    if (!data.name) {
      throw new Error("Tag name is required");
    }

    await db.insert(tagsSchema).values(data);
  },
};
