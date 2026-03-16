import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, XCircle, CheckCircle2, Loader2, History, Trash2 } from 'lucide-react';
import { Transaction } from '../../types';

interface RechargeModalProps {
    isOpen: boolean;
    studentId: number;
    studentName: string;
    onClose: () => void;
    rechargeTab: 'recharge' | 'history';
    setRechargeTab: (tab: 'recharge' | 'history') => void;
    rechargeAmount: number;
    setRechargeAmount: (amount: number) => void;
    rechargeNote: string;
    setRechargeNote: (note: string) => void;
    isLoading: boolean;
    handleRecharge: () => void;
    transactions: Transaction[];
    isLoadingTransactions: boolean;
    fetchTransactions: (id: number) => void;
    handleDeleteTransaction?: (id: number) => void;
}

export function RechargeModal({
    isOpen,
    studentId,
    studentName,
    onClose,
    rechargeTab,
    setRechargeTab,
    rechargeAmount,
    setRechargeAmount,
    rechargeNote,
    setRechargeNote,
    isLoading,
    handleRecharge,
    transactions,
    isLoadingTransactions,
    fetchTransactions,
    handleDeleteTransaction
}: RechargeModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-200"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex flex-col">
                                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Wallet className="w-6 h-6 text-emerald-500" />
                                    Quản lý tài khoản
                                </h3>
                                <p className="text-sm font-medium text-slate-500">{studentName}</p>
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b border-slate-100 bg-slate-50/50">
                            <button
                                onClick={() => setRechargeTab('recharge')}
                                className={`flex-1 py-3 text-sm font-bold transition-all relative ${rechargeTab === 'recharge' ? 'text-[#3A86FF]' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Nạp tiền mới
                                {rechargeTab === 'recharge' && (
                                    <motion.div layoutId="tab-recharge" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A86FF]" />
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setRechargeTab('history');
                                    fetchTransactions(studentId);
                                }}
                                className={`flex-1 py-3 text-sm font-bold transition-all relative ${rechargeTab === 'history' ? 'text-[#3A86FF]' : 'text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                Lịch sử giao dịch
                                {rechargeTab === 'history' && (
                                    <motion.div layoutId="tab-recharge" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3A86FF]" />
                                )}
                            </button>
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {rechargeTab === 'recharge' ? (
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Số tiền nạp (VNĐ)</label>
                                        <input
                                            type="number"
                                            value={rechargeAmount || ''}
                                            onChange={(e) => setRechargeAmount(Number(e.target.value))}
                                            placeholder="VD: 500000"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3A86FF] outline-none font-bold text-lg text-[#3A86FF]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Ghi chú</label>
                                        <textarea
                                            value={rechargeNote}
                                            onChange={(e) => setRechargeNote(e.target.value)}
                                            placeholder="VD: Phụ huynh nộp trước tiền cả học kỳ"
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#3A86FF] outline-none text-sm min-h-[80px]"
                                        />
                                    </div>
                                    <div className="pt-2 flex gap-3">
                                        <button
                                            onClick={onClose}
                                            className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition shadow-sm"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleRecharge}
                                            disabled={isLoading || rechargeAmount <= 0}
                                            className="flex-2 py-3 px-8 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition shadow-md shadow-emerald-200 flex items-center justify-center gap-2"
                                        >
                                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                            Xác nhận nạp
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-0">
                                    {isLoadingTransactions ? (
                                        <div className="p-12 flex justify-center">
                                            <Loader2 className="w-8 h-8 text-[#3A86FF] animate-spin" />
                                        </div>
                                    ) : transactions.length === 0 ? (
                                        <div className="p-12 text-center text-slate-400">
                                            <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                            <p className="text-sm">Chưa có giao dịch nào</p>
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-slate-100">
                                            {transactions.map((tx) => (
                                                <div key={tx.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                                                    <div className="flex-1 min-w-0 mr-4">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tx.amount >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                                                }`}>
                                                                {tx.action_type === 'recharge' ? 'NẠP TIỀN' : tx.action_type === 'payment' ? 'TRỪ TIỀN' : 'GIAO DỊCH'}
                                                            </span>
                                                            <span className="text-[11px] text-slate-400">
                                                                {new Date(tx.created_at).toLocaleString('vi-VN')}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-800">
                                                            {tx.amount >= 0 ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(tx.amount)}đ
                                                        </p>
                                                        {tx.note && <p className="text-xs text-slate-500 mt-1 truncate">{tx.note}</p>}
                                                    </div>
                                                    {handleDeleteTransaction && (
                                                        <button
                                                            onClick={() => handleDeleteTransaction(tx.id)}
                                                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                            title="Xóa giao dịch"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
