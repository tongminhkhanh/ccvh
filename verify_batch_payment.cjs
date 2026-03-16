const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function verify() {
    const studentId = 1; // Assuming student 1 exists
    const month = '2026-03';
    const testDate = '2026-03-16';

    console.log("--- BAT DAU KIEM TRA LOGIC TINH PHI MOI ---");

    // 1. Lay so du hien tai
    const studentsRes = await fetch('http://localhost:3005/api/students');
    const students = await studentsRes.json();
    const student = students.find(s => Number(s.id) === studentId);
    const initialBalance = Number(student.balance);
    console.log(`So du ban dau cua be ID ${studentId}: ${initialBalance.toLocaleString()}đ`);

    // 2. Cham diem danh (Hien dien)
    console.log(`Dang cham diem danh 'present' cho ngay ${testDate}...`);
    await fetch('http://localhost:3005/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId, date: testDate, status: 'present' })
    });

    // 3. Kiem tra so du sau khi cham (PHAI KHONG DOI)
    const studentsRes2 = await fetch('http://localhost:3005/api/students');
    const students2 = await studentsRes2.json();
    const student2 = students2.find(s => Number(s.id) === studentId);
    const afterAttendanceBalance = Number(student2.balance);
    console.log(`So du sau khi cham diem danh: ${afterAttendanceBalance.toLocaleString()}đ`);

    if (initialBalance === afterAttendanceBalance) {
        console.log("✅ THANH CONG: Cham diem danh khong con tru tien ngay.");
    } else {
        console.log("❌ LOI: Cham diem danh van dang lam thay doi so du!");
    }

    // 4. Chay Tao Bang Thu
    console.log(`Dang chay 'Tao bang thu' cho thang ${month}...`);
    await fetch('http://localhost:3005/api/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month })
    });

    // 5. Kiem tra so du sau khi Tao Bang Thu (PHAI THAY DOI)
    const studentsRes3 = await fetch('http://localhost:3005/api/students');
    const students3 = await studentsRes3.json();
    const student3 = students3.find(s => Number(s.id) === studentId);
    const finalBalance = Number(student3.balance);
    console.log(`So du sau khi Tao Bang Thu: ${finalBalance.toLocaleString()}đ`);

    if (finalBalance !== afterAttendanceBalance) {
        console.log("✅ THANH CONG: Luong tinh phi da hoat dong khi Tao Bang Thu.");
        console.log(`Chenh lech: ${(afterAttendanceBalance - finalBalance).toLocaleString()}đ`);
    } else {
        // Note: If attendance was 0, it might not change, but for this test we assumed we marked 1 day.
        console.log("⚠️ Canh bao: So du khong doi sau khi Tao Bang Thu (co the do be khong co du lieu thuc te hoac loi logic).");
    }

    console.log("--- KET THUC KIEM TRA ---");
}

verify();
