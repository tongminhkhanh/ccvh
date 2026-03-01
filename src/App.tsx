import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Calendar,
  Plus,
  Trash2,
  Search,
  LayoutDashboard,
  ClipboardCheck,
  UserPlus,
  History,
  AlertCircle,
  Loader2,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  XCircle,
  HelpCircle,
  Download,
  Upload,
  FileSpreadsheet,
  Settings,
  Wallet,
  Printer,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import * as XLSX from 'xlsx';

interface Student {
  id: number;
  name: string;
  student_code: string;
  class_name: string;
  note?: string;
}

interface AttendanceRecord {
  student_id: number;
  date: string;
  name: string;
  student_code: string;
  class_name: string;
  status: 'present';
}

interface Stats {
  totalStudents: number;
  presentToday: number;
  excusedToday: number; // kept for backwards compat with API
  absentToday: number;
}

interface ReportData {
  date: string;
  present: number;
  excused: number; // kept for backwards compat with API
  total: number;
}

interface AppConfig {
  mealPrice: number;
  colors: {
    present: string;
    excused: string; // kept but unused
  };
}

interface PaymentRecord {
  id: number;
  student_id: number;
  name: string;
  class_name: string;
  month: string;
  total_meals: number;
  meal_price: number;
  amount: number;
  paid: 0 | 1;
  paid_date: string | null;
  note: string;
}

interface PaymentStats {
  total_students: number;
  total_amount: number;
  paid_count: number;
  paid_amount: number;
  unpaid_count: number;
  unpaid_amount: number;
}

type Tab = 'dashboard' | 'attendance' | 'students' | 'history' | 'reports' | 'payments' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, presentToday: 0, excusedToday: 0, absentToday: 0 });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Payment states
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ total_students: 0, total_amount: 0, paid_count: 0, paid_amount: 0, unpaid_count: 0, unpaid_amount: 0 });
  const [paymentMonth, setPaymentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [printingPayments, setPrintingPayments] = useState<any[]>([]);

  // Config state
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('appConfig');
    return saved ? JSON.parse(saved) : {
      mealPrice: 35000,
      colors: {
        present: '#10b981', // emerald-500
        excused: '#f59e0b'  // amber-500
      }
    };
  });

  // Save config to localStorage
  useEffect(() => {
    localStorage.setItem('appConfig', JSON.stringify(config));
  }, [config]);

  const [visibleColumns, setVisibleColumns] = useState({
    date: true,
    present: true,
    excused: true,
    absent: true,
    total: true,
    rate: true
  });

  // Report date range
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Form states
  const [newStudent, setNewStudent] = useState({ name: '', student_code: '', class_name: '', note: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [studentsRes, statsRes, attendanceRes] = await Promise.all([
        fetch('/api/students'),
        fetch('/api/stats'),
        fetch(`/api/attendance/${selectedDate}`)
      ]);

      const studentsData = await studentsRes.json();
      const statsData = await statsRes.json();
      const attendanceData = await attendanceRes.json();

      setStudents(studentsData);
      setStats(statsData);
      setAttendance(attendanceData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (activeTab !== 'reports') return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?start=${startDate}&end=${endDate}`);
      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  useEffect(() => {
    fetchReports();
  }, [activeTab, startDate, endDate]);

  const fetchPayments = async () => {
    if (activeTab !== 'payments') return;
    setLoading(true);
    try {
      const [paymentsRes, statsRes] = await Promise.all([
        fetch(`/api/payments?month=${paymentMonth}`),
        fetch(`/api/payments/stats?month=${paymentMonth}`)
      ]);
      const paymentsData = await paymentsRes.json();
      const statsData = await statsRes.json();

      setPayments(paymentsData);
      setPaymentStats(statsData);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [activeTab, paymentMonth]);

  const handleGeneratePayments = async () => {
    if (!confirm(`Bạn có chắc muốn tạo bảng thu phí cho tháng ${paymentMonth}? Thao tác này sẽ ghi đè dữ liệu cũ của tháng này nếu có.`)) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: paymentMonth, meal_price: config.mealPrice })
      });
      if (res.ok) fetchPayments();
    } catch (error) {
      console.error('Error generating payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePayment = async (id: number) => {
    try {
      const res = await fetch(`/api/payments/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) fetchPayments();
    } catch (error) {
      console.error('Error toggling payment:', error);
    }
  };

  const handleExportPayments = () => {
    const [year, mon] = paymentMonth.split('-');
    const monthLabel = `Tháng ${mon}/${year}`;

    const dataPayments = payments.filter(p =>
      paymentFilter === 'all' ? true : paymentFilter === 'paid' ? p.paid === 1 : p.paid === 0
    );

    const rows1: any[][] = [
      [`BẢNG THU PHÍ TIỀN ĂN - ${monthLabel.toUpperCase()}`],
      [`Lớp: CCVH - 4A4`],
      [`Đơn giá: ${(config.mealPrice || 0).toLocaleString('vi-VN')}đ/bữa`],
      [],
      ['STT', 'Họ và Tên', 'Lớp', 'Số bữa', 'Đơn giá', 'Thành tiền', 'Trạng thái', 'Ngày thu', 'Ghi chú']
    ];

    let totalMeals = 0;
    let totalAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;

    dataPayments.forEach((p, i) => {
      totalMeals += p.total_meals;
      totalAmount += p.amount;
      if (p.paid) paidAmount += p.amount;
      else unpaidAmount += p.amount;

      rows1.push([
        i + 1, p.name, p.class_name, p.total_meals,
        { v: p.meal_price, t: 'n', z: '#,##0' },
        { v: p.amount, t: 'n', z: '#,##0' },
        p.paid ? 'Đã thu' : 'Chưa thu',
        p.paid_date ? new Date(p.paid_date).toLocaleDateString('vi-VN') : '',
        p.note || ''
      ]);
    });

    rows1.push([]);
    rows1.push(['', 'TỔNG CỘNG', '', totalMeals, '', { v: totalAmount, t: 'n', z: '#,##0' }, '', '', '']);
    rows1.push(['', 'Đã thu', '', '', '', { v: paidAmount, t: 'n', z: '#,##0' }, `${dataPayments.filter(p => p.paid).length} học sinh`, '', '']);
    rows1.push(['', 'Chưa thu', '', '', '', { v: unpaidAmount, t: 'n', z: '#,##0' }, `${dataPayments.filter(p => !p.paid).length} học sinh`, '', '']);

    const ws1 = XLSX.utils.aoa_to_sheet(rows1);
    ws1['!cols'] = [{ wch: 5 }, { wch: 28 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 18 }, { wch: 14 }, { wch: 14 }, { wch: 22 }];
    ws1['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } },
    ];

    const rows2: any[][] = [
      [`THỐNG KÊ THU PHÍ - ${monthLabel.toUpperCase()}`],
      [],
      ['Hạng mục', 'Giá trị'],
      ['Tổng số học sinh', dataPayments.length],
      ['Tổng số bữa ăn', totalMeals],
      ['Đơn giá 1 bữa', { v: config.mealPrice || 0, t: 'n', z: '#,##0' }],
      ['Tổng tiền cần thu', { v: totalAmount, t: 'n', z: '#,##0' }],
      [],
      ['Đã thu', { v: paidAmount, t: 'n', z: '#,##0' }],
      ['Số HS đã đóng', dataPayments.filter(p => p.paid).length],
      [],
      ['Chưa thu', { v: unpaidAmount, t: 'n', z: '#,##0' }],
      ['Số HS chưa đóng', dataPayments.filter(p => !p.paid).length],
      [],
      ['Tỷ lệ thu', totalAmount > 0 ? `${Math.round((paidAmount / totalAmount) * 100)}%` : '0%'],
    ];

    const ws2 = XLSX.utils.aoa_to_sheet(rows2);
    ws2['!cols'] = [{ wch: 25 }, { wch: 20 }];
    ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }];

    const wb = XLSX.utils.book_new();
    const safeSheetName1 = `Thu phí ${monthLabel}`.replace(/[:\\\/?*\[\]]/g, '').substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws1, safeSheetName1);
    XLSX.utils.book_append_sheet(wb, ws2, 'Thống kê');
    XLSX.writeFile(wb, `Thu_Phi_${monthLabel.replace('/', '-')}.xlsx`);
  };

  const changePaymentMonth = (delta: number) => {
    const [y, m] = paymentMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setPaymentMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const formatCurrency = (n: number) => n.toLocaleString('vi-VN') + 'đ';

  const handlePrint = (studentId: string | 'all' = 'all') => {
    let toPrint = [];
    const filteredPayments = payments.filter(p => paymentFilter === 'all' ? true : paymentFilter === 'paid' ? p.paid === 1 : p.paid === 0);
    if (studentId === 'all') {
      toPrint = filteredPayments;
    } else {
      toPrint = payments.filter(p => p.id === Number(studentId));
    }

    if (toPrint.length === 0) {
      alert("Không có dữ liệu để in");
      return;
    }

    setPrintingPayments(toPrint);

    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintingPayments([]), 100);
    }, 300);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStudent)
      });
      if (res.ok) {
        setNewStudent({ name: '', student_code: '', class_name: '', note: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa học sinh này?')) return;
    try {
      await fetch(`/api/students/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const toggleAttendance = async (studentId: number) => {
    const record = attendance.find(a => a.student_id === studentId);
    const date = selectedDate;

    // Toggle: Absent -> Present -> Absent
    const isPresent = !!record;

    try {
      if (isPresent) {
        // Remove attendance (mark absent)
        await fetch('/api/attendance', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, date })
        });
      } else {
        // Mark present
        await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, date, status: 'present' })
        });
      }
      fetchData();
    } catch (error) {
      console.error('Error toggling attendance:', error);
    }
  };

  const markAllPresent = async () => {
    if (!confirm('Bạn có muốn đánh dấu Có ăn cho TẤT CẢ học sinh đang hiển thị?')) return;
    try {
      setLoading(true);
      const items = filteredStudents.map(s => ({
        student_id: s.id,
        date: selectedDate,
        status: 'present'
      }));

      await fetch('/api/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      fetchData();
    } catch (error) {
      console.error('Error marking all present:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAbsent = async () => {
    if (!confirm('Bạn có muốn BỎ chọn Có ăn cho TẤT CẢ học sinh đang hiển thị?')) return;
    try {
      setLoading(true);
      const studentIds = filteredStudents.map(s => s.id);

      await fetch('/api/attendance/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds, date: selectedDate })
      });
      fetchData();
    } catch (error) {
      console.error('Error marking all absent:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4"
        >
          <div className="p-4 rounded-xl" style={{ backgroundColor: `${config.colors.present}20` }}>
            <CheckCircle2 className="w-8 h-8" style={{ color: config.colors.present }} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Có ăn</p>
            <p className="text-3xl font-bold text-slate-900">{stats.presentToday}</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4"
        >
          <div className="p-4 bg-red-50 rounded-xl">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Không ăn</p>
            <p className="text-3xl font-bold text-slate-900">{stats.absentToday}</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-bottom border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Tỷ lệ tham gia hôm nay</h3>
          <span className="text-sm font-medium text-indigo-600">
            {stats.totalStudents > 0 ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0}%
          </span>
        </div>
        <div className="px-6 pb-6">
          <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden flex">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.totalStudents > 0 ? (stats.presentToday / stats.totalStudents) * 100 : 0}%` }}
              className="h-full"
              style={{ backgroundColor: config.colors.present }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.colors.present }}></div>Có ăn</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div>Không ăn</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttendance = () => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm học sinh..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center space-x-2 text-slate-600">
          <Calendar className="w-5 h-5" />
          <input
            type="date"
            className="bg-transparent border-none font-medium focus:ring-0 cursor-pointer text-slate-600"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-4">
        <p className="text-sm text-slate-500 font-medium whitespace-nowrap">Danh sách {filteredStudents.length} học sinh</p>
        <div className="flex gap-2">
          <button
            onClick={markAllAbsent}
            className="px-3 md:px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition flex items-center gap-2 text-sm font-semibold shadow-sm whitespace-nowrap"
          >
            <AlertCircle className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Bỏ chọn tất cả</span>
            <span className="sm:hidden">Bỏ hết</span>
          </button>
          <button
            onClick={markAllPresent}
            className="px-3 md:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-semibold shadow-sm whitespace-nowrap"
          >
            <CheckCircle2 className="w-4 h-4 hidden sm:block" />
            <span className="hidden sm:inline">Chấm ăn tất cả</span>
            <span className="sm:hidden">Chấm hết</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const record = attendance.find(a => a.student_id === student.id);
          const status = record?.status;

          let bgClass = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300';
          let icon = null;
          let customStyle = {};

          if (status === 'present') {
            customStyle = {
              backgroundColor: `${config.colors.present}15`,
              borderColor: `${config.colors.present}40`,
              color: config.colors.present
            };
            icon = <CheckCircle2 className="w-6 h-6" style={{ color: config.colors.present }} />;
          }

          return (
            <motion.button
              key={student.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleAttendance(student.id)}
              className={`p-4 rounded-xl border transition-all flex items-center justify-between text-left ${!status ? bgClass : ''}`}
              style={status ? customStyle : {}}
            >
              <div>
                <p className="font-bold" style={{ color: status ? 'inherit' : undefined }}>{student.name}</p>
                <p className="text-xs opacity-70">{student.student_code} • {student.class_name}</p>
              </div>
              {icon}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      setLoading(true);
      const res = await fetch('/api/students/import', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Đã nhập thành công ${data.count} học sinh!`);
        fetchData();
      } else {
        alert('Lỗi nhập file: ' + data.error);
      }
    } catch (error) {
      console.error('Error importing file:', error);
      alert('Đã xảy ra lỗi khi tải lên file.');
    } finally {
      setLoading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const renderStudents = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Student Form */}
        <form onSubmit={handleAddStudent} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600" />
            Thêm học sinh mới
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Họ và tên"
              required
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={newStudent.name}
              onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Mã học sinh"
              required
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={newStudent.student_code}
              onChange={e => setNewStudent({ ...newStudent, student_code: e.target.value })}
            />
            <input
              type="text"
              placeholder="Lớp"
              required
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={newStudent.class_name}
              onChange={e => setNewStudent({ ...newStudent, class_name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Ghi chú"
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={newStudent.note}
              onChange={e => setNewStudent({ ...newStudent, note: e.target.value })}
            />
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Thêm học sinh
          </button>
        </form>

        {/* Excel Actions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-4 flex flex-col justify-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Nhập/Xuất Excel
          </h3>
          <div className="flex flex-col gap-3">
            <a
              href="/api/students/template"
              target="_blank"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              Tải file mẫu
            </a>
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Nhập từ Excel</span>
              <input
                type="file"
                accept=".xlsx, .xls"
                className="hidden"
                onChange={handleImport}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 w-16">STT</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mã HS</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Họ và tên</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Lớp</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Ghi chú</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student, index) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-600">{student.student_code}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{student.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{student.class_name}</td>
                  <td className="px-6 py-4 text-sm text-slate-500 italic">{student.note}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDeleteStudent(student.id)}
                      className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {students.map(student => (
            <div key={student.id} className="p-4 flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-900">{student.name}</p>
                <p className="text-xs text-slate-500 mt-1">
                  <span className="font-mono bg-slate-100 px-1 py-0.5 rounded mr-2">{student.student_code}</span>
                  {student.class_name}
                </p>
                {student.note && <p className="text-sm text-slate-500 italic mt-2 bg-slate-50 p-2 rounded">Note: {student.note}</p>}
              </div>
              <button
                onClick={() => handleDeleteStudent(student.id)}
                className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-lg"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-slate-400" />
          <input
            type="date"
            className="bg-slate-50 border-none rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
        <div className="text-slate-600 font-medium">
          Tổng số: {attendance.length} học sinh
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 w-16">STT</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Mã HS</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Họ và tên</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Lớp</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.length > 0 ? (
                attendance.map((record, index) => (
                  <tr key={record.student_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-500">{index + 1}</td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600">{record.student_code}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{record.name}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{record.class_name}</td>
                    <td className="px-6 py-4">
                      <span
                        className="px-2 py-1 text-xs font-bold rounded-full"
                        style={{ backgroundColor: `${config.colors.present}20`, color: config.colors.present }}
                      >
                        CÓ ĂN
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    Không có dữ liệu cho ngày này
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {attendance.length > 0 ? (
            attendance.map(record => (
              <div key={record.student_id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold text-slate-900">{record.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    <span className="font-mono bg-slate-100 px-1 py-0.5 rounded mr-2">{record.student_code}</span>
                    {record.class_name}
                  </p>
                </div>
                <div>
                  <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">CÓ ĂN</span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
              Không có dữ liệu
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const handleExportReport = async () => {
    if (reportData.length === 0) return;

    try {
      // Fetch detailed per-student per-date data
      const res = await fetch(`/api/reports/detail?start=${startDate}&end=${endDate}`);
      if (!res.ok) throw new Error('Không thể tải dữ liệu chi tiết');
      const detailData: Array<{
        student_id: number;
        name: string;
        student_code: string;
        class_name: string;
        date: string;
        status: string;
      }> = await res.json();

      if (detailData.length === 0) return;

      // Get unique dates sorted
      const dates = [...new Set(detailData.map(d => d.date))].sort();

      // Get unique students preserving order
      const studentsMap = new Map<number, { name: string; class_name: string; student_code: string }>();
      detailData.forEach(d => {
        if (!studentsMap.has(d.student_id)) {
          studentsMap.set(d.student_id, { name: d.name, class_name: d.class_name, student_code: d.student_code });
        }
      });
      const studentList = Array.from(studentsMap.entries());

      // Build attendance map: studentId -> date -> status
      const attendanceMap = new Map<number, Map<string, string>>();
      detailData.forEach(d => {
        if (!attendanceMap.has(d.student_id)) attendanceMap.set(d.student_id, new Map());
        attendanceMap.get(d.student_id)!.set(d.date, d.status);
      });

      // Format day labels (just day number)
      const dayLabels = dates.map(d => new Date(d + 'T00:00:00').getDate());

      // Determine date range label
      const startD = new Date(startDate + 'T00:00:00');
      const endD = new Date(endDate + 'T00:00:00');
      const monthNames = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
      const rangeLabel = `${startD.getDate()}/${monthNames[startD.getMonth()]}/${startD.getFullYear()} - ${endD.getDate()}/${monthNames[endD.getMonth()]}/${endD.getFullYear()}`;

      // Get class name from first student
      const firstClass = studentList.length > 0 ? studentList[0][1].class_name : '';

      const mealPrice = config.mealPrice || 0;

      // Build rows
      const rows: any[][] = [];

      // Title row
      rows.push([`BÁO CÁO CHẤM CÔNG ĂN TRƯA`]);
      rows.push([`Lớp: ${firstClass}    -    Từ ngày: ${rangeLabel}`]);
      rows.push([`Đơn giá: ${mealPrice.toLocaleString('vi-VN')}đ/bữa`]);
      rows.push([]); // empty row

      // Header row 1 (Super-headers)
      const headerRow1: any[] = ['STT', 'Họ và Tên', 'Lớp'];
      // Add 'Ngày' super header
      if (dayLabels.length > 0) {
        headerRow1.push('Ngày');
        // Pad the rest of the day columns in this row
        for (let i = 1; i < dayLabels.length; i++) {
          headerRow1.push('');
        }
      } else {
        headerRow1.push('Ngày');
      }
      headerRow1.push('Tổng ngày ăn', 'Thành tiền', 'Ghi chú');
      rows.push(headerRow1);

      // Header row 2 (Sub-headers: days)
      const headerRow2: any[] = ['', '', ''];
      dayLabels.forEach(day => headerRow2.push(day));
      headerRow2.push('', '', '');
      rows.push(headerRow2);

      // Student data rows
      let grandTotalMeals = 0;
      let grandTotalAmount = 0;

      studentList.forEach(([sid, info], idx) => {
        const row: any[] = [idx + 1, info.name, info.class_name];
        let totalPresent = 0;

        dates.forEach(date => {
          const status = attendanceMap.get(sid)?.get(date);
          if (status === 'present') {
            row.push('X');
            totalPresent++;
          } else {
            row.push('');
          }
        });

        const amount = totalPresent * mealPrice;
        grandTotalMeals += totalPresent;
        grandTotalAmount += amount;

        row.push(totalPresent);
        row.push({ v: amount, t: 'n', z: '#,##0' });
        row.push(''); // Ghi chú
        rows.push(row);
      });

      // Summary row
      rows.push([]);
      const summaryRow: any[] = ['', 'TỔNG CỘNG', ''];
      dates.forEach(() => summaryRow.push(''));
      summaryRow.push(grandTotalMeals);
      summaryRow.push({ v: grandTotalAmount, t: 'n', z: '#,##0' });
      summaryRow.push('');
      rows.push(summaryRow);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(rows);

      // Set column widths
      const totalCols = 3 + dates.length + 3; // STT + Name + Class + days + Total + Amount + Note
      const colWidths: Array<{ wch: number }> = [];
      colWidths.push({ wch: 5 });   // STT
      colWidths.push({ wch: 25 });  // Họ và Tên
      colWidths.push({ wch: 8 });   // Lớp
      dates.forEach(() => colWidths.push({ wch: 4 }));  // Day columns
      colWidths.push({ wch: 14 });  // Tổng ngày ăn
      colWidths.push({ wch: 14 });  // Thành tiền
      colWidths.push({ wch: 15 });  // Ghi chú
      ws['!cols'] = colWidths;

      // Merge cells
      const merges = [
        // Title rows (rows 0, 1, 2)
        { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: totalCols - 1 } },
        // Header rows (rows 4 and 5)
        // Vertically merge STT, Họ và Tên, Lớp
        { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
        { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
        { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
      ];

      // Horizontally merge "Ngày" if there are days
      if (dayLabels.length > 0) {
        merges.push({ s: { r: 4, c: 3 }, e: { r: 4, c: 3 + dayLabels.length - 1 } });
      }

      // Vertically merge Tổng ngày ăn, Thành tiền, Ghi chú
      const endColsStart = 3 + Math.max(1, dayLabels.length);
      merges.push({ s: { r: 4, c: endColsStart }, e: { r: 5, c: endColsStart } });
      merges.push({ s: { r: 4, c: endColsStart + 1 }, e: { r: 5, c: endColsStart + 1 } });
      merges.push({ s: { r: 4, c: endColsStart + 2 }, e: { r: 5, c: endColsStart + 2 } });

      ws['!merges'] = merges;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo chấm công');
      XLSX.writeFile(wb, `Bao_Cao_Cham_Cong_${startDate}_${endDate}.xlsx`);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Đã xảy ra lỗi khi xuất báo cáo.');
    }
  };

  const renderReports = () => {
    const chartData = reportData.map(d => ({
      ...d,
      rate: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0,
      formattedDate: new Date(d.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }));

    const avgRate = chartData.length > 0
      ? Math.round(chartData.reduce((acc, curr) => acc + curr.rate, 0) / chartData.length)
      : 0;

    const maxPresent = chartData.length > 0
      ? Math.max(...chartData.map(d => d.present))
      : 0;

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm text-slate-500 whitespace-nowrap">Từ ngày:</span>
                <DatePickerVN
                  value={startDate}
                  onChange={setStartDate}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm text-slate-500 whitespace-nowrap">Đến ngày:</span>
                <DatePickerVN
                  value={endDate}
                  onChange={setEndDate}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Xuất Excel</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              <span className="flex items-center text-emerald-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                +2.4%
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Tỷ lệ trung bình</p>
            <p className="text-3xl font-bold text-slate-900">{avgRate}%</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
              <span className="flex items-center text-emerald-600 text-sm font-medium">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                Đỉnh điểm
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Số lượng cao nhất</p>
            <p className="text-3xl font-bold text-slate-900">{maxPresent}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-50 rounded-xl">
                <Calendar className="w-6 h-6 text-amber-600" />
              </div>
              <span className="flex items-center text-slate-400 text-sm font-medium">
                Dữ liệu
              </span>
            </div>
            <p className="text-sm font-medium text-slate-500">Số ngày ghi nhận</p>
            <p className="text-3xl font-bold text-slate-900">{chartData.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-semibold mb-6">Biểu đồ tổng hợp</h3>
            <div className="h-96 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} label={{ value: 'Số lượng', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} label={{ value: 'Tỷ lệ (%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar yAxisId="left" dataKey="present" name="Có ăn" fill={config.colors.present} radius={[4, 4, 4, 4]} barSize={40} />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="rate"
                    name="Tỷ lệ (%)"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-slate-900">Chi tiết theo ngày</h3>
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
                <Settings className="w-4 h-4" />
                Tùy chỉnh cột
              </button>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 p-2 hidden group-hover:block z-10">
                {Object.keys(visibleColumns).map(key => (
                  <label key={key} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns[key as keyof typeof visibleColumns]}
                      onChange={() => setVisibleColumns({ ...visibleColumns, [key]: !visibleColumns[key as keyof typeof visibleColumns] })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 capitalize">
                      {key === 'date' ? 'Ngày' :
                        key === 'present' ? 'Có ăn' :
                          key === 'excused' ? 'Nghỉ phép' :
                            key === 'absent' ? 'Không ăn' :
                              key === 'total' ? 'Tổng số' : 'Tỷ lệ'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {visibleColumns.date && <th className="px-6 py-4 text-sm font-semibold text-slate-600">Ngày</th>}
                  {visibleColumns.total && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Tổng số</th>}
                  {visibleColumns.present && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Có ăn</th>}
                  {visibleColumns.excused && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Nghỉ phép</th>}
                  {visibleColumns.absent && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Không ăn</th>}
                  {visibleColumns.rate && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Tỷ lệ (%)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((row, index) => {
                  const absent = row.total - row.present;
                  return (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      {visibleColumns.date && <td className="px-6 py-4 text-sm font-medium text-slate-900">{row.formattedDate}</td>}
                      {visibleColumns.total && <td className="px-6 py-4 text-sm text-slate-600 text-center">{row.total}</td>}
                      {visibleColumns.present && <td className="px-6 py-4 text-sm text-emerald-600 font-medium text-center">{row.present}</td>}
                      {visibleColumns.excused && <td className="px-6 py-4 text-sm text-amber-600 font-medium text-center">{row.excused}</td>}
                      {visibleColumns.absent && <td className="px-6 py-4 text-sm text-red-600 font-medium text-center">{absent}</td>}
                      {visibleColumns.rate && (
                        <td className="px-6 py-4 text-sm text-slate-900 font-bold text-center">
                          <span className={`px-2 py-1 rounded-full ${row.rate >= 90 ? 'bg-emerald-100 text-emerald-700' : row.rate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                            {row.rate}%
                          </span>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderPayments = () => {
    const [, mon] = paymentMonth.split('-');
    const [year] = paymentMonth.split('-');
    const monthDisplay = `Tháng ${mon}/${year}`;

    const filteredPayments = payments.filter(p =>
      paymentFilter === 'all' ? true : paymentFilter === 'paid' ? p.paid === 1 : p.paid === 0
    );

    return (
      <div className="space-y-4">
        {/* Header: month selector + generate button */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <button onClick={() => changePaymentMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-lg font-bold text-slate-900 min-w-[10rem] text-center">{monthDisplay}</span>
            <button onClick={() => changePaymentMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGeneratePayments}
              disabled={loading}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              <Wallet className="w-5 h-5" />
              <span>Tạo bảng thu</span>
            </button>
            <button
              onClick={handleExportPayments}
              disabled={payments.length === 0}
              className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium hover:bg-emerald-100 transition-colors disabled:opacity-50 text-sm md:text-base"
            >
              <Download className="w-5 h-5" />
              <span className="hidden md:inline">Xuất Excel</span>
            </button>
            <button
              onClick={() => handlePrint('all')}
              disabled={filteredPayments.length === 0}
              className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors disabled:opacity-50 text-sm md:text-base ml-2"
            >
              <Printer className="w-5 h-5" />
              <span className="hidden md:inline">In phiếu</span>
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-sm text-slate-500 mb-1">💰 Tổng cần thu</p>
            <p className="text-2xl font-bold text-slate-900">{formatCurrency(Number(paymentStats.total_amount) || 0)}</p>
            <p className="text-xs text-slate-400 mt-1">{Number(paymentStats.total_students) || 0} học sinh</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100">
            <p className="text-sm text-emerald-600 mb-1">✅ Đã thu</p>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(Number(paymentStats.paid_amount) || 0)}</p>
            <p className="text-xs text-emerald-400 mt-1">{Number(paymentStats.paid_count) || 0} học sinh</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white p-5 rounded-2xl shadow-sm border border-red-100">
            <p className="text-sm text-red-600 mb-1">❌ Chưa thu</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(Number(paymentStats.unpaid_amount) || 0)}</p>
            <p className="text-xs text-red-400 mt-1">{Number(paymentStats.unpaid_count) || 0} học sinh</p>
          </motion.div>
        </div>

        {/* Filter + Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex gap-2">
              {(['all', 'paid', 'unpaid'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setPaymentFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${paymentFilter === f
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'text-slate-500 hover:bg-slate-100'
                    }`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'paid' ? '✅ Đã thu' : '❌ Chưa thu'}
                </button>
              ))}
            </div>
            <span className="text-sm text-slate-500">{filteredPayments.length} học sinh</span>
          </div>

          {payments.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Chưa có bảng thu phí tháng này</p>
              <p className="text-sm mt-1">Bấm "Tạo bảng thu" để bắt đầu</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 w-12">STT</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">Họ và tên</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500">Lớp</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Bữa</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-right">Thành tiền</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 text-center">In</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p, i) => (
                    <tr key={p.id} className={`transition-colors ${p.paid ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                      <td className="px-4 py-3 text-sm text-slate-400">{i + 1}</td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{p.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{p.class_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 text-center">{p.total_meals}</td>
                      <td className="px-4 py-3 text-sm font-mono text-slate-900 text-right">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleTogglePayment(p.id)}
                          className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${p.paid
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                            }`}
                        >
                          {p.paid ? '✅ Đã thu' : '❌ Chưa thu'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handlePrint(String(p.id))}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="In phiếu thu"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-6">
      {/* Cấu hình tiền ăn */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-amber-600" />
          Cấu hình tiền ăn
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Đơn giá 1 bữa ăn (VNĐ)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                step={1000}
                value={config.mealPrice}
                onChange={(e) => setConfig({ ...config, mealPrice: Number(e.target.value) })}
                className="w-48 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold text-slate-900"
              />
              <span className="text-sm text-slate-500">đ/bữa</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Giá trị này dùng để tính thành tiền trong báo cáo chấm công và thu phí.
            </p>
          </div>

          {/* Preview */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
            <p className="text-sm text-amber-700 font-medium mb-1">Ví dụ tính tiền:</p>
            <p className="text-sm text-amber-600">
              1 học sinh ăn <strong>20 bữa</strong> × <strong>{(config.mealPrice || 0).toLocaleString('vi-VN')}đ</strong> = <strong className="text-amber-800">{(20 * (config.mealPrice || 0)).toLocaleString('vi-VN')}đ</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Cấu hình giao diện */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-slate-600" />
          Cấu hình giao diện
        </h3>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Màu trạng thái "Có mặt"</label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={config.colors.present}
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, present: e.target.value } })}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <div className="flex-1 p-4 rounded-xl border border-slate-100 flex items-center justify-between"
                style={{ backgroundColor: `${config.colors.present}15`, borderColor: `${config.colors.present}40` }}
              >
                <span className="font-bold" style={{ color: config.colors.present }}>Nguyễn Văn A</span>
                <CheckCircle2 className="w-6 h-6" style={{ color: config.colors.present }} />
              </div>
            </div>
          </div>



          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => setConfig({ mealPrice: 35000, colors: { present: '#10b981', excused: '#f59e0b' } })}
              className="text-sm text-slate-500 hover:text-indigo-600 underline"
            >
              Khôi phục mặc định
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        {/* Sidebar / Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 md:top-0 md:bottom-0 md:w-64 bg-white border-t md:border-t-0 md:border-r border-slate-200 z-50">
          <div className="p-6 hidden md:block">
            <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
              <ClipboardCheck className="w-8 h-8" />
              LunchCheck
            </h1>
          </div>

          <div className="flex md:flex-col p-2 md:p-4 justify-around md:justify-start md:space-y-2">
            <NavItem
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              icon={<LayoutDashboard className="w-5 h-5" />}
              label="Tổng quan"
            />
            <NavItem
              active={activeTab === 'attendance'}
              onClick={() => setActiveTab('attendance')}
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Chấm công"
            />
            <NavItem
              active={activeTab === 'students'}
              onClick={() => setActiveTab('students')}
              icon={<Users className="w-5 h-5" />}
              label="Học sinh"
            />
            <NavItem
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
              icon={<History className="w-5 h-5" />}
              label="Lịch sử"
            />
            <NavItem
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              icon={<BarChart3 className="w-5 h-5" />}
              label="Báo cáo"
            />
            <NavItem
              active={activeTab === 'payments'}
              onClick={() => setActiveTab('payments')}
              icon={<Wallet className="w-5 h-5" />}
              label="Thu phí"
            />
            <NavItem
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings className="w-5 h-5" />}
              label="Cài đặt"
            />
          </div>
        </nav>

        {/* Main Content */}
        <main className="md:ml-64 p-4 md:p-8 pb-24 md:pb-8">
          <header className="mb-6 md:mb-8 flex justify-between items-center">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900">
                {activeTab === 'dashboard' && 'Bảng điều khiển'}
                {activeTab === 'attendance' && 'Chấm công'}
                {activeTab === 'students' && 'Học sinh'}
                {activeTab === 'history' && 'Lịch sử'}
                {activeTab === 'reports' && 'Báo cáo'}
                {activeTab === 'payments' && 'Thu phí'}
                {activeTab === 'settings' && 'Cài đặt'}
              </h2>
              <p className="text-sm md:text-base text-slate-500">Chào mừng bạn trở lại.</p>
            </div>
            {loading && <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />}
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'attendance' && renderAttendance()}
              {activeTab === 'students' && renderStudents()}
              {activeTab === 'history' && renderHistory()}
              {activeTab === 'reports' && renderReports()}
              {activeTab === 'payments' && renderPayments()}
              {activeTab === 'settings' && renderSettings()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* --- IN PHIẾU THU SECTION --- */}
      {printingPayments.length > 0 && (
        <div id="print-area" className="hidden print:block absolute top-0 left-0 w-full bg-white print:p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
            {printingPayments.map((p, index) => {
              const [, mon, year] = paymentMonth.match(/(\d{4})-(\d{2})/) || [, p.month.substring(5, 7), p.month.substring(0, 4)];
              return (
                <div key={`${p.id}-${index}`} className="border-2 border-slate-800 p-6 rounded-xl flex flex-col gap-4 text-black break-inside-avoid">
                  {/* Header */}
                  <div className="flex justify-between items-start border-b border-slate-300 pb-4">
                    <div>
                      <h2 className="font-bold text-lg uppercase">Nhóm Trẻ Mầm Non CCVH</h2>
                      <p className="text-sm font-medium">Lớp: {p.class_name}</p>
                      <p className="text-sm">GV: Cô Việt Hồng</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm italic">Ngày in: {new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="text-center py-2">
                    <h1 className="text-2xl font-bold uppercase tracking-wide">Phiếu Thu Tiền Ăn</h1>
                    <p className="text-md font-semibold mt-1">Sử dụng cho tháng {mon}/{year}</p>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col gap-3 py-2">
                    <div className="flex text-lg">
                      <span className="w-40 font-semibold">Tên học sinh:</span>
                      <span className="font-bold uppercase flex-1 border-b border-dotted border-slate-400">{p.name}</span>
                    </div>
                    <div className="flex text-lg">
                      <span className="w-40 font-semibold">Tổng số bữa ăn:</span>
                      <span className="font-bold flex-1 border-b border-dotted border-slate-400">{p.total_meals} bữa</span>
                    </div>
                    <div className="flex text-lg">
                      <span className="w-40 font-semibold">Đơn giá:</span>
                      <span className="flex-1 border-b border-dotted border-slate-400">{formatCurrency(p.meal_price)}/bữa</span>
                    </div>
                    <div className="flex text-xl mt-4">
                      <span className="w-40 font-bold uppercase">Thành Tiền:</span>
                      <span className="font-bold flex-1 border-b-2 border-slate-800 tracking-wider">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                    {p.note && (
                      <div className="flex text-md italic mt-2">
                        <span className="w-40 font-semibold">Ghi chú:</span>
                        <span className="flex-1 border-b border-dotted border-slate-400">{p.note}</span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between items-start mt-8 pt-4">
                    <div className="text-center w-48">
                      <p className="font-semibold mb-16">Người nộp tiền</p>
                      <p className="italic text-sm text-slate-500">(Ký và ghi rõ họ tên)</p>
                    </div>
                    <div className="text-center w-48">
                      <p className="font-semibold mb-16">Giáo viên lập phiếu</p>
                      <p className="italic text-slate-800 font-bold hidden print:block">Việt Hồng</p>
                      <p className="italic text-sm text-slate-500">Cô Việt Hồng</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-4 py-3 rounded-xl transition-all w-full ${active
        ? 'bg-indigo-50 text-indigo-600 font-semibold'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
    >
      {icon}
      <span className="text-[10px] md:text-sm">{label}</span>
    </button>
  );
}

function DatePickerVN({ value, onChange, compact }: { value: string; onChange: (v: string) => void; compact?: boolean }) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const formatted = (() => {
    if (!value) return '';
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  })();

  const handleClick = () => {
    if (inputRef.current) {
      try { inputRef.current.showPicker(); } catch { inputRef.current.click(); }
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-indigo-300 transition-colors ${compact ? 'px-3 py-2' : 'px-3 py-1.5'
        }`}
    >
      <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
      <span className="font-medium text-slate-900 select-none whitespace-nowrap">{formatted}</span>
      <input
        ref={inputRef}
        type="date"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
      />
    </div>
  );
}

