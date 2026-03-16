import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Download, Settings, Search } from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { ReportData } from '../../types';

interface ReportsProps {
    startDate: string;
    setStartDate: (v: string) => void;
    endDate: string;
    setEndDate: (v: string) => void;
    reportData: ReportData[];
    handleExportReport: () => void;
    handleExportMatrixReport: () => void;
}

export function Reports({
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reportData,
    handleExportReport,
    handleExportMatrixReport
}: ReportsProps) {
    const [visibleColumns, setVisibleColumns] = useState({
        date: true,
        total: true,
        present: true,
        excused: true,
        absent: true,
        rate: true
    });

    const chartData = reportData.map(r => ({
        ...r,
        formattedDate: new Date(r.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
        rate: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0
    }));

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="flex flex-col w-full md:w-40">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Từ ngày</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                    <div className="flex flex-col w-full md:w-40">
                        <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">Đến ngày</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <button
                        onClick={handleExportReport}
                        className="flex items-center justify-center gap-2 bg-slate-50 text-slate-700 px-6 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition shadow-sm border border-slate-200"
                    >
                        <Download className="w-5 h-5" />
                        Chi tiết (Dọc)
                    </button>
                    <button
                        onClick={handleExportMatrixReport}
                        className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 px-6 py-2.5 rounded-xl font-bold hover:bg-emerald-100 transition shadow-sm border border-emerald-100"
                    >
                        <Download className="w-5 h-5" />
                        Mẫu Ma trận (Ngang)
                    </button>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Biểu đồ sự tham gia</h3>
                        <p className="text-sm text-slate-400">Tỷ lệ học sinh có ăn theo thời gian</p>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="formattedDate" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="present" fill="#3A86FF" radius={[4, 4, 0, 0]} barSize={30} name="Có ăn" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Table Detail */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900">Chi tiết theo ngày</h3>
                    <div className="relative group">
                        <button className="flex items-center gap-2 text-sm font-medium d text-slate-600 hover:text-[#3A86FF]">
                            <Settings className="w-4 h-4" />
                            Tùy chỉnh cột
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 p-2 hidden group-hover:block z-10">
                            {Object.keys(visibleColumns).map(key => (
                                <label key={key} className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns[key as keyof typeof visibleColumns]}
                                        onChange={() => setVisibleColumns({ ...visibleColumns, [key]: !visibleColumns[key as keyof typeof visibleColumns] })}
                                        className="rounded text-[#3A86FF]"
                                    />
                                    <span className="text-sm text-slate-700 capitalize">
                                        {key === 'date' ? 'Ngày' : key === 'present' ? 'Có ăn' : key === 'excused' ? 'Nghỉ' : key === 'total' ? 'Tổng' : 'Tỷ lệ'}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-500 uppercase">
                            <tr>
                                {visibleColumns.date && <th className="px-6 py-4">Ngày</th>}
                                {visibleColumns.total && <th className="px-6 py-4 text-center">Tổng sĩ số</th>}
                                {visibleColumns.present && <th className="px-6 py-4 text-center">Có ăn</th>}
                                {visibleColumns.rate && <th className="px-6 py-4 text-center">Tỷ lệ</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm">
                            {chartData.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                    {visibleColumns.date && <td className="px-6 py-4 font-medium text-slate-900">{row.formattedDate}</td>}
                                    {visibleColumns.total && <td className="px-6 py-4 text-center text-slate-600">{row.total}</td>}
                                    {visibleColumns.present && <td className="px-6 py-4 text-center text-emerald-600 font-bold">{row.present}</td>}
                                    {visibleColumns.rate && (
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.rate >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {row.rate}%
                                            </span>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
