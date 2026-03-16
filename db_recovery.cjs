const { createClient } = require('@libsql/client');
const db = createClient({ url: 'file:lunch_attendance.db' });

async function recovery() {
    console.log('Starting DB Recovery...');

    const queries = [
        `CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            class_name TEXT,
            note TEXT,
            status TEXT DEFAULT 'active',
            balance REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            status TEXT CHECK(status IN ('present', 'absent')) NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, date),
            FOREIGN KEY(student_id) REFERENCES students(id)
        )`,
        `CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            month TEXT,
            start_date TEXT,
            end_date TEXT,
            total_meals INTEGER DEFAULT 0,
            meal_price REAL DEFAULT 0,
            cooking_fee REAL DEFAULT 0,
            supervision_fee REAL DEFAULT 0,
            applied_credit REAL DEFAULT 0,
            amount REAL DEFAULT 0,
            paid INTEGER DEFAULT 0,
            paid_date TEXT,
            note TEXT DEFAULT '',
            range_mode INTEGER DEFAULT 1,
            last_reminded_at TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(student_id, start_date, end_date),
            FOREIGN KEY(student_id) REFERENCES students(id)
        )`,
        `CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            value TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS payment_logs (
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
        )`
    ];

    for (const q of queries) {
        try {
            await db.execute(q);
            console.log('[SUCCESS] Query executed.');
        } catch (e) {
            console.error('[ERROR] Query failed:', e.message);
        }
    }

    console.log('Recovery complete.');
}

recovery();
