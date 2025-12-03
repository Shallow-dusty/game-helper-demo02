import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ToastType = 'error' | 'success' | 'warning' | 'info';
export type ToastStyle = 'default' | 'parchment'; // 新增样式变体

interface ToastProps {
    message: string;
    type?: ToastType;
    style?: ToastStyle;
    duration?: number;
    onClose: () => void;
}

// 火漆印章颜色映射
const sealColors: Record<ToastType, string> = {
    error: '#991b1b',     // 红色 - 死亡/攻击
    success: '#166534',   // 绿色 - 成功
    warning: '#b45309',   // 琥珀色 - 警告
    info: '#1e40af',      // 蓝色 - 信息
};

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string; iconColor: string; sealIcon: string }> = {
    error: {
        bg: 'bg-red-950/95',
        border: 'border-red-700',
        icon: '❌',
        iconColor: 'text-red-400',
        sealIcon: '☠️'
    },
    success: {
        bg: 'bg-green-950/95',
        border: 'border-green-700',
        icon: '✅',
        iconColor: 'text-green-400',
        sealIcon: '✓'
    },
    warning: {
        bg: 'bg-amber-950/95',
        border: 'border-amber-700',
        icon: '⚠️',
        iconColor: 'text-amber-400',
        sealIcon: '⚠'
    },
    info: {
        bg: 'bg-blue-950/95',
        border: 'border-blue-700',
        icon: 'ℹ️',
        iconColor: 'text-blue-400',
        sealIcon: '📜'
    }
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', style = 'default', duration = 4000, onClose }) => {
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

    // 羊皮卷风格
    if (style === 'parchment') {
        return (
            <motion.div
                initial={{ opacity: 0, height: 0, scaleY: 0.3, originY: 0 }}
                animate={{ 
                    opacity: 1, 
                    height: 'auto', 
                    scaleY: 1,
                    transition: {
                        height: { duration: 0.3, ease: 'easeOut' },
                        scaleY: { duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }, // 弹性展开
                        opacity: { duration: 0.2 }
                    }
                }}
                exit={{ 
                    opacity: 0, 
                    height: 0,
                    scaleY: 0.3,
                    transition: { duration: 0.25, ease: 'easeIn' }
                }}
                className={`
                    pointer-events-auto
                    w-full max-w-sm
                    relative
                    ${isExiting ? 'opacity-0' : 'opacity-100'}
                `}
            >
                {/* 羊皮纸背景 */}
                <div className={`
                    relative overflow-hidden
                    bg-gradient-to-br from-amber-100 via-amber-50 to-yellow-100
                    border border-amber-300/50
                    rounded-sm
                    shadow-[0_4px_20px_rgba(0,0,0,0.3),inset_0_0_30px_rgba(139,69,19,0.1)]
                    ${type === 'error' ? 'parchment-burn' : ''}
                `}>
                    {/* 羊皮纸纹理覆盖层 */}
                    <div className="absolute inset-0 opacity-30 pointer-events-none"
                         style={{
                             backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                         }}
                    />
                    
                    {/* 烧焦边缘效果（仅错误类型 - 增强版） */}
                    {type === 'error' && (
                        <>
                            <div className="absolute inset-0 pointer-events-none"
                                 style={{
                                     background: `
                                         radial-gradient(ellipse at 100% 0%, rgba(80,30,0,0.5) 0%, transparent 40%),
                                         radial-gradient(ellipse at 0% 100%, rgba(80,30,0,0.4) 0%, transparent 40%),
                                         radial-gradient(ellipse at 100% 100%, rgba(60,20,0,0.3) 0%, transparent 35%),
                                         radial-gradient(ellipse at 50% 0%, rgba(100,40,0,0.2) 0%, transparent 30%)
                                     `
                                 }}
                            />
                            {/* 燃烧火焰粒子 */}
                            <div className="absolute top-0 right-0 w-6 h-6 burn-ember" />
                            <div className="absolute bottom-0 left-2 w-4 h-4 burn-ember delay-100" />
                            <div className="absolute top-1 right-4 w-3 h-3 burn-ember delay-200" />
                        </>
                    )}
                    
                    {/* 卷轴展开线效果 */}
                    <motion.div 
                        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-600/40 to-transparent"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.1, duration: 0.3 }}
                    />
                    
                    <div className="flex items-start gap-4 p-4 relative">
                        {/* 火漆印章 */}
                        <motion.div 
                            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                                       shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_-2px_4px_rgba(0,0,0,0.2)]"
                            style={{ 
                                backgroundColor: sealColors[type],
                                backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2) 0%, transparent 50%)'
                            }}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.15, duration: 0.4, type: 'spring', stiffness: 200 }}
                        >
                            <span className="text-white text-lg font-bold drop-shadow-sm">
                                {styles.sealIcon}
                            </span>
                        </motion.div>
                        
                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-stone-800 leading-relaxed break-words"
                               style={{ fontFamily: 'Cinzel, serif' }}>
                                {message}
                            </p>
                        </div>
                        
                        {/* 关闭按钮 */}
                        <button
                            onClick={handleClose}
                            className="text-stone-500 hover:text-stone-700 transition-colors text-lg leading-none"
                        >
                            ✕
                        </button>
                    </div>
                    
                    {/* 进度条 - 墨水风格 */}
                    <div className="h-0.5 bg-amber-200/50 w-full">
                        <div
                            className="h-full"
                            style={{
                                backgroundColor: sealColors[type],
                                animation: `shrink ${duration}ms linear forwards`
                            }}
                        />
                    </div>
                </div>
                
                {/* 卷轴卷曲阴影 */}
                <div className="absolute -bottom-1 left-2 right-2 h-2 bg-gradient-to-b from-amber-900/20 to-transparent rounded-b-full" />
                
                {/* 燃烧效果 CSS */}
                <style>{`
                    .parchment-burn {
                        animation: burn-edge 2s ease-in-out infinite alternate;
                    }
                    @keyframes burn-edge {
                        0% { box-shadow: inset 0 0 30px rgba(139,69,19,0.1), 0 0 8px rgba(255,100,0,0.3); }
                        100% { box-shadow: inset 0 0 30px rgba(139,69,19,0.2), 0 0 15px rgba(255,100,0,0.5); }
                    }
                    .burn-ember {
                        background: radial-gradient(circle, rgba(255,150,50,0.8) 0%, rgba(255,100,0,0.4) 50%, transparent 70%);
                        border-radius: 50%;
                        animation: ember-flicker 0.8s ease-in-out infinite alternate;
                    }
                    .burn-ember.delay-100 { animation-delay: 0.1s; }
                    .burn-ember.delay-200 { animation-delay: 0.2s; }
                    @keyframes ember-flicker {
                        0% { opacity: 0.6; transform: scale(0.8); }
                        100% { opacity: 1; transform: scale(1.2); }
                    }
                `}</style>
            </motion.div>
        );
    }

    // 默认风格（保持原有逻辑）

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
    style?: ToastStyle;
}

interface ToastContainerProps {
    toasts: ToastItem[];
    onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        style={toast.style}
                        onClose={() => onRemove(toast.id)}
                    />
                ))}
            </AnimatePresence>
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

export const showToast = (message: string, type: ToastType = 'info', style: ToastStyle = 'default') => {
    const id = `toast-${++toastIdCounter}`;
    toastList = [...toastList, { id, message, type, style }];
    notifyListeners();
    return id;
};

// 新增：羊皮卷风格通知
export const showParchmentToast = (message: string, type: ToastType = 'info') => {
    return showToast(message, type, 'parchment');
};

// 新增：皇室谕令通知（羊皮卷 + 特定图标）
export const showRoyalDecree = (message: string, type: ToastType = 'info') => {
    return showToast(`📜 ${message}`, type, 'parchment');
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



