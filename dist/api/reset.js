import { config } from "../config.js";
import { UserForbiddenError } from "./errors.js";
import { deleteAllUsers } from "../db/queries/delete.js";
export async function handlerReset(_, res) {
    if (config.api.platform !== "dev") {
        console.log(config.api.platform);
        throw new UserForbiddenError("Reset is only allowed in dev environment.");
    }
    config.api.fileServerHits = 0;
    await deleteAllUsers();
    res.write("Hits reset to 0");
    res.end();
}
