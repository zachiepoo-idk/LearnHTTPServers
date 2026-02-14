import { db } from "../index.js";
import { NewUser, users } from "../schema.js";

export async function createUser(user: NewUser) {
  const [result] = await db
    .insert(user)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}