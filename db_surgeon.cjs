const { createClient } = require('@libsql/client');
const db = createClient({ url: 'file:lunch_attendance.db' });

async function fix() {
    console.log('Starting DB Surgeon script...');
    const tablesToFix = ['payments'];

    for (const table of tablesToFix) {
        const columns = [
            { name: 'range_mode', type: 'INTEGER DEFAULT 1' },
            { name: 'applied_credit', type: 'REAL DEFAULT 0' },
            { name: 'cooking_fee', type: 'REAL DEFAULT 0' },
            { name: 'supervision_fee', type: 'REAL DEFAULT 0' },
            { name: 'meal_price', type: 'REAL DEFAULT 0' },
            { name: 'start_date', type: 'TEXT' },
            { name: 'end_date', type: 'TEXT' },
            { name: 'last_reminded_at', type: 'TEXT' }
        ];

        for (const col of columns) {
            try {
                await db.execute(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.type}`);
                console.log(`[SUCCESS] Added ${col.name} to ${table}`);
            } catch (e) {
                console.log(`[SKIPPED] Column ${col.name} already exists or error: ${e.message}`);
            }
        }
    }

    // Ensure settings table exists
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY,
                value TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('[SUCCESS] Table settings ensured.');

        // Seed default settings if empty
        const settingsCheck = await db.execute("SELECT COUNT(*) as count FROM settings");
        if (Number(settingsCheck.rows[0].count) === 0) {
            await db.execute(`INSERT INTO settings (id, value) VALUES ('mealPrice', '35000')`);
            await db.execute(`INSERT INTO settings (id, value) VALUES ('supervisionFee', '2000')`);
            await db.execute(`INSERT INTO settings (id, value) VALUES ('cookingFee', '60000')`);
            console.log('[SUCCESS] Default settings seeded.');
        }
    } catch (e) {
        console.error('[ERROR] Settings table fix failed:', e.message);
    }

    // Ensure payment_logs table exists
    try {
        await db.execute(`
            CREATE TABLE IF NOT EXISTS payment_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                student_id INTEGER NOT NULL,
                action_type TEXT NOT NULL,
                amount REAL DEFAULT 0,
                balance_before REAL DEFAULT 0,
                balance_after REAL DEFAULT 0,
                month TEXT,
                note TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(student_id) REFERENCES students(id)
            )
        `);
        console.log('[SUCCESS] Table payment_logs ensured.');
    } catch (e) {
        console.error('[ERROR] payment_logs table fix failed:', e.message);
    }

    console.log('DB Surgeon script completed.');
}

fix();
