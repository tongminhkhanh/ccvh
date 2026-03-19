import React from 'react';
import { motion } from 'motion/react';
import { Search, Users, CheckCircle2, XCircle } from 'lucide-react';
import { DatePickerVN } from '../common/DatePickerVN';
import { Student, AttendanceRecord } from '../../types';

interface AttendanceProps {
    students: Student[];
    attendance: AttendanceRecord[];
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    selectedDate: string;
    setSelectedDate: (v: string) => void;
    toggleAttendance: (id: number) => void;
    markAllPresent: () => void;
    markAllAbsent: () => void;
}

export function Attendance({
    students,
    attendance,
    searchTerm,
    setSearchTerm,
    selectedDate,
    setSelectedDate,
    toggleAttendance,
    markAllPresent,
    markAllAbsent
}: AttendanceProps) {
    const presentStudentIds = new Set(
        attendance
            .filter(a => a.status === 'present')
            .map(a => a.student_id)
    );

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.student_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.class_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const presentCount = filteredStudents.filter(student => presentStudentIds.has(student.id)).length;
    const absentCount = filteredStudents.length - presentCount;

    return (
        <div className="space-y-5">
            {/* Search + Date + Actions bar */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:flex-1 md:max-w-lg">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, mã HS, lớp..."
                            className="w-full pl-11 pr-4 py-2.5 bg-[#F1F5F9] border border-slate-200/60 rounded-xl focus:ring-2 focus:ring-[#3A86FF] focus:border-[#3A86FF] outline-none text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex w-full md:w-auto flex-wrap items-center gap-3 justify-center md:justify-end">
                        <DatePickerVN value={selectedDate} onChange={setSelectedDate} />
                        <button
                            onClick={markAllAbsent}
                            className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition text-sm font-semibold whitespace-nowrap"
                        >
                            Bỏ chọn hết
                        </button>
                        <button
                            onClick={markAllPresent}
                            className="px-4 py-2.5 bg-[#3A86FF] text-white rounded-xl hover:bg-[#2563EB] transition text-sm font-semibold shadow-md shadow-blue-200 whitespace-nowrap flex items-center gap-2"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            Chấm ăn tất cả
                        </button>
                    </div>
                </div>

                {/* Stats summary */}
                <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-500">Tổng: <strong className="text-slate-800">{filteredStudents.length}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-500">Có ăn: <strong className="text-emerald-600">{presentCount}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                        <span className="text-slate-500">Không ăn: <strong className="text-red-500">{absentCount}</strong></span>
                    </div>
                </div>
            </div>

            {/* Student cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredStudents.map((student) => {
                    const isPresent = presentStudentIds.has(student.id);

                    return (
                        <motion.button
                            key={student.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => toggleAttendance(student.id)}
                            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center gap-3 ${isPresent ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200 hover:border-[#3A86FF]/40'
                                }`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isPresent ? 'bg-emerald-500' : 'bg-slate-100'
                                }`}>
                                {isPresent ? <CheckCircle2 className="w-5 h-5 text-white" /> : <XCircle className="w-5 h-5 text-slate-300" />}
                            </div>
                            <div>
                                <p className={`text-sm font-bold leading-tight ${isPresent ? 'text-emerald-700' : 'text-slate-800'}`}>
                                    {student.name}
                                </p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{student.student_code}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                }`}>
                                {isPresent ? 'CÓ ĂN' : 'CHƯA CHẤM'}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}
