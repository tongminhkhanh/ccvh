import "dotenv/config";
import { createClient } from "@libsql/client";

const dbUrl = process.env.TURSO_DATABASE_URL || "file:lunch_attendance.db";
const dbAuthToken = process.env.TURSO_AUTH_TOKEN;

const db = createClient({
    url: dbUrl,
    authToken: dbAuthToken,
});

async function resetDb() {
    try {
        console.log(`Connecting to DB: ${dbUrl}`);
        console.log("Dropping tables...");

        await db.executeMultiple(`
      DROP TABLE IF EXISTS attendance;
      DROP TABLE IF EXISTS payments;
      DROP TABLE IF EXISTS students;
    `);

        console.log("✅ Database reset successfully! All tables have been dropped.");
        console.log("The tables will be recreated automatically the next time the app starts.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error resetting database:", error);
        process.exit(1);
    }
}

resetDb();
