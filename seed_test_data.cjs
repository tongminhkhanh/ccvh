const { createClient } = require('@libsql/client');
const db = createClient({ url: 'file:lunch_attendance.db' });

async function seed() {
    console.log('--- START ROBUST SEED ---');
    try {
        // 1. Clear existing (to be sure)
        await db.execute('DELETE FROM attendance');
        await db.execute('DELETE FROM payments');
        await db.execute('DELETE FROM payment_logs');
        await db.execute('DELETE FROM students');
        console.log('Cleaned old data.');

        // 2. Insert Students
        const students = [
            { name: 'Nguyễn Văn A', code: 'HS001', class: '1A', balance: 100000 },
            { name: 'Trần Thị B', code: 'HS002', class: '1B', balance: 0 },
            { name: 'Lê Văn C', code: 'HS003', class: '1C', balance: 50000 }
        ];

        for (const s of students) {
            try {
                const res = await db.execute({
                    sql: 'INSERT INTO students (name, student_code, class_name, status, balance) VALUES (?, ?, ?, ?, ?) RETURNING id',
                    args: [s.name, s.code, s.class, 'active', s.balance]
                });
                const id = res.rows[0].id;
                console.log(`Inserted Student: ${s.name} (ID: ${id})`);

                const workDays = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
                for (const d of workDays) {
                    await db.execute({
                        sql: 'INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)',
                        args: [id, d, 'present']
                    });
                }
                console.log(`Inserted ${workDays.length} attendance records for ${s.name}`);
            } catch (innerE) {
                console.error(`Error inserting student ${s.name}:`, innerE.message);
            }
        }

        const finalS = await db.execute('SELECT COUNT(*) as c FROM students');
        const finalA = await db.execute('SELECT COUNT(*) as c FROM attendance');
        console.log(`Final Totals - Students: ${finalS.rows[0].c}, Attendance: ${finalA.rows[0].c}`);

    } catch (e) {
        console.error('CRITICAL SEED ERROR:', e.message);
    }
}

seed();
