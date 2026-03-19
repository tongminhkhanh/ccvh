import * as XLSX from 'xlsx';
import { Student } from '../types';

export interface MatrixRow {
    stt: number;
    name: string;
    class_name: string;
    attendance: { [date: string]: string };
    total_meals: number;
    total_absent: number;
    note: string;
}

const parseDateString = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const isWeekday = (date: Date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5;
};

export const processMatrixData = (
    students: Student[],
    attendanceRecords: any[],
    startDate: string,
    endDate: string
): { days: string[]; rows: MatrixRow[] } => {
    const days: string[] = [];
    let curr = parseDateString(startDate);
    const end = parseDateString(endDate);

    while (curr <= end) {
        if (isWeekday(curr)) {
            days.push(formatDateString(curr));
        }
        curr.setDate(curr.getDate() + 1);
    }

    const attendanceMap = new Set<string>();
    attendanceRecords.forEach(rec => {
        if (rec.status === 'present') {
            const dateStr = rec.date.includes('T') ? rec.date.split('T')[0] : rec.date;
            attendanceMap.add(`${rec.student_id}_${dateStr}`);
        }
    });

    const rows: MatrixRow[] = students.map((student, index) => {
        const studentAttendance: { [date: string]: string } = {};
        let meals = 0;
        let absent = 0;

        days.forEach(day => {
            const isPresent = attendanceMap.has(`${student.id}_${day}`);
            if (isPresent) {
                studentAttendance[day] = 'X';
                meals += 1;
            } else {
                studentAttendance[day] = '';
                absent += 1;
            }
        });

        return {
            stt: index + 1,
            name: student.name,
            class_name: student.class_name,
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
    const displayDays = days.length > 0 ? days : [''];
    const displayDayHeaders: Array<number | string> = days.length > 0 ? days.map(day => Number(day.slice(-2))) : [''];

    const wsData: any[][] = [];

    wsData.push(['BÁO CÁO CHẤM CÔNG ĂN TRƯA']);
    wsData.push([
        `Từ ngày: ${parseDateString(startDate).toLocaleDateString('vi-VN')} - ${parseDateString(endDate).toLocaleDateString('vi-VN')}`
    ]);
    wsData.push([`Đơn giá: ${mealPrice.toLocaleString()}đ/bữa`]);
    wsData.push([]);

    const headerRow1 = [
        'STT',
        'Họ và Tên',
        'Lớp',
        'Ngày',
        ...new Array(displayDays.length - 1).fill(''),
        'Số ngày ăn',
        'Số ngày nghỉ',
        'Ghi chú'
    ];
    wsData.push(headerRow1);

    const headerRow2 = ['', '', '', ...displayDayHeaders, '', '', ''];
    wsData.push(headerRow2);

    rows.forEach(row => {
        wsData.push([
            row.stt,
            row.name,
            row.class_name,
            ...(days.length > 0 ? days.map(day => row.attendance[day]) : ['']),
            row.total_meals,
            row.total_absent,
            row.note
        ]);
    });

    const totalMeals = rows.reduce((sum, row) => sum + row.total_meals, 0);
    wsData.push(['TỔNG CỘNG', '', '', ...new Array(displayDays.length).fill(''), totalMeals, '', '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 2 + displayDays.length + 3 } },
        { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
        { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
        { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
        { s: { r: 4, c: 3 }, e: { r: 4, c: 3 + displayDays.length - 1 } },
        { s: { r: 4, c: 3 + displayDays.length }, e: { r: 5, c: 3 + displayDays.length } },
        { s: { r: 4, c: 3 + displayDays.length + 1 }, e: { r: 5, c: 3 + displayDays.length + 1 } },
        { s: { r: 4, c: 3 + displayDays.length + 2 }, e: { r: 5, c: 3 + displayDays.length + 2 } },
        { s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 2 } }
    ];

    ws['!cols'] = [
        { wch: 5 },
        { wch: 25 },
        { wch: 10 },
        ...displayDays.map(() => ({ wch: 4 })),
        { wch: 12 },
        { wch: 12 },
        { wch: 15 }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Chấm công');
    XLSX.writeFile(wb, `Bao_Cao_Ma_Tran_${startDate}_${endDate}.xlsx`);
};
