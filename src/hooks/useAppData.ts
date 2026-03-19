import React, { useState, useEffect, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
    Student,
    AttendanceRecord,
    Stats,
    ReportData,
    AppConfig,
    PaymentRecord,
    PaymentStats,
    Tab,
    Transaction,
    FinancialAnalytics
} from '../types';
import { apiService } from '../services/api.service';
import { exportToMatrixExcel } from '../utils/reportUtils';

export function useAppData() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [loading, setLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [stats, setStats] = useState<Stats>({ totalStudents: 0, presentToday: 0, absentToday: 0 });
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [reportData, setReportData] = useState<ReportData[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [financialAnalytics, setFinancialAnalytics] = useState<FinancialAnalytics>({
        history: [],
        forecast: { nextMonth: 0, activeStudents: 0, avgPerStudent: 0 }
    });
    const [paymentStats, setPaymentStats] = useState<PaymentStats>({ total_amount: 0, paid_amount: 0, unpaid_amount: 0, paid_count: 0, unpaid_count: 0, total_students: 0 });
    const [config, setConfig] = useState<AppConfig>({
        mealPrice: 35000,
        supervisionFee: 5000,
        cookingFee: 150000,
        colors: {
            present: '#10b981',
            excused: '#f59e0b'
        }
    });

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [paymentStartDate, setPaymentStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        return d.toISOString().split('T')[0];
    });
    const [paymentEndDate, setPaymentEndDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate());
        return d.toISOString().split('T')[0];
    });
    const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
    const [rechargeModal, setRechargeModal] = useState({ isOpen: false, studentId: 0, studentName: '' });
    const [rechargeAmount, setRechargeAmount] = useState(0);
    const [rechargeNote, setRechargeNote] = useState('');
    const [rechargeTab, setRechargeTab] = useState<'recharge' | 'history'>('recharge');
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', student_code: '', class_name: '', note: '' });
    const [printingPayments, setPrintingPayments] = useState<PaymentRecord[]>([]);

    // API Call: Fetch Data
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [studentsData, statsData, attendanceData, reportsData, pData, pStats, financialData] = await Promise.all([
                apiService.getStudents(),
                apiService.getStats(),
                apiService.getAttendance(selectedDate),
                apiService.getReportData(startDate, endDate),
                apiService.getPayments(paymentStartDate, paymentEndDate),
                apiService.getPaymentStats(paymentStartDate, paymentEndDate),
                apiService.getFinancialAnalytics()
            ]);

            setStudents(studentsData);
            setStats(statsData);
            setAttendance(attendanceData);
            setReportData(reportsData);
            setPayments(pData || []);
            setFinancialAnalytics(financialData);
            setPaymentStats(pStats || {
                total_amount: 0, paid_amount: 0, unpaid_amount: 0,
                paid_count: 0, unpaid_count: 0, total_students: 0
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedDate, startDate, endDate, paymentStartDate, paymentEndDate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Actions: Attendance
    const toggleAttendance = async (studentId: number) => {
        try {
            const isPresent = attendance.some(a => a.student_id === studentId && a.status === 'present');
            if (isPresent) {
                await apiService.deleteAttendance({
                    student_id: studentId,
                    date: selectedDate
                });
            } else {
                await apiService.updateAttendance({
                    student_id: studentId,
                    date: selectedDate
                });
            }
            fetchData();
        } catch (error) {
            console.error('Error toggling attendance:', error);
        }
    };

    const markAllPresent = async () => {
        try {
            setLoading(true);
            const items = students.map(s => ({
                student_id: s.id,
                date: selectedDate
            }));
            await apiService.batchUpdateAttendance({ items });
            fetchData();
        } catch (error) {
            console.error('Error marking all present:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAllAbsent = async () => {
        try {
            setLoading(true);
            await apiService.batchDeleteAttendance({
                studentIds: students.map(s => s.id),
                date: selectedDate
            });
            fetchData();
        } catch (error) {
            console.error('Error marking all absent:', error);
        } finally {
            setLoading(false);
        }
    };

    // Actions: Students
    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiService.addStudent(newStudent);
            setNewStudent({ name: '', student_code: '', class_name: '', note: '' });
            fetchData();
        } catch (error) {
            console.error('Error adding student:', error);
        }
    };

    const handleDeleteStudent = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa học sinh này?')) return;
        try {
            await apiService.deleteStudent(id);
            fetchData();
        } catch (error) {
            console.error('Error deleting student:', error);
        }
    };

    const handleBatchDeleteStudents = async () => {
        const ids = Array.from(selectedStudentIds) as number[];
        if (!ids.length || !confirm(`Bạn có chắc muốn xóa ${ids.length} học sinh đã chọn?`)) return;
        try {
            await apiService.batchDeleteStudents(ids);
            setSelectedStudentIds(new Set());
            fetchData();
        } catch (error) {
            console.error('Error batch deleting:', error);
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setLoading(true);
            await apiService.importStudents(file);
            fetchData();
        } catch (error) {
            console.error('Error importing:', error);
            alert('Lỗi nhập file');
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    // Actions: Recharge & Transactions
    const fetchTransactions = async (studentId: number) => {
        try {
            setIsLoadingTransactions(true);
            const data = await apiService.getTransactions(studentId);
            setTransactions(data);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setIsLoadingTransactions(false);
        }
    };

    const handleRecharge = async () => {
        try {
            setLoading(true);
            await apiService.recharge({
                student_id: rechargeModal.studentId,
                amount: rechargeAmount,
                note: rechargeNote
            });
            setRechargeModal({ ...rechargeModal, isOpen: false });
            setRechargeAmount(0);
            setRechargeNote('');
            fetchData();
        } catch (error) {
            console.error('Error recharging:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTransaction = async (id: number) => {
        if (!confirm('Hủy giao dịch này và hoàn tiền?')) return;
        try {
            await apiService.deleteTransaction(id);
            fetchTransactions(rechargeModal.studentId);
            fetchData();
        } catch (error) {
            console.error('Error deleting transaction:', error);
        }
    };

    // Actions: Payments
    const handleGeneratePayments = async () => {
        try {
            setLoading(true);
            await apiService.generatePayments(paymentStartDate, paymentEndDate);
            fetchData();
        } catch (error) {
            console.error('Error generating payments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleTogglePayment = async (id: number) => {
        try {
            await apiService.togglePayment(id);
            fetchData();
        } catch (error) {
            console.error('Error toggling payment:', error);
        }
    };

    const handleRemind = async (p: PaymentRecord) => {
        try {
            await apiService.remindPayment(p.id);
            alert(`Đã ghi nhận nhắc nợ cho ${p.name}`);
            fetchData();
        } catch (error) {
            console.error('Error reminding:', error);
        }
    };

    // Actions: Excel Export
    const handleExportPayments = () => {
        const ws = XLSX.utils.json_to_sheet(payments);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Payments');
        XLSX.writeFile(wb, `Bang_Thu_Phi_${paymentStartDate}_${paymentEndDate}.xlsx`);
    };

    const handleExportReport = async () => {
        try {
            const data = await apiService.getReportDetail(startDate, endDate);
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Report');
            XLSX.writeFile(wb, `Bao_Cao_Chi_Tiet_${startDate}_${endDate}.xlsx`);
        } catch (error) {
            console.error('Error exporting report:', error);
        }
    };

    const handleExportMatrixReport = async () => {
        try {
            setLoading(true);
            const attendanceRecords = await apiService.getReportDetail(startDate, endDate);
            exportToMatrixExcel(students, attendanceRecords, startDate, endDate, config.mealPrice);
        } catch (error) {
            console.error('Error exporting matrix report:', error);
            alert('Lỗi xuất báo cáo ma trận');
        } finally {
            setLoading(false);
        }
    };

    // Actions: Print
    const handlePrint = (id: string) => {
        if (id === 'all') {
            setPrintingPayments(payments.filter(p => !p.paid));
        } else {
            const p = payments.find(p => String(p.id) === id);
            if (p) setPrintingPayments([p]);
        }
        setTimeout(() => {
            window.print();
            setPrintingPayments([]);
        }, 500);
    };

    // Actions: Settings
    const handleSaveSettings = (updates: Partial<AppConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    };

    // financialAnalytics state is now fetched from API

    return {
        activeTab, setActiveTab,
        loading,
        students, stats, attendance, reportData, payments, paymentStats, config, setConfig, financialAnalytics,
        selectedDate, setSelectedDate,
        searchTerm, setSearchTerm,
        startDate, setStartDate,
        endDate, setEndDate,
        paymentStartDate, setPaymentStartDate,
        paymentEndDate, setPaymentEndDate,
        paymentFilter, setPaymentFilter,
        isMobileMenuOpen, setIsMobileMenuOpen,
        selectedStudentIds, setSelectedStudentIds,
        rechargeModal, setRechargeModal,
        rechargeAmount, setRechargeAmount,
        rechargeNote, setRechargeNote,
        rechargeTab, setRechargeTab,
        transactions, isLoadingTransactions, fetchTransactions, handleRecharge, handleDeleteTransaction,
        newStudent, setNewStudent, handleAddStudent, handleDeleteStudent, handleBatchDeleteStudents, handleImport,
        toggleAttendance, markAllPresent, markAllAbsent,
        handleGeneratePayments, handleTogglePayment, handleRemind,
        handleExportPayments, handleExportReport, handleExportMatrixReport,
        handlePrint, printingPayments,
        handleSaveSettings,
        fetchData
    };
}
