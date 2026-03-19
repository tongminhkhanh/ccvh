import { Student, Stats, AttendanceRecord, ReportData, PaymentRecord, Transaction, FinancialAnalytics, PaymentStats } from '../types';

const API_BASE = '/api';

export const apiService = {
    // Students
    async getStudents(): Promise<Student[]> {
        const res = await fetch(`${API_BASE}/students`);
        if (!res.ok) throw new Error('Failed to fetch students');
        return res.json();
    },

    async addStudent(data: { name: string; student_code: string; class_name: string; note: string }): Promise<void> {
        const res = await fetch(`${API_BASE}/students`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to add student');
    },

    async deleteStudent(id: number): Promise<void> {
        const res = await fetch(`${API_BASE}/students/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete student');
    },

    async batchDeleteStudents(ids: number[]): Promise<void> {
        const res = await fetch(`${API_BASE}/students/batch-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids })
        });
        if (!res.ok) throw new Error('Failed to batch delete students');
    },

    async importStudents(file: File): Promise<void> {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/students/import`, { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Failed to import students');
    },

    // Attendance
    async getStats(): Promise<Stats> {
        const res = await fetch(`${API_BASE}/stats`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
    },

    async getAttendance(date: string): Promise<AttendanceRecord[]> {
        const res = await fetch(`${API_BASE}/attendance/${date}`);
        if (!res.ok) throw new Error('Failed to fetch attendance');
        return res.json();
    },

    async updateAttendance(data: { student_id: number; date: string }): Promise<void> {
        const res = await fetch(`${API_BASE}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...data, status: 'present' })
        });
        if (!res.ok) throw new Error('Failed to update attendance');
    },

    async deleteAttendance(data: { student_id: number; date: string }): Promise<void> {
        const res = await fetch(`${API_BASE}/attendance`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to delete attendance');
    },

    async batchUpdateAttendance(data: { items: { student_id: number; date: string }[] }): Promise<void> {
        const res = await fetch(`${API_BASE}/attendance/batch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: data.items.map(item => ({ ...item, status: 'present' }))
            })
        });
        if (!res.ok) throw new Error('Failed to batch update attendance');
    },

    async batchDeleteAttendance(data: { studentIds: number[]; date: string }): Promise<void> {
        const res = await fetch(`${API_BASE}/attendance/batch-delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to batch delete attendance');
    },

    // Payments & Transactions
    async getPayments(start: string, end: string): Promise<PaymentRecord[]> {
        const res = await fetch(`${API_BASE}/payments?startDate=${start}&endDate=${end}`);
        if (!res.ok) throw new Error('Failed to fetch payments');
        return res.json();
    },

    async getPaymentStats(start: string, end: string): Promise<PaymentStats> {
        const res = await fetch(`${API_BASE}/payments/stats?startDate=${start}&endDate=${end}`);
        if (!res.ok) throw new Error('Failed to fetch payment stats');
        return res.json();
    },

    async generatePayments(start: string, end: string): Promise<void> {
        const res = await fetch(`${API_BASE}/payments/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate: start, endDate: end })
        });
        if (!res.ok) throw new Error('Failed to generate payments');
    },

    async togglePayment(id: number): Promise<void> {
        const res = await fetch(`${API_BASE}/payments/${id}/toggle`, { method: 'PATCH' });
        if (!res.ok) throw new Error('Failed to toggle payment');
    },

    async remindPayment(id: number): Promise<void> {
        const res = await fetch(`${API_BASE}/payments/${id}/remind`, { method: 'POST' });
        if (!res.ok) throw new Error('Failed to remind payment');
    },

    async getTransactions(studentId: number): Promise<Transaction[]> {
        const res = await fetch(`${API_BASE}/transactions/${studentId}`);
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return res.json();
    },

    async recharge(data: { student_id: number; amount: number; note: string }): Promise<void> {
        const { student_id, ...payload } = data;
        const res = await fetch(`${API_BASE}/students/${student_id}/recharge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error('Failed to recharge');
    },

    async deleteTransaction(id: number): Promise<void> {
        const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete transaction');
    },

    // Reports
    async getReportData(start: string, end: string): Promise<ReportData[]> {
        const res = await fetch(`${API_BASE}/reports?start=${start}&end=${end}`);
        if (!res.ok) throw new Error('Failed to fetch report data');
        return res.json();
    },

    async getReportDetail(start: string, end: string): Promise<any[]> {
        const res = await fetch(`${API_BASE}/reports/detail?start=${start}&end=${end}`);
        if (!res.ok) throw new Error('Failed to fetch report detail');
        return res.json();
    },

    async getFinancialAnalytics(): Promise<FinancialAnalytics> {
        const res = await fetch(`${API_BASE}/analytics/financial`);
        if (!res.ok) throw new Error('Failed to fetch financial analytics');
        return res.json();
    }
};
