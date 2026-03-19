import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Attendance } from './Attendance';
import { AttendanceRecord, Student } from '../../types';

const byTextContent = (text: string) => (_content: string, element: Element | null) =>
    element?.textContent?.replace(/\s+/g, ' ').trim() === text;

const mockStudents: Student[] = [
    { id: 1, name: 'Nguyễn Văn A', student_code: 'HS001', class_name: '1A', balance: 0 },
    { id: 2, name: 'Trần Thị B', student_code: 'HS002', class_name: '1A', balance: 0 }
];

const mockAttendance: AttendanceRecord[] = [
    { student_id: 1, date: '2026-03-17', name: 'Nguyễn Văn A', student_code: 'HS001', class_name: '1A', status: 'present' }
];

const defaultProps = {
    students: mockStudents,
    attendance: mockAttendance,
    searchTerm: '',
    setSearchTerm: vi.fn(),
    selectedDate: '2026-03-17',
    setSelectedDate: vi.fn(),
    toggleAttendance: vi.fn(),
    markAllPresent: vi.fn(),
    markAllAbsent: vi.fn()
};

describe('Attendance', () => {
    it('renders the student list', () => {
        render(<Attendance {...defaultProps} />);

        expect(screen.getByText('Nguyễn Văn A')).toBeDefined();
        expect(screen.getByText('Trần Thị B')).toBeDefined();
    });

    it('calls markAllPresent when clicking the batch present button', () => {
        render(<Attendance {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Chấm ăn tất cả/i }));

        expect(defaultProps.markAllPresent).toHaveBeenCalled();
    });

    it('calls markAllAbsent when clicking the clear button', () => {
        render(<Attendance {...defaultProps} />);

        fireEvent.click(screen.getByRole('button', { name: /Bỏ chọn hết/i }));

        expect(defaultProps.markAllAbsent).toHaveBeenCalled();
    });

    it('calls toggleAttendance when clicking a student card', () => {
        render(<Attendance {...defaultProps} />);

        const studentCard = screen.getByText('Nguyễn Văn A').closest('button');
        if (studentCard) {
            fireEvent.click(studentCard);
        }

        expect(defaultProps.toggleAttendance).toHaveBeenCalledWith(1);
    });

    it('treats a missing attendance record as absent', () => {
        render(<Attendance {...defaultProps} attendance={[]} />);

        expect(screen.queryByText('CÓ ĂN')).toBeNull();
        expect(screen.getAllByText('CHƯA CHẤM')).toHaveLength(2);
    });

    it('counts present and absent students within the filtered list only', () => {
        render(<Attendance {...defaultProps} searchTerm="HS002" />);

        expect(screen.queryByText('Nguyễn Văn A')).toBeNull();
        expect(screen.getByText('Trần Thị B')).toBeDefined();
        expect(screen.getAllByText(byTextContent('Tổng: 1')).length).toBeGreaterThan(0);
        expect(screen.getAllByText(byTextContent('Có ăn: 0')).length).toBeGreaterThan(0);
        expect(screen.getAllByText(byTextContent('Không ăn: 1')).length).toBeGreaterThan(0);
    });
});
