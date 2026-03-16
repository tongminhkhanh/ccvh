// Using native fetch from Node.js v18+

async function test() {
    const month = '2026-03';
    const studentId = 1;

    console.log(`Setting up test data for student ${studentId} in ${month}...`);

    // Cleanup: Delete existing attendance for this student/month to ensure clean slate
    const { createClient } = require('@libsql/client');
    const db = createClient({
        url: 'libsql://ccvh-tongminhkhanh.aws-ap-northeast-1.turso.io',
        authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzIzNDIyNTEsImlkIjoiMDE5Y2E3MzMtNGYwMS03YThkLTljZDctMDZlYjE1YzE3Njg3IiwicmlkIjoiMmI3YTFkNTQtZGEwNS00MTA2LThhMDAtZThmNjY0NWNkM2JhIn0.wJMHZVSbLV_nrTZ8B8cnIxXbpYnmgVaK9BsKgGlcj-Qynim5mIK7DUvOa0Dwm5zOBSOhS5_T7wF3bnkqqX9nBQ'
    });
    await db.execute({
        sql: "DELETE FROM attendance WHERE student_id = ? AND date LIKE ?",
        args: [studentId, `${month}%`]
    });
    console.log('Cleaned up existing attendance records.');

    // 1. Mark 5 days as present
    const dates = ['2026-03-02', '2026-03-03', '2026-03-04', '2026-03-05', '2026-03-06'];
    for (const date of dates) {
        await fetch('http://localhost:3005/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ student_id: studentId, date, status: 'present' })
        });
    }
    console.log(`Marked 5 days as present.`);

    // 2. Generate payments
    console.log(`Generating payments for ${month}...`);
    const genRes = await fetch('http://localhost:3005/api/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month })
    });
    const genData = await genRes.json();
    console.log('Generate Response:', genData);

    // 3. Verify
    const payRes = await fetch(`http://localhost:3005/api/payments?month=${month}`);
    const payments = await payRes.json();
    const studentPayment = payments.find(p => p.student_id === studentId);

    if (studentPayment) {
        console.log(`Student ${studentPayment.name} - Total Meals: ${studentPayment.total_meals}`);
        if (studentPayment.total_meals === 5) {
            console.log('✅ VERIFICATION SUCCESSFUL: Total meals match actual attendance.');
        } else {
            console.log(`❌ VERIFICATION FAILED: Expected 5 meals, got ${studentPayment.total_meals}`);
        }
        console.log('Note:', studentPayment.note);
    } else {
        console.log('❌ VERIFICATION FAILED: Payment record not found.');
    }
}

test();
