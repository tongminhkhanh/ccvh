import React from 'react';
import { Menu, Loader2, Plus } from 'lucide-react';
import { Tab } from '../../types';

interface HeaderProps {
    activeTab: Tab;
    loading: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
    setActiveTab: (tab: Tab) => void;
}

export function Header({ activeTab, loading, setIsMobileMenuOpen, setActiveTab }: HeaderProps) {
    const getTitle = () => {
        switch (activeTab) {
            case 'dashboard': return 'Bảng điều khiển';
            case 'attendance': return 'Chấm công';
            case 'students': return 'Học sinh';
            case 'history': return 'Lịch sử';
            case 'reports': return 'Báo cáo';
            case 'payments': return 'Thu phí';
            case 'settings': return 'Cài đặt';
            default: return '';
        }
    };

    return (
        <header className="mb-6 md:mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg md:hidden"
                >
                    <Menu className="w-6 h-6" />
                </button>
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                        {getTitle()}
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">Chào mừng bạn trở lại, hệ thống đã sẵn sàng.</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {loading && <Loader2 className="w-5 h-5 text-[#3A86FF] animate-spin" />}
                {activeTab === 'dashboard' && (
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className="flex items-center gap-2 bg-[#3A86FF] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-[#2563EB] transition-all shadow-md shadow-blue-200 text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Điểm danh mới
                    </button>
                )}
            </div>
        </header>
    );
}
