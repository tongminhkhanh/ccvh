import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface MatrixRow {
    stt: number;
    name: string;
    class_name: string;
    attendance: { [date: string]: string }; // 'X' or ''
    total_meals: number;
    total_absent: number;
    note: string;
}

export const processMatrixData = (
    students: Student[],
    attendanceRecords: any[],
    startDate: string,
    endDate: string
): { days: string[], rows: MatrixRow[] } => {
    // 1. Generate date list
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days: string[] = [];
    const current = new Date(start);

    while (current <= end) {
        days.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }

    // 2. Map attendance for quick lookup
    const attendanceMap = new Set<string>();
    attendanceRecords.forEach(rec => {
        if (rec.status === 'present') {
            attendanceMap.add(`${rec.student_id}_${rec.date.split('T')[0]}`);
        }
    });

    // 3. Process rows
    const rows: MatrixRow[] = students.map((s, index) => {
        const studentAttendance: { [date: string]: string } = {};
        let meals = 0;
        let absent = 0;

        days.forEach(day => {
            const isPresent = attendanceMap.has(`${s.id}_${day}`);
            if (isPresent) {
                studentAttendance[day] = 'X';
                meals++;
            } else {
                studentAttendance[day] = '';
                absent++;
            }
        });

        return {
            stt: index + 1,
            name: s.name,
            class_name: s.class_name,
            attendance: studentAttendance,
            total_meals: meals,
            total_absent: absent,
            note: ''
        };
    });

    return { days, rows };
};

export const exportToMatrixExcel = (
    students: Student[],
    attendanceRecords: any[],
    startDate: string,
    endDate: string,
    mealPrice: number
) => {
    const { days, rows } = processMatrixData(students, attendanceRecords, startDate, endDate);

    // Format display dates (only day number for matrix header)
    const dayHeaders = days.map(d => new Date(d).getDate());

    // Create worksheet data
    const wsData: any[][] = [];

    // Header Rows
    wsData.push(['BÁO CÁO CHẤM CÔNG ĂN TRƯA']);
    wsData.push([`Từ ngày: ${new Date(startDate).toLocaleDateString('vi-VN')} - ${new Date(endDate).toLocaleDateString('vi-VN')}`]);
    wsData.push([`Đơn giá: ${mealPrice.toLocaleString()}đ/bữa`]);
    wsData.push([]); // Gap

    // Table Header Row 1
    const headerRow1 = ['STT', 'Họ và Tên', 'Lớp', 'Ngày', ...new Array(days.length - 1).fill(''), 'Số ngày ăn', 'Số ngày nghỉ', 'Ghi chú'];
    wsData.push(headerRow1);

    // Table Header Row 2 (Specific days)
    const headerRow2 = ['', '', '', ...dayHeaders, '', '', ''];
    wsData.push(headerRow2);

    // Add Data Rows
    rows.forEach(row => {
        const rowData = [
            row.stt,
            row.name,
            row.class_name,
            ...days.map(d => row.attendance[d]),
            row.total_meals,
            row.total_absent,
            row.note
        ];
        wsData.push(rowData);
    });

    // Add Total Row
    const totalMeals = rows.reduce((sum, r) => sum + r.total_meals, 0);
    const totalRow = ['TỔNG CỘNG', '', '', ...new Array(days.length).fill(''), totalMeals, '', ''];
    wsData.push(totalRow);

    // Create workbook and worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Define Merges
    const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 + days.length + 3 } }, // Title
        { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } }, // STT
        { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } }, // Name
        { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } }, // Class
        { s: { r: 4, c: 3 }, e: { r: 4, c: 3 + days.length - 1 } }, // "Ngày" header
        { s: { r: 4, c: 3 + days.length }, e: { r: 5, c: 3 + days.length } }, // Total Meals
        { s: { r: 4, c: 3 + days.length + 1 }, e: { r: 5, c: 3 + days.length + 1 } }, // Total Absent
        { s: { r: 4, c: 3 + days.length + 2 }, e: { r: 5, c: 3 + days.length + 2 } }, // Note
        { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 2 } } // Total text
    ];
    ws['!merges'] = merges;

    // Set Column Widths
    const wscols = [
        { wch: 5 },  // STT
        { wch: 25 }, // Name
        { wch: 10 }, // Class
        ...days.map(() => ({ wch: 4 })), // Days
        { wch: 12 }, // Total Meals
        { wch: 12 }, // Total Absent
        { wch: 15 }  // Note
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chấm công');

    // Trigger Download
    XLSX.writeFile(wb, `Bao_Cao_Ma_Tran_${startDate}_${endDate}.xlsx`);
};
