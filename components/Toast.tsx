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
    const [isVisible, setIsVisible] = useState(true);
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
                fixed top-20 left-1/2 -translate-x-1/2 z-[100]
                min-w-[300px] max-w-[90vw] md:max-w-[500px]
                ${styles.bg} ${styles.border} border
                rounded-lg shadow-2xl backdrop-blur-sm
                transition-all duration-300 ease-out
                ${isExiting ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}
            `}
        >
            <div className="flex items-start gap-3 p-4">
                <span className={`text-xl ${styles.iconColor}`}>{styles.icon}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-200 leading-relaxed break-words">
                        {message}
                    </p>
                </div>
                <button
                    onClick={handleClose}
                    className="text-stone-500 hover:text-stone-300 transition-colors text-lg leading-none"
                >
                    ✕
                </button>
            </div>
            {/* Progress bar */}
            <div className="h-1 bg-stone-800 rounded-b-lg overflow-hidden">
                <div
                    className={`h-full ${type === 'error' ? 'bg-red-600' : type === 'success' ? 'bg-green-600' : type === 'warning' ? 'bg-amber-600' : 'bg-blue-600'}`}
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
        <>
            {toasts.map((toast, index) => (
                <div
                    key={toast.id}
                    style={{ top: `${80 + index * 80}px` }}
                    className="fixed left-1/2 -translate-x-1/2 z-[100]"
                >
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => onRemove(toast.id)}
                    />
                </div>
            ))}
        </>
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
