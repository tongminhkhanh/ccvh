import React from 'react';
import {
    XCircle,
    ClipboardCheck,
    LayoutDashboard,
    CheckCircle2,
    Users,
    History,
    BarChart3,
    Wallet,
    Settings
} from 'lucide-react';
import { NavItem } from './NavItem';
import { Tab } from '../../types';

interface SidebarProps {
    activeTab: Tab;
    setActiveTab: (tab: Tab) => void;
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (open: boolean) => void;
}

export function Sidebar({ activeTab, setActiveTab, isMobileMenuOpen, setIsMobileMenuOpen }: SidebarProps) {
    const handleNavClick = (tab: Tab) => {
        setActiveTab(tab);
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            <nav className={`fixed top-0 bottom-0 left-0 w-64 bg-white border-r border-slate-200 z-50 flex flex-col transition-transform duration-300 md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo section */}
                <div className="p-5 pb-3 flex items-center justify-between border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#3A86FF] rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
                            <ClipboardCheck className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 leading-tight">LunchPop</h1>
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Professional</p>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 md:hidden text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav items */}
                <div className="flex flex-col px-3 py-4 space-y-1 flex-1 overflow-y-auto">
                    <NavItem
                        active={activeTab === 'dashboard'}
                        onClick={() => handleNavClick('dashboard')}
                        icon={<LayoutDashboard className="w-5 h-5" />}
                        label="Tổng quan"
                    />
                    <NavItem
                        active={activeTab === 'attendance'}
                        onClick={() => handleNavClick('attendance')}
                        icon={<CheckCircle2 className="w-5 h-5" />}
                        label="Chấm công"
                    />
                    <NavItem
                        active={activeTab === 'students'}
                        onClick={() => handleNavClick('students')}
                        icon={<Users className="w-5 h-5" />}
                        label="Học sinh"
                    />
                    <NavItem
                        active={activeTab === 'history'}
                        onClick={() => handleNavClick('history')}
                        icon={<History className="w-5 h-5" />}
                        label="Lịch sử"
                    />
                    <NavItem
                        active={activeTab === 'reports'}
                        onClick={() => handleNavClick('reports')}
                        icon={<BarChart3 className="w-5 h-5" />}
                        label="Báo cáo"
                    />
                    <NavItem
                        active={activeTab === 'payments'}
                        onClick={() => handleNavClick('payments')}
                        icon={<Wallet className="w-5 h-5" />}
                        label="Thu phí"
                    />
                    <NavItem
                        active={activeTab === 'settings'}
                        onClick={() => handleNavClick('settings')}
                        icon={<Settings className="w-5 h-5" />}
                        label="Cài đặt"
                    />
                </div>

                {/* User profile section at bottom */}
                <div className="flex items-center gap-3 p-4 mx-3 mb-3 bg-orange-50 rounded-xl border border-orange-100 mt-auto relative">
                    <div className="w-9 h-9 bg-orange-400 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">VH</div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">Quản trị viên</p>
                        <p className="text-xs text-slate-400 truncate">Việt Hồng</p>
                    </div>
                    <div className="absolute -top-2 -right-1 bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded-full opacity-50">v2.0.4</div>
                </div>
            </nav>
        </>
    );
}
