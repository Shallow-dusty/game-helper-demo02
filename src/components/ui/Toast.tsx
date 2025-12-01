import React, { useEffect, useState } from 'react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string }> = {
    error: {
        bg: 'bg-red-950/95',
        border: 'border-red-700',
        icon: '❌',
        iconColor: 'text-red-400'
    },
    success: {
        bg: 'bg-green-950/95',
        border: 'border-green-700',
        icon: '✅',
        iconColor: 'text-green-400'
    },
    warning: {
        bg: 'bg-amber-950/95',
        border: 'border-amber-700',
        icon: '⚠️',
        iconColor: 'text-amber-400'
    },
    info: {
        bg: 'bg-blue-950/95',
        border: 'border-blue-700',
        icon: 'ℹ️',
        iconColor: 'text-blue-400'
    }
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 4000, onClose }) => {
    const [isExiting, setIsExiting] = useState(false);
    const styles = typeStyles[type];

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300);
    };

    return (
        <div
            className={`
                pointer-events-auto
                w-full max-w-sm
                glass-panel border-l-4
                rounded-r-lg shadow-2xl
                transition-all duration-300 ease-out transform
                ${styles.border}
                ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
            `}
        >
            <div className="flex items-start gap-3 p-4 relative overflow-hidden">
                {/* Background Glow */}
                <div className={`absolute -left-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20 ${styles.bg.replace('/95', '')}`} />

                <span className={`text-xl ${styles.iconColor} relative z-10`}>{styles.icon}</span>
                <div className="flex-1 min-w-0 relative z-10">
                    <p className="text-sm font-medium text-stone-200 leading-relaxed break-words font-serif">
                        {message}
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    className="text-stone-500 hover:text-stone-300 transition-colors text-lg leading-none relative z-10"
                >
                    ✕
                </button>
            </div>
            {/* Progress bar */}
            <div className="h-0.5 bg-stone-800/50 w-full">
                <div
                    className={`h-full ${type === 'error' ? 'bg-red-500' : type === 'success' ? 'bg-green-500' : type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{
                        animation: `shrink ${duration}ms linear forwards`
                    }}
                />
            </div>
            <style>{`
                @keyframes shrink {
                    from { width: 100%; }
                    to { width: 0%; }
                }
            `}</style>
        </div>
    );
};

// Toast Container and Manager
interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContainerProps {
    toasts: ToastItem[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </div>
    );
};

// Hook for using toasts
let toastIdCounter = 0;
const toastListeners = new Set<(toasts: ToastItem[]) => void>();
let toastList: ToastItem[] = [];

const notifyListeners = () => {
    toastListeners.forEach(listener => listener([...toastList]));
};

export const showToast = (message: string, type: ToastType = 'info') => {
    const id = `toast-${++toastIdCounter}`;
    toastList = [...toastList, { id, message, type }];
    notifyListeners();
    return id;
};

export const removeToast = (id: string) => {
    toastList = toastList.filter(t => t.id !== id);
    notifyListeners();
};

export const useToasts = () => {
    const [toasts, setToasts] = useState<ToastItem[]>(toastList);

    useEffect(() => {
        const listener = (newToasts: ToastItem[]) => setToasts(newToasts);
        toastListeners.add(listener);
        return () => { toastListeners.delete(listener); };
    }, []);

    return { toasts, removeToast };
};

// Convenience functions
export const showError = (message: string) => showToast(message, 'error');
export const showSuccess = (message: string) => showToast(message, 'success');
export const showWarning = (message: string) => showToast(message, 'warning');
export const showInfo = (message: string) => showToast(message, 'info');



