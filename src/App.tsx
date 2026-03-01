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
  Settings
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
  status: 'present' | 'excused';
}

interface Stats {
  totalStudents: number;
  presentToday: number;
  excusedToday: number;
  absentToday: number;
}

interface ReportData {
  date: string;
  present: number;
  excused: number;
  total: number;
}

interface AppConfig {
  colors: {
    present: string;
    excused: string;
  };
}

type Tab = 'dashboard' | 'attendance' | 'students' | 'history' | 'reports' | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, presentToday: 0, excusedToday: 0, absentToday: 0 });
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Config state
  const [config, setConfig] = useState<AppConfig>(() => {
    const saved = localStorage.getItem('appConfig');
    return saved ? JSON.parse(saved) : {
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
    
    // Cycle: Absent -> Present -> Excused -> Absent
    let nextStatus = 'present';
    if (record) {
      if (record.status === 'present') nextStatus = 'excused';
      else if (record.status === 'excused') nextStatus = 'absent';
    }

    try {
      if (nextStatus === 'absent') {
        await fetch('/api/attendance', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, date })
        });
      } else {
        await fetch('/api/attendance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ student_id: studentId, date, status: nextStatus })
        });
      }
      fetchData();
    } catch (error) {
      console.error('Error toggling attendance:', error);
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
            <p className="text-sm font-medium text-slate-500">Có mặt</p>
            <p className="text-3xl font-bold text-slate-900">{stats.presentToday}</p>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4"
        >
          <div className="p-4 rounded-xl" style={{ backgroundColor: `${config.colors.excused}20` }}>
            <HelpCircle className="w-8 h-8" style={{ color: config.colors.excused }} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Có phép</p>
            <p className="text-3xl font-bold text-slate-900">{stats.excusedToday}</p>
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
            <p className="text-sm font-medium text-slate-500">Vắng mặt</p>
            <p className="text-3xl font-bold text-slate-900">{stats.absentToday}</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-bottom border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-900">Tỷ lệ tham gia hôm nay</h3>
          <span className="text-sm font-medium text-indigo-600">
            {stats.totalStudents > 0 ? Math.round(((stats.presentToday + stats.excusedToday) / stats.totalStudents) * 100) : 0}%
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
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${stats.totalStudents > 0 ? (stats.excusedToday / stats.totalStudents) * 100 : 0}%` }}
              className="h-full"
              style={{ backgroundColor: config.colors.excused }}
            />
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.colors.present }}></div>Có mặt</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: config.colors.excused }}></div>Có phép</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-200"></div>Vắng mặt</div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => {
          const record = attendance.find(a => a.student_id === student.id);
          const status = record?.status;
          
          let bgClass = 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300';
          let icon = null;
          let customStyle = {};

          if (status === 'present') {
            customStyle = {
              backgroundColor: `${config.colors.present}15`, // 15 is hex opacity ~8%
              borderColor: `${config.colors.present}40`,
              color: config.colors.present
            };
            icon = <CheckCircle2 className="w-6 h-6" style={{ color: config.colors.present }} />;
          } else if (status === 'excused') {
            customStyle = {
              backgroundColor: `${config.colors.excused}15`,
              borderColor: `${config.colors.excused}40`,
              color: config.colors.excused
            };
            icon = <HelpCircle className="w-6 h-6" style={{ color: config.colors.excused }} />;
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
                {status === 'excused' && <span className="text-[10px] font-bold uppercase tracking-wider mt-1 block" style={{ color: config.colors.excused }}>Có phép</span>}
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
              onChange={e => setNewStudent({...newStudent, name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Mã học sinh" 
              required
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={newStudent.student_code}
              onChange={e => setNewStudent({...newStudent, student_code: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Lớp" 
              required
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={newStudent.class_name}
              onChange={e => setNewStudent({...newStudent, class_name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Ghi chú" 
              className="p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
              value={newStudent.note}
              onChange={e => setNewStudent({...newStudent, note: e.target.value})}
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
                      {record.status === 'present' ? (
                        <span 
                          className="px-2 py-1 text-xs font-bold rounded-full"
                          style={{ backgroundColor: `${config.colors.present}20`, color: config.colors.present }}
                        >
                          CÓ MẶT
                        </span>
                      ) : (
                        <span 
                          className="px-2 py-1 text-xs font-bold rounded-full"
                          style={{ backgroundColor: `${config.colors.excused}20`, color: config.colors.excused }}
                        >
                          CÓ PHÉP
                        </span>
                      )}
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
                  {record.status === 'present' ? (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">CÓ MẶT</span>
                  ) : (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">CÓ PHÉP</span>
                  )}
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

  const handleExportReport = () => {
    if (reportData.length === 0) return;

    const dataToExport = reportData.map(d => {
      const rate = d.total > 0 ? Math.round((d.present / d.total) * 100) : 0;
      const absent = d.total - d.present - d.excused;
      return {
        'Ngày': new Date(d.date).toLocaleDateString('vi-VN'),
        'Tổng số': d.total,
        'Có mặt': d.present,
        'Có phép': d.excused,
        'Vắng mặt': absent,
        'Tỷ lệ (%)': rate
      };
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo");
    XLSX.writeFile(wb, "Bao_Cao_Cham_Cong.xlsx");
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
                <input 
                  type="date" 
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-sm text-slate-500 whitespace-nowrap">Đến ngày:</span>
                <input 
                  type="date" 
                  className="bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
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
                  <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} label={{ value: 'Số lượng', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} label={{ value: 'Tỷ lệ (%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Bar yAxisId="left" dataKey="present" name="Có mặt" fill={config.colors.present} stackId="a" radius={[0, 0, 4, 4]} barSize={40} />
                  <Bar yAxisId="left" dataKey="excused" name="Có phép" fill={config.colors.excused} stackId="a" radius={[4, 4, 0, 0]} barSize={40} />
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
                      onChange={() => setVisibleColumns({...visibleColumns, [key]: !visibleColumns[key as keyof typeof visibleColumns]})}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-slate-700 capitalize">
                      {key === 'date' ? 'Ngày' : 
                       key === 'present' ? 'Có mặt' : 
                       key === 'excused' ? 'Có phép' : 
                       key === 'absent' ? 'Vắng mặt' : 
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
                  {visibleColumns.present && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Có mặt</th>}
                  {visibleColumns.excused && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Có phép</th>}
                  {visibleColumns.absent && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Vắng mặt</th>}
                  {visibleColumns.rate && <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center">Tỷ lệ (%)</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {chartData.map((row, index) => {
                  const absent = row.total - row.present - row.excused;
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

  const renderSettings = () => (
    <div className="space-y-6">
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Màu trạng thái "Có phép"</label>
            <div className="flex items-center gap-4">
              <input 
                type="color" 
                value={config.colors.excused}
                onChange={(e) => setConfig({ ...config, colors: { ...config.colors, excused: e.target.value } })}
                className="h-10 w-20 rounded cursor-pointer"
              />
              <div className="flex-1 p-4 rounded-xl border border-slate-100 flex items-center justify-between"
                style={{ backgroundColor: `${config.colors.excused}15`, borderColor: `${config.colors.excused}40` }}
              >
                <span className="font-bold" style={{ color: config.colors.excused }}>Trần Thị B</span>
                <HelpCircle className="w-6 h-6" style={{ color: config.colors.excused }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button 
              onClick={() => setConfig({ colors: { present: '#10b981', excused: '#f59e0b' } })}
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
            {activeTab === 'settings' && renderSettings()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-4 py-3 rounded-xl transition-all w-full ${
        active 
          ? 'bg-indigo-50 text-indigo-600 font-semibold' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      {icon}
      <span className="text-[10px] md:text-sm">{label}</span>
    </button>
  );
}
