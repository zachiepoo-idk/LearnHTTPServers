import dotenv from "dotenv";
dotenv.config();
process.loadEnvFile();
function envOrThrow(key) {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Environment variable ${key} is not set`);
    }
    return value;
}
const migrationConfig = {
    migrationsFolder: "./src/db",
};
export const config = {
    api: {
        fileServerHits: 0,
        port: Number(envOrThrow("PORT")),
    },
    db: {
        url: envOrThrow("DB_URL"),
        migrationConfig: migrationConfig,
    },
};
export const platCheck = {
    platform: String(envOrThrow("PLATFORM")),
};
