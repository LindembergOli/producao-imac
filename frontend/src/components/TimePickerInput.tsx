import React, { useState, useEffect } from 'react';
import { Clock, X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TimePickerInputProps {
    value: string; // Formato HH:MM
    onChange: (time: string) => void;
    label?: string;
    className?: string;
    disabled?: boolean;
    required?: boolean;
}

const TimePickerInput: React.FC<TimePickerInputProps> = ({
    value,
    onChange,
    label,
    className = '',
    disabled = false,
    required = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedHour, setSelectedHour] = useState(8);
    const [selectedMinute, setSelectedMinute] = useState(0);

    // Analisa o valor ao abrir o modal
    useEffect(() => {
        if (isOpen && value) {
            const parts = value.split(':');
            const h = Number(parts[0]);
            const m = Number(parts[1]);
            if (!isNaN(h) && !isNaN(m) && h >= 0 && h <= 23 && m >= 0 && m <= 59) {
                setSelectedHour(h);
                setSelectedMinute(m);
            }
        }
    }, [isOpen, value]);

    const handleConfirm = () => {
        const hour = String(selectedHour).padStart(2, '0');
        const minute = String(selectedMinute).padStart(2, '0');
        onChange(`${hour}:${minute}`);
        setIsOpen(false);
    };

    const handleClear = () => {
        onChange('');
        setIsOpen(false);
    };

    // Gera horas (0-23)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    // Gera minutos (0-59)
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    const Modal = () => createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Cabeçalho */}
                <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-imac-primary" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Selecionar Horário</h3>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full text-gray-500 dark:text-gray-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Conteúdo */}
                <div className="p-6">
                    {/* Exibição */}
                    <div className="text-center mb-6">
                        <div className="inline-flex items-center gap-2 bg-imac-primary/10 dark:bg-imac-primary/20 px-6 py-4 rounded-2xl">
                            <span className="text-5xl font-bold text-imac-primary tabular-nums">
                                {String(selectedHour).padStart(2, '0')}
                            </span>
                            <span className="text-5xl font-bold text-imac-primary">:</span>
                            <span className="text-5xl font-bold text-imac-primary tabular-nums">
                                {String(selectedMinute).padStart(2, '0')}
                            </span>
                        </div>
                    </div>

                    {/* Seletores */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Horas */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
                                Hora
                            </label>
                            <div className="h-64 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-xl p-2 bg-gray-50 dark:bg-slate-700/50">
                                {hours.map(h => (
                                    <button
                                        key={h}
                                        onClick={() => setSelectedHour(h)}
                                        className={`w-full p-2 rounded-lg text-sm font-semibold transition-all mb-1
                                            ${selectedHour === h
                                                ? 'bg-imac-primary text-white shadow-lg shadow-imac-primary/30'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                            }
                                        `}
                                    >
                                        {String(h).padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Minutos */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 text-center">
                                Minuto
                            </label>
                            <div className="h-64 overflow-y-auto border border-gray-200 dark:border-slate-600 rounded-xl p-2 bg-gray-50 dark:bg-slate-700/50">
                                {minutes.map(m => (
                                    <button
                                        key={m}
                                        onClick={() => setSelectedMinute(m)}
                                        className={`w-full p-2 rounded-lg text-sm font-semibold transition-all mb-1
                                            ${selectedMinute === m
                                                ? 'bg-imac-primary text-white shadow-lg shadow-imac-primary/30'
                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                                            }
                                        `}
                                    >
                                        {String(m).padStart(2, '0')}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Rodapé */}
                <div className="flex justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={handleClear}
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
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-imac-primary text-white font-bold shadow-lg shadow-imac-primary/20 hover:opacity-90 transition transform active:scale-95"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <div className={className}>
            {label && <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
            <div
                onClick={() => !disabled && setIsOpen(true)}
                className={`
                    relative w-full rounded-md border shadow-sm p-2 flex items-center gap-2 cursor-pointer transition-colors
                    ${disabled ? 'bg-gray-100 dark:bg-slate-800 cursor-not-allowed opacity-60' : 'bg-white dark:bg-slate-700 hover:border-imac-primary'}
                    border-gray-300 dark:border-slate-600 dark:text-white
                `}
            >
                <Clock size={18} className="text-gray-400" />
                <span className="flex-1 text-sm">
                    {value || 'Selecione o horário'}
                </span>
            </div>
            {isOpen && <Modal />}
        </div>
    );
};

export default TimePickerInput;
