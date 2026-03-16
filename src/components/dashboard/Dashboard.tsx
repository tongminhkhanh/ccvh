import React from 'react';
import { motion } from 'motion/react';
import {
    CheckCircle2,
    XCircle,
    TrendingUp,
    ArrowUpRight,
    AlertCircle,
    Wallet
} from 'lucide-react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Stats, AppConfig, FinancialAnalytics, Tab } from '../../types';

interface DashboardProps {
    stats: Stats;
    config: AppConfig;
    financialAnalytics: FinancialAnalytics;
    setActiveTab: (tab: Tab) => void;
}

export function Dashboard({ stats, config, financialAnalytics, setActiveTab }: DashboardProps) {
    console.log('[Dashboard] Rendering with:', { stats, financialAnalytics });
    return (
        <div className="space-y-6 relative">
            <div className="absolute -top-3 right-0 text-[10px] font-mono text-slate-300">v2.0.4</div>
            {/* Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-5"
                >
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${config.colors.present}15` }}>
                        <CheckCircle2 className="w-7 h-7" style={{ color: config.colors.present }} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Có ăn</p>
                        <p className="text-4xl font-extrabold text-slate-900 leading-none">{stats.presentToday}</p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 flex items-center space-x-5"
                >
                    <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center">
                        <XCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 mb-1">Không ăn</p>
                        <p className="text-4xl font-extrabold text-slate-900 leading-none">{stats.absentToday}</p>
                    </div>
                </motion.div>
            </div>

            {/* Progress card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden"
            >
                <div className="p-6">
                    <div className="flex justify-between items-start mb-1">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Tỷ lệ tham gia hôm nay</h3>
                            <p className="text-sm text-slate-400 mt-1">Trạng thái tham gia thực tế</p>
                        </div>
                        <span className="text-3xl font-extrabold text-[#3A86FF]">
                            {stats.totalStudents > 0 ? Math.round((stats.presentToday / stats.totalStudents) * 100) : 0}%
                        </span>
                    </div>

                    <div className="mt-5">
                        <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden flex">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.totalStudents > 0 ? (stats.presentToday / stats.totalStudents) * 100 : 0}%` }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: config.colors.present }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                        <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: config.colors.present }}></div>
                                <span className="text-sm text-slate-500">Có ăn</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                                <span className="text-sm text-slate-500">Không ăn</span>
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">
                            <span className="font-semibold text-slate-700">Tổng sĩ số:</span> {stats.totalStudents} học sinh
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Financial Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60 transition-all">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Dòng tiền thu phí</h3>
                            <p className="text-sm text-slate-400">So sánh Dự thu vs Thực thu (6 chu kỳ gần nhất)</p>
                        </div>
                        <div className="flex gap-4 text-xs font-medium">
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span>Dự thu</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span>Thực thu</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ width: '100%', height: 300, position: 'relative' }}>
                        <ResponsiveContainer width="100%" height={300}>
                            <ComposedChart data={financialAnalytics.history || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value: any) => [new Intl.NumberFormat('vi-VN').format(value) + 'đ', '']}
                                />
                                <Bar dataKey="projected" fill="#3A86FF" radius={[4, 4, 0, 0]} barSize={40} name="Dự thu" />
                                <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} name="Thực thu" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between transition-all">
                    <div>
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                            <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold opacity-90">Dự báo doanh thu</h3>
                        <p className="text-3xl font-bold mt-2">
                            {financialAnalytics.forecast ? new Intl.NumberFormat('vi-VN').format(financialAnalytics.forecast.nextMonth) : 0}đ
                        </p>
                        <p className="text-xs mt-2 opacity-75 leading-relaxed">
                            Dựa trên {financialAnalytics.forecast?.activeStudents} học sinh đang hoạt động (Trung bình {new Intl.NumberFormat('vi-VN').format(financialAnalytics.forecast?.avgPerStudent || 0)}đ/bé - 22 ngày công)
                        </p>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10">
                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-xs opacity-75">Tình trạng dòng tiền</p>
                                <p className="text-sm font-medium">Dữ liệu tự động cập nhật</p>
                            </div>
                            <ArrowUpRight className="w-5 h-5 opacity-50" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Info cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-blue-50/60 p-5 rounded-2xl border border-blue-100"
                >
                    <div className="w-10 h-10 bg-[#3A86FF] rounded-xl flex items-center justify-center mb-4 shadow-sm">
                        <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Thông báo mới</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Số liệu được tổng hợp từ dữ liệu điểm danh hàng ngày của các lớp.</p>
                    <button onClick={() => setActiveTab('history')} className="text-xs font-semibold text-[#3A86FF] mt-3 inline-flex items-center gap-1 hover:underline">
                        Xem chi tiết →
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-emerald-50/60 p-5 rounded-2xl border border-emerald-100"
                >
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Thực đơn hôm nay</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Cơm gà sốt nấm, canh rau cải, trái cây tráng miệng.</p>
                    <button onClick={() => setActiveTab('attendance')} className="text-xs font-semibold text-emerald-600 mt-3 inline-flex items-center gap-1 hover:underline">
                        Quản lý thực đơn →
                    </button>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-orange-50/60 p-5 rounded-2xl border border-orange-100"
                >
                    <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">Thu phí tháng này</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">Theo dõi tình trạng đóng phí ăn bán trú của học sinh.</p>
                    <button onClick={() => setActiveTab('payments')} className="text-xs font-semibold text-orange-600 mt-3 inline-flex items-center gap-1 hover:underline">
                        Theo dõi công nợ →
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
