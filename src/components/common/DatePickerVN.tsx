import React, { useRef } from 'react';
import { Calendar } from 'lucide-react';

interface DatePickerVNProps {
    value: string;
    onChange: (v: string) => void;
    compact?: boolean;
}

export function DatePickerVN({ value, onChange, compact }: DatePickerVNProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const formatted = (() => {
        if (!value) return '';
        const [y, m, d] = value.split('-');
        return `${d}/${m}/${y}`;
    })();

    const handleClick = () => {
        if (inputRef.current) {
            try {
                inputRef.current.showPicker();
            } catch {
                inputRef.current.click();
            }
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`relative flex items-center gap-2 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:border-[#3A86FF] transition-colors ${compact ? 'px-3 py-2' : 'px-3 py-1.5'
                }`}
        >
            <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <span className="font-medium text-slate-900 select-none whitespace-nowrap">{formatted}</span>
            <input
                ref={inputRef}
                type="date"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                tabIndex={-1}
            />
        </div>
    );
}
