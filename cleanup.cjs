const { createClient } = require('@libsql/client');
require('dotenv').config();

const db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function cleanup() {
    console.log('--- Database Cleanup Phase 2 ---');
    try {
        // 1. Delete all payments with corrupt dates (year 32026 etc)
        const r = await db.execute("DELETE FROM payments WHERE month LIKE '320%' OR start_date LIKE '320%'");
        console.log(`✅ Success: Deleted ${r.rowsAffected} corrupted future records.`);

        // 2. Delete overlapping unpaid payments for March 2026 just to be sure
        const r2 = await db.execute("DELETE FROM payments WHERE paid = 0 AND (start_date <= '2026-03-31' AND end_date >= '2026-03-01')");
        console.log(`✅ Success: Reset March 2026 payments for clean generation (${r2.rowsAffected} records removed).`);

        console.log('--- Cleanup Finished ---');
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

cleanup();
