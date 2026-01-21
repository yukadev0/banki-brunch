import type { DrizzleD1Database } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { user } from "~/db/schema";
import type { UserInsertArgs } from "./types";

export const UsersRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return db.select().from(user);
  },

  async getById(db: DrizzleD1Database<any>, id: string) {
    const [u] = await db.select().from(user).where(eq(user.id, id));

    return u ?? null;
  },

  async create(db: DrizzleD1Database<any>, data: UserInsertArgs) {
    if (!data.name) {
      throw new Error("Username is required");
    }

    await db.insert(user).values(data);
  },

  async delete(db: DrizzleD1Database<any>, id: string) {
    await db.delete(user).where(eq(user.id, id));
  },
};
