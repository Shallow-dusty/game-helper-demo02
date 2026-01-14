import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    isDangerous?: boolean; // If true, confirm button is red
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    isDangerous = false
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-scale-in">
                {/* Header */}
                <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                    <h2 className="text-xl font-bold text-stone-200 font-cinzel flex items-center gap-2">
                        <span>⚠️</span> {title}
                    </h2>
                    <button onClick={onCancel} className="text-stone-500 hover:text-stone-300 transition-colors">
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <p className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {message}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-stone-800 bg-stone-950/50 flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition-colors text-sm font-bold"
                    >
                        {cancelText || t('ui.confirmModal.defaultCancel')}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded text-white shadow-lg transition-all transform active:scale-95 text-sm font-bold flex items-center gap-2 ${isDangerous
                            ? 'bg-red-700 hover:bg-red-600 border border-red-600'
                            : 'bg-amber-700 hover:bg-amber-600 border border-amber-600'
                            }`}
                    >
                        {isDangerous && <span>🗑️</span>}
                        {confirmText || t('ui.confirmModal.defaultConfirm')}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};



