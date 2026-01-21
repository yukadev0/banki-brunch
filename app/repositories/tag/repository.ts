import type { DrizzleD1Database } from "drizzle-orm/d1";
import { type TagsInsertArgs } from "./types";
import { tagsSchema } from "~/db/schemas/tag";
import { eq } from "drizzle-orm";

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

  async delete(db: DrizzleD1Database<any>, name: string) {
    await db.delete(tagsSchema).where(eq(tagsSchema.name, name));
  },
};
