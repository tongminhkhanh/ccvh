import { describe, expect, it } from 'vitest';
import { Student } from '../types';
import { processMatrixData } from './reportUtils';

const students: Student[] = [
    { id: 1, name: 'Lò Linh Anh', student_code: 'HS001', class_name: '4A4', balance: 0 }
];

describe('processMatrixData', () => {
    it('excludes Saturday and Sunday from the exported day list', () => {
        const { days } = processMatrixData(students, [], '2026-03-02', '2026-03-08');

        expect(days).toEqual([
            '2026-03-02',
            '2026-03-03',
            '2026-03-04',
            '2026-03-05',
            '2026-03-06'
        ]);
    });

    it('counts absent days on weekdays only', () => {
        const attendanceRecords = [
            { student_id: 1, date: '2026-03-02', status: 'present' },
            { student_id: 1, date: '2026-03-03', status: 'present' },
            { student_id: 1, date: '2026-03-06', status: 'present' }
        ];

        const { rows } = processMatrixData(students, attendanceRecords, '2026-03-02', '2026-03-08');

        expect(rows[0].total_meals).toBe(3);
        expect(rows[0].total_absent).toBe(2);
    });

    it('returns zero absent days when the selected range contains only weekends', () => {
        const { days, rows } = processMatrixData(students, [], '2026-03-07', '2026-03-08');

        expect(days).toEqual([]);
        expect(rows[0].total_meals).toBe(0);
        expect(rows[0].total_absent).toBe(0);
    });
});
