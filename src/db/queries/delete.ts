import { db } from "../index.js";
import { users } from "../schema.js";

export async function deleteAllUsers() {
  const result = await db
     .delete(users)
    .returning();
  return result;
}