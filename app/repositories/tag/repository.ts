import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { tagsSchema } from "~/db/schemas/tag";
import { type TagsInsertArgs } from "./types";

export const TagsRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return await db.select().from(tagsSchema);
  },

  async getByName(db: DrizzleD1Database<any>, name: string) {
    return await db.select().from(tagsSchema).where(eq(tagsSchema.name, name));
  },

  async create(db: DrizzleD1Database<any>, data: TagsInsertArgs) {
    await db.insert(tagsSchema).values(data);
  },

  async delete(db: DrizzleD1Database<any>, name: string) {
    await db.delete(tagsSchema).where(eq(tagsSchema.name, name));
  },
};
