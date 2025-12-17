
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';
import { createPortal } from 'react-dom';

// Fix duplicates in interface
interface DatePickerInputProps {
    value: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
    type?: 'date' | 'month';
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DatePickerInput: React.FC<DatePickerInputProps> = ({ value, onChange, label, className = '', disabled = false, type = 'date' }) => {
    const [isOpen, setIsOpen] = useState(false);

    // Parse initial date or default to today
    const initialDate = useMemo(() => {
        if (!value) return new Date();
        const parts = value.split('-').map(Number);

        if (type === 'month') {
            if (parts.length < 2) return new Date();
            const y = parts[0]!;
            const m = parts[1]!;
            if (isNaN(y) || isNaN(m)) return new Date();
            return new Date(y, m - 1, 1);
        }

        if (parts.length < 3) return new Date();
        const y = parts[0]!;
        const m = parts[1]!;
        const d = parts[2]!;

        if (isNaN(y) || isNaN(m) || isNaN(d)) return new Date();
        return new Date(y, m - 1, d);
    }, [value, type]);

    const [viewDate, setViewDate] = useState(initialDate);
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [currentView, setCurrentView] = useState<'days' | 'months' | 'years'>(type === 'month' ? 'months' : 'days');

    const toggleMonthView = () => {
        if (type === 'month') {
            // In month mode, toggling month view might just keep it or go to years? 
            // Logic: If in months, go to years. If in years, go to months.
            setCurrentView(v => v === 'months' ? 'years' : 'months');
        } else {
            setCurrentView(v => v === 'months' ? 'days' : 'months');
        }
    };
    const toggleYearView = () => setCurrentView(v => v === 'years' ? (type === 'month' ? 'months' : 'days') : 'years');

    const handleSelectMonth = (monthIndex: number) => {
        if (type === 'month') {
            const year = viewDate.getFullYear();
            const month = String(monthIndex + 1).padStart(2, '0');
            onChange(`${year}-${month}`);
            setIsOpen(false);
            return;
        }
        const newDate = new Date(viewDate.getFullYear(), monthIndex, 1);
        setViewDate(newDate);
        setCurrentView('days');
    };

    const handleSelectYear = (year: number) => {
        const newDate = new Date(year, viewDate.getMonth(), 1);
        setViewDate(newDate);
        setCurrentView(type === 'month' ? 'months' : 'days');
    };

    const handlePrevYearRange = () => {
        setViewDate(new Date(viewDate.getFullYear() - 12, viewDate.getMonth(), 1));
    };

    const handleNextYearRange = () => {
        setViewDate(new Date(viewDate.getFullYear() + 12, viewDate.getMonth(), 1));
    };

    const renderYears = () => {
        const currentYear = viewDate.getFullYear();
        const startYear = currentYear - 5;
        const endYear = currentYear + 6;
        const years = [];

        for (let y = startYear; y <= endYear; y++) {
            years.push(
                <button
                    key={y}
                    onClick={() => handleSelectYear(y)}
                    className={`p-3 rounded-xl text-sm font-semibold transition-all
                        ${viewDate.getFullYear() === y
                            ? 'bg-imac-primary text-white shadow-lg shadow-imac-primary/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}
                    `}
                >
                    {y}
                </button>
            );
        }
        return years;
    };

    // Reset view when opening
    // Reset view when opening
    useEffect(() => {
        if (isOpen) {
            let d = new Date();
            if (value) {
                const parts = value.split('-').map(Number);
                if (type === 'month' && parts.length >= 2) {
                    d = new Date(parts[0]!, parts[1]! - 1, 1);
                } else if (parts.length >= 3) {
                    d = new Date(parts[0]!, parts[1]! - 1, parts[2]!);
                }
            }
            setViewDate(d);
            setSelectedDate(d);
            setCurrentView(type === 'month' ? 'months' : 'days');
        }
    }, [isOpen, value, type]);

    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const startDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handleSelectDay = (day: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        setSelectedDate(newDate);
    };

    const handleConfirm = () => {
        const year = selectedDate.getFullYear();
        const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
        const day = String(selectedDate.getDate()).padStart(2, '0');
        onChange(`${year}-${month}-${day}`);
        setIsOpen(false);
    };

    // Generate calendar grid
    const renderCalendar = () => {
        const days = [];
        // Empty slots for days before start of month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
        }
        // Days of month
        for (let i = 1; i <= daysInMonth; i++) {
            const isSelected =
                selectedDate.getDate() === i &&
                selectedDate.getMonth() === viewDate.getMonth() &&
                selectedDate.getFullYear() === viewDate.getFullYear();

            const isToday =
                new Date().getDate() === i &&
                new Date().getMonth() === viewDate.getMonth() &&
                new Date().getFullYear() === viewDate.getFullYear();

            days.push(
                <button
                    key={i}
                    onClick={() => handleSelectDay(i)}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center text-sm font-medium transition-colors
            ${isSelected
                            ? 'bg-imac-primary text-white shadow-lg shadow-imac-primary/30'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}
            ${isToday && !isSelected ? 'text-imac-primary font-bold border border-imac-primary/30' : ''}
          `}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    // Portal for Modal to avoid z-index issues
    const Modal = () => createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
                    {currentView === 'days' && (
                        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    {currentView === 'years' && (
                        <button onClick={handlePrevYearRange} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                    {currentView === 'months' && <div className="w-9" />}

                    <div className="flex gap-2">
                        <button
                            onClick={toggleMonthView}
                            className={`text-lg font-bold capitalize hover:bg-gray-100 dark:hover:bg-slate-700 px-2 rounded-md transition-colors ${currentView === 'months' ? 'text-imac-primary' : 'text-gray-800 dark:text-white'}`}
                        >
                            {MONTHS[viewDate.getMonth()]}
                        </button>
                        <button
                            onClick={toggleYearView}
                            className={`text-lg font-bold hover:bg-gray-100 dark:hover:bg-slate-700 px-2 rounded-md transition-colors ${currentView === 'years' ? 'text-imac-primary' : 'text-gray-800 dark:text-white'}`}
                        >
                            {viewDate.getFullYear()}
                        </button>
                    </div>

                    {(currentView === 'days' && type !== 'month') && (
                        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400">
                            <ChevronRight size={20} />
                        </button>
                    )}
                    {currentView === 'years' && (
                        <button onClick={handleNextYearRange} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400">
                            <ChevronRight size={20} />
                        </button>
                    )}
                    {currentView === 'months' && <div className="w-9" />}
                </div>

                {/* Content */}
                <div className="p-4" style={{ minHeight: '320px' }}>
                    {currentView === 'days' && (
                        <>
                            <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                                {WEEKDAYS.map(d => (
                                    <div key={d} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendar()}
                            </div>
                        </>
                    )}

                    {currentView === 'months' && (
                        <div className="grid grid-cols-3 gap-4">
                            {MONTHS.map((m, index) => (
                                <button
                                    key={m}
                                    onClick={() => handleSelectMonth(index)}
                                    className={`p-3 rounded-xl text-sm font-semibold transition-all
                                        ${viewDate.getMonth() === index
                                            ? 'bg-imac-primary text-white shadow-lg shadow-imac-primary/30'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'}
                                    `}
                                >
                                    {m.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    )}

                    {currentView === 'years' && (
                        <div className="grid grid-cols-4 gap-4">
                            {renderYears()}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={() => { onChange(''); setIsOpen(false); }}
                        className="px-4 py-2 text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition dark:text-red-400"
                    >
                        Limpar
                    </button>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition dark:text-gray-300"
                    >
                        Cancelar
                    </button>
                    {type !== 'month' && (
                        <button
                            onClick={handleConfirm}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-imac-primary text-white font-bold shadow-lg shadow-imac-primary/20 hover:opacity-90 transition transform active:scale-95"
                        >
                            Confirmar
                        </button>
                    )}
                </div>
            </div>
        </div >,
        document.body
    );

    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>}
            <div
                onClick={() => !disabled && setIsOpen(true)}
                className={`
            relative w-full rounded-md border shadow-sm p-2 flex items-center gap-2 cursor-pointer transition-colors
            ${disabled ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-700 hover:border-imac-primary'}
            border-gray-300 dark:border-slate-600 dark:text-white
        `}
            >
                <CalendarIcon size={18} className="text-gray-400" />
                <span className="flex-1 text-sm">
                    {value ? (
                        type === 'month'
                            ? new Date(Number(value.split('-')[0]), Number(value.split('-')[1]) - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())
                            : new Date(Number(value.split('-')[0]), Number(value.split('-')[1]) - 1, Number(value.split('-')[2])).toLocaleDateString('pt-BR')
                    ) : (type === 'month' ? 'Selecione o mês' : 'Selecione a data')}
                </span>
            </div>
            {isOpen && <Modal />}
        </div>
    );
};

export default DatePickerInput;
