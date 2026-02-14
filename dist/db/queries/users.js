import { db } from "../index.js";
export async function createUser(user) {
    const [result] = await db
        .insert(user)
        .values(user)
        .onConflictDoNothing()
        .returning();
    return result;
}
