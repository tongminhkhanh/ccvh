import React from 'react';
import { motion } from 'motion/react';
import {
    Wallet,
    CheckCircle2,
    XCircle,
    Download,
    Printer,
    History
} from 'lucide-react';
import { PaymentRecord, PaymentStats } from '../../types';
import { formatCurrency } from '../../utils/helpers';

interface PaymentsProps {
    paymentStartDate: string;
    setPaymentStartDate: (v: string) => void;
    paymentEndDate: string;
    setPaymentEndDate: (v: string) => void;
    handleGeneratePayments: () => void;
    handleExportPayments: () => void;
    payments: PaymentRecord[];
    paymentStats: PaymentStats;
    paymentFilter: 'all' | 'paid' | 'unpaid';
    setPaymentFilter: (v: 'all' | 'paid' | 'unpaid') => void;
    handleTogglePayment: (id: number) => void;
    handleRemind: (p: PaymentRecord) => void;
    handlePrint: (id: string) => void;
    loading: boolean;
}

export function Payments({
    paymentStartDate,
    setPaymentStartDate,
    paymentEndDate,
    setPaymentEndDate,
    handleGeneratePayments,
    handleExportPayments,
    payments,
    paymentStats,
    paymentFilter,
    setPaymentFilter,
    handleTogglePayment,
    handleRemind,
    handlePrint,
    loading
}: PaymentsProps) {
    const filteredPayments = payments.filter(p =>
        paymentFilter === 'all' ? true : paymentFilter === 'paid' ? p.paid === 1 : p.paid === 0
    );

    return (
        <div className="space-y-4">
            {/* Filters & Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Từ ngày</label>
                        <input
                            type="date"
                            value={paymentStartDate}
                            onChange={(e) => setPaymentStartDate(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Đến ngày</label>
                        <input
                            type="date"
                            value={paymentEndDate}
                            onChange={(e) => setPaymentEndDate(e.target.value)}
                            className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleGeneratePayments}
                        disabled={loading}
                        className="flex items-center gap-2 bg-[#3A86FF] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#2563EB] transition shadow-md shadow-blue-200"
                    >
                        <Wallet className="w-5 h-5" />
                        Tạo bảng thu
                    </button>
                    <button
                        onClick={handleExportPayments}
                        disabled={payments.length === 0}
                        className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg font-medium hover:bg-emerald-100 transition"
                    >
                        <Download className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => handlePrint('all')}
                        disabled={filteredPayments.length === 0}
                        className="flex items-center gap-2 text-blue-600 bg-blue-50 px-3 py-2 rounded-lg font-medium hover:bg-blue-100 transition"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/60 flex items-center gap-4">
                    <div className="w-11 h-11 bg-[#3A86FF]/10 rounded-xl flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-[#3A86FF]" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-slate-400 uppercase">Tổng cần thu</p>
                        <p className="text-xl font-extrabold text-slate-900">{formatCurrency(Number(paymentStats.total_amount) || 0)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 flex items-center gap-4">
                    <div className="w-11 h-11 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-emerald-500 uppercase">Đã thu</p>
                        <p className="text-xl font-extrabold text-emerald-600">{formatCurrency(Number(paymentStats.paid_amount) || 0)}</p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100 flex items-center gap-4">
                    <div className="w-11 h-11 bg-red-50 rounded-xl flex items-center justify-center">
                        <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-red-500 uppercase">Chưa thu</p>
                        <p className="text-xl font-extrabold text-red-600">{formatCurrency(Number(paymentStats.unpaid_amount) || 0)}</p>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-2">
                    {(['all', 'paid', 'unpaid'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setPaymentFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${paymentFilter === f ? 'bg-blue-100 text-[#3A86FF]' : 'text-slate-500 hover:bg-slate-100'
                                }`}
                        >
                            {f === 'all' ? 'Tất cả' : f === 'paid' ? 'Đã thu' : 'Chưa thu'}
                        </button>
                    ))}
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-center">STT</th>
                                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px]">Học sinh</th>
                                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-right">Tiền ăn</th>
                                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-right">Phi khác</th>
                                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-right text-red-500">Trừ dư</th>
                                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-right">Thành tiền</th>
                                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-center">Trạng thái</th>
                                <th className="px-4 py-3 font-semibold text-slate-500 uppercase text-[10px] text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredPayments.map((p, i) => (
                                <tr key={p.id} className="hover:bg-slate-50 transition">
                                    <td className="px-4 py-3 text-center text-slate-400">{i + 1}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-bold text-slate-900">{p.name}</p>
                                        <p className="text-[10px] text-slate-400 uppercase">{p.student_code} • {p.class_name}</p>
                                    </td>
                                    <td className="px-4 py-3 text-right">{(p.total_meals * p.meal_price).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-3 text-right">{(p.cooking_fee + p.supervision_fee).toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-3 text-right text-red-500">-{p.applied_credit.toLocaleString('vi-VN')}</td>
                                    <td className="px-4 py-3 text-right font-bold text-[#3A86FF]">{formatCurrency(p.amount)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <button
                                            onClick={() => handleTogglePayment(p.id)}
                                            className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                                                }`}
                                        >
                                            {p.paid ? 'ĐÃ THU' : 'CHƯA THU'}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex justify-center gap-1">
                                            <button onClick={() => handleRemind(p)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded" title="Nhắc nợ">
                                                <History className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handlePrint(String(p.id))} className="p-1.5 text-slate-400 hover:text-blue-500 rounded" title="In">
                                                <Printer className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
