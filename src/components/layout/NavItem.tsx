import React from 'react';

interface NavItemProps {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}

export function NavItem({ active, onClick, icon, label }: NavItemProps) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-row items-center gap-3 px-4 py-3 rounded-xl transition-all w-full ${active
                ? 'bg-blue-50 text-[#3A86FF] font-semibold'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                }`}
        >
            {icon}
            <span className="text-sm">{label}</span>
        </button>
    );
}
