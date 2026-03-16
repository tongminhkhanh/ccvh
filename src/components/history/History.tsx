import React from 'react';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';
import { AttendanceRecord, AppConfig } from '../../types';

interface HistoryProps {
    selectedDate: string;
    setSelectedDate: (v: string) => void;
    attendance: AttendanceRecord[];
    config: AppConfig;
}

export function History({ selectedDate, setSelectedDate, attendance, config }: HistoryProps) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200/60">
                <div className="flex items-center space-x-4">
                    <CalendarIcon className="w-5 h-5 text-slate-400" />
                    <input
                        type="date"
                        className="bg-[#F1F5F9] border border-slate-200/60 rounded-xl p-2.5 focus:ring-2 focus:ring-[#3A86FF] outline-none text-sm"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
                <div className="text-slate-600 font-medium">
                    Tổng số: {attendance.length} học sinh
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden overflow-x-auto">
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
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                                        <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                        Không có dữ liệu cho ngày này
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

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
                            Không có dữ liệu
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
