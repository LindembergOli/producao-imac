import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastContextData {
    addToast: (message: Omit<ToastMessage, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<ToastMessage[]>([]);

    const addToast = useCallback(({ type, title, message, duration = 3000 }: Omit<ToastMessage, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        const toast = { id, type, title, message, duration };

        setMessages((state) => [...state, toast]);

        if (duration > 0) {
            setTimeout(() => {
                setMessages((state) => state.filter((msg) => msg.id !== id));
            }, duration);
        }
    }, []);

    const removeToast = useCallback((id: string) => {
        setMessages((state) => state.filter((msg) => msg.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <ToastContainer messages={messages} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

// Componente interno para renderizar os toasts
const ToastContainer: React.FC<{ messages: ToastMessage[]; removeToast: (id: string) => void }> = ({ messages, removeToast }) => {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
            {messages.map((msg) => (
                <ToastItem key={msg.id} message={msg} onRemove={() => removeToast(msg.id)} />
            ))}
        </div>
    );
};

const ToastItem: React.FC<{ message: ToastMessage; onRemove: () => void }> = ({ message, onRemove }) => {
    const icons = {
        success: <CheckCircle size={20} className="text-green-500" />,
        error: <AlertCircle size={20} className="text-red-500" />,
        warning: <AlertTriangle size={20} className="text-yellow-500" />,
        info: <Info size={20} className="text-blue-500" />,
    };

    const bgColors = {
        success: 'bg-white border-green-100',
        error: 'bg-white border-red-100',
        warning: 'bg-white border-yellow-100',
        info: 'bg-white border-blue-100',
    };

    return (
        <div className={`pointer-events-auto w-80 max-w-full ${bgColors[message.type]} border shadow-lg rounded-lg p-4 flex items-start gap-3 transform transition-all duration-300 animate-slide-in`}>
            <div className="flex-shrink-0 mt-0.5">{icons[message.type]}</div>
            <div className="flex-1">
                {message.title && <h4 className="font-semibold text-gray-900 text-sm mb-1">{message.title}</h4>}
                <p className="text-gray-600 text-sm">{message.message}</p>
            </div>
            <button onClick={onRemove} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={16} />
            </button>
        </div>
    );
};
