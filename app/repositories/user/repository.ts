import { eq } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import { user } from "~/db/schemas/auth";

export const UsersRepository = {
  async getAll(db: DrizzleD1Database<any>) {
    return db.select().from(user);
  },

  async getById(db: DrizzleD1Database<any>, id: string) {
    const [u] = await db.select().from(user).where(eq(user.id, id));

    return u ?? null;
  },

  async delete(db: DrizzleD1Database<any>, id: string) {
    await db.delete(user).where(eq(user.id, id));
  },
};
