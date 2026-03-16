import React from 'react';
import { motion } from 'motion/react';
import {
    Users,
    CheckCircle2,
    AlertCircle,
    UserPlus,
    Plus,
    FileSpreadsheet,
    Download,
    Upload,
    Trash2,
    Search,
    Wallet,
    History
} from 'lucide-react';
import { Student } from '../../types';

interface StudentsProps {
    students: Student[];
    newStudent: { name: string; student_code: string; class_name: string; note: string };
    setNewStudent: React.Dispatch<React.SetStateAction<{ name: string; student_code: string; class_name: string; note: string }>>;
    handleAddStudent: (e: React.FormEvent) => void;
    handleDeleteStudent: (id: number) => void;
    selectedStudentIds: Set<number>;
    setSelectedStudentIds: React.Dispatch<React.SetStateAction<Set<number>>>;
    handleBatchDeleteStudents: () => void;
    handleImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    setRechargeModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; studentId: number; studentName: string }>>;
    loading: boolean;
}

export function Students({
    students,
    newStudent,
    setNewStudent,
    handleAddStudent,
    handleDeleteStudent,
    selectedStudentIds,
    setSelectedStudentIds,
    handleBatchDeleteStudents,
    handleImport,
    setRechargeModal,
    loading
}: StudentsProps) {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.class_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleStudentSelection = (id: number) => {
        setSelectedStudentIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedStudentIds.size === students.length) {
            setSelectedStudentIds(new Set());
        } else {
            setSelectedStudentIds(new Set(students.map(s => s.id)));
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#3A86FF]/10 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#3A86FF]" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Tổng học sinh</p>
                        <p className="text-2xl font-extrabold text-slate-900">{students.length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Đang học</p>
                        <p className="text-2xl font-extrabold text-slate-900">{students.filter(s => s.active !== 0).length}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
                    <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Đã nghỉ</p>
                        <p className="text-2xl font-extrabold text-slate-900">{students.filter(s => s.active === 0).length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <form onSubmit={handleAddStudent} className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 mb-6 flex flex-col md:flex-row gap-4">
                    <div className="flex-shrink-0 md:w-48">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-[#3A86FF]" />
                            Thêm học sinh mới
                        </h3>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                        <input
                            type="text"
                            placeholder="Họ và tên"
                            required
                            className="p-2.5 bg-[#F1F5F9] border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#3A86FF] text-sm"
                            value={newStudent.name}
                            onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Mã học sinh"
                            required
                            className="p-2.5 bg-[#F1F5F9] border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#3A86FF] text-sm"
                            value={newStudent.student_code}
                            onChange={e => setNewStudent({ ...newStudent, student_code: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Lớp"
                            required
                            className="p-2.5 bg-[#F1F5F9] border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#3A86FF] text-sm"
                            value={newStudent.class_name}
                            onChange={e => setNewStudent({ ...newStudent, class_name: e.target.value })}
                        />
                        <input
                            type="text"
                            placeholder="Ghi chú"
                            className="p-2.5 bg-[#F1F5F9] border border-slate-200/60 rounded-xl outline-none focus:ring-2 focus:ring-[#3A86FF] text-sm"
                            value={newStudent.note}
                            onChange={e => setNewStudent({ ...newStudent, note: e.target.value })}
                        />
                    </div>
                    <div className="w-full md:w-32 md:pt-7">
                        <button
                            type="submit"
                            className="w-full h-11 bg-[#3A86FF] text-white rounded-xl hover:bg-[#2563EB] transition-colors font-semibold flex items-center justify-center gap-2 shadow-md shadow-blue-200"
                        >
                            <Plus className="w-5 h-5" />
                            Thêm
                        </button>
                    </div>
                </form>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 space-y-4 flex flex-col justify-center">
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
                            <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleImport} />
                        </label>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden overflow-x-auto">
                {selectedStudentIds.size > 0 && (
                    <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-red-700">Đã chọn <strong>{selectedStudentIds.size}</strong> học sinh</span>
                        <div className="flex gap-2">
                            <button onClick={() => setSelectedStudentIds(new Set())} className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 transition">Bỏ chọn</button>
                            <button onClick={handleBatchDeleteStudents} className="px-4 py-1.5 text-sm font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition flex items-center gap-1.5"><Trash2 className="w-4 h-4" />Xóa đã chọn</button>
                        </div>
                    </div>
                )}

                <div className="p-4 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Lọc danh sách..."
                            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-400 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-5 py-4 w-10">
                                <input type="checkbox" className="rounded" checked={selectedStudentIds.size === students.length && students.length > 0} onChange={toggleSelectAll} />
                            </th>
                            <th className="px-5 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Mã học sinh</th>
                            <th className="px-5 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Họ và Tên</th>
                            <th className="px-5 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Lớp</th>
                            <th className="px-5 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs">Số dư</th>
                            <th className="px-5 py-4 font-bold text-slate-600 uppercase tracking-wider text-xs text-center">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map(student => (
                            <tr key={student.id} className={`hover:bg-slate-50/80 transition-colors ${selectedStudentIds.has(student.id) ? 'bg-blue-50/30' : ''}`}>
                                <td className="px-5 py-4">
                                    <input type="checkbox" className="rounded" checked={selectedStudentIds.has(student.id)} onChange={() => toggleStudentSelection(student.id)} />
                                </td>
                                <td className="px-5 py-4 font-medium text-slate-900">{student.student_code}</td>
                                <td className="px-5 py-4 font-bold text-[#3A86FF]">{student.name}</td>
                                <td className="px-5 py-4 text-slate-600">{student.class_name}</td>
                                <td className="px-5 py-4">
                                    <span className={`font-bold ${student.balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {new Intl.NumberFormat('vi-VN').format(student.balance)}đ
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => setRechargeModal({ isOpen: true, studentId: student.id, studentName: student.name })} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Nạp tiền">
                                            <Wallet className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDeleteStudent(student.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Xóa">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
