require('dotenv').config();
const { createClient } = require('@libsql/client');
const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
    const rs = await db.execute("PRAGMA table_info(payment_logs)");
    console.log(JSON.stringify(rs.rows, null, 2));
}

run().catch(console.error);
