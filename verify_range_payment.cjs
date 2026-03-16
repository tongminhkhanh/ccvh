const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function verifyRange() {
    const studentId = 1;
    const startDate = '2026-03-01';
    const endDate = '2026-03-10';

    console.log("--- BẮT ĐẦU KIỂM TRA LOGIC THU PHÍ THEO KHOẢNG (RANGE) ---");

    // 1. Tạo bảng thu cho khoảng 1-10/03
    console.log(`Đang chạy 'Tạo bảng thu' từ ${startDate} đến ${endDate}...`);
    const genRes = await fetch('http://localhost:3005/api/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startDate, endDate })
    });
    const genData = await genRes.json();
    console.log(`Kết quả: ${JSON.stringify(genData)}`);

    // 2. Kiểm tra dữ liệu trong bảng payments
    console.log("Đang lấy danh sách phiếu thu để kiểm tra start_date/end_date...");
    const payRes = await fetch(`http://localhost:3005/api/payments?startDate=${startDate}&endDate=${endDate}`);
    const payments = await payRes.json();

    if (payments.length > 0) {
        const p = payments[0];
        console.log(`✅ THANH CONG: Tim thay phieu thu cho be ${p.student_name}`);
        console.log(`Khoang thoi gian: ${p.start_date} -> ${p.end_date}`);
        console.log(`So bua: ${p.total_meals}, So tien: ${p.amount.toLocaleString()}đ`);

        if (p.start_date === startDate && p.end_date === endDate) {
            console.log("✅ Dữ liệu start_date/end_date đã được lưu đúng.");
        } else {
            console.log("❌ LỖI: Dữ liệu ngày tháng không khớp!");
        }
    } else {
        console.log("❌ LỖI: Không tìm thấy phiếu thu nào được tạo!");
    }

    // 3. Kiểm tra Stats
    console.log("Đang kiểm tra thống kê (stats) theo khoảng...");
    const statsRes = await fetch(`http://localhost:3005/api/payments/stats?startDate=${startDate}&endDate=${endDate}`);
    const stats = await statsRes.json();
    console.log(`Thống kê: ${JSON.stringify(stats)}`);

    if (Number(stats.total_students) > 0) {
        console.log("✅ THANH CONG: Thống kê đã lấy được dữ liệu theo khoảng.");
    }

    console.log("--- KẾT THÚC KIỂM TRA ---");
}

verifyRange();
