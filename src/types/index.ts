export interface Student {
    id: number;
    name: string;
    student_code: string;
    class_name: string;
    note?: string;
    balance: number;
    active?: number;
}

export interface AttendanceRecord {
    student_id: number;
    date: string;
    name: string;
    student_code: string;
    class_name: string;
    status: 'present' | 'absent';
}

export interface Stats {
    totalStudents: number;
    presentToday: number;
    excusedToday: number;
    absentToday: number;
}

export interface ReportData {
    date: string;
    present: number;
    excused: number;
    total: number;
}

export interface AppConfig {
    mealPrice: number;
    supervisionFee: number;
    cookingFee: number;
    colors: {
        present: string;
        excused: string;
    };
}

export interface PaymentRecord {
    id: number;
    student_id: number;
    name: string;
    student_code: string;
    class_name: string;
    month: string;
    start_date: string;
    end_date: string;
    total_meals: number;
    meal_price: number;
    cooking_fee: number;
    supervision_fee: number;
    applied_credit: number;
    amount: number;
    paid: 0 | 1;
    paid_date: string | null;
    note: string;
    last_reminded_at?: string | null;
}

export interface PaymentStats {
    total_students: number;
    total_amount: number;
    paid_count: number;
    paid_amount: number;
    unpaid_count: number;
    unpaid_amount: number;
}

export type Tab = 'dashboard' | 'attendance' | 'students' | 'history' | 'reports' | 'payments' | 'settings';

export interface FinancialAnalytics {
    history: any[];
    forecast: {
        nextMonth: number;
        activeStudents: number;
        avgPerStudent: number;
    } | null;
}

export interface Transaction {
    id: number;
    student_id: number;
    amount: number;
    action_type: string;
    note: string;
    created_at: string;
}
