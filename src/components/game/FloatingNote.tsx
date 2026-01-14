import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { StorytellerNote } from '../../types';

interface FloatingNoteProps {
    note: StorytellerNote;
    onUpdatePosition: (id: string, x: number, y: number) => void;
    onClose: (id: string) => void; // Stop floating (return to list)
    onColorChange: (id: string, color: string) => void;
    onToggleCollapse: (id: string) => void;
}

const COLORS = [
    { name: 'gray', class: 'bg-gray-100 border-gray-300', header: 'bg-gray-200' },
    { name: 'red', class: 'bg-red-50 border-red-200', header: 'bg-red-100' },
    { name: 'yellow', class: 'bg-yellow-50 border-yellow-200', header: 'bg-yellow-100' },
    { name: 'green', class: 'bg-green-50 border-green-200', header: 'bg-green-100' },
    { name: 'blue', class: 'bg-blue-50 border-blue-200', header: 'bg-blue-100' },
    { name: 'purple', class: 'bg-purple-50 border-purple-200', header: 'bg-purple-100' },
];

export const FloatingNote: React.FC<FloatingNoteProps> = ({
    note,
    onUpdatePosition,
    onClose,
    onColorChange,
    onToggleCollapse
}) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const noteRef = useRef<HTMLDivElement>(null);

    const currentColor = COLORS.find(c => c.name === note.color) || COLORS[0]!;

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;
            onUpdatePosition(note.id, newX, newY);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, note.id, onUpdatePosition]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if (noteRef.current) {
            const rect = noteRef.current.getBoundingClientRect();
            setDragOffset({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            });
            setIsDragging(true);
        }
    };

    return (
        <div
            ref={noteRef}
            style={{
                position: 'fixed',
                left: note.position?.x || 100,
                top: note.position?.y || 100,
                zIndex: 55, // Above most things, below modals if any
                width: note.isCollapsed ? '200px' : '280px',
            }}
            className={`rounded-lg shadow-xl border ${currentColor.class} overflow-hidden flex flex-col transition-colors duration-200`}
        >
            {/* Header / Drag Handle */}
            <div
                className={`${currentColor.header} p-2 flex items-center justify-between cursor-move select-none`}
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    {/* GripHorizontal */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                        <circle cx="9" cy="12" r="1" /><circle cx="9" cy="5" r="1" /><circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="12" r="1" /><circle cx="15" cy="5" r="1" /><circle cx="15" cy="19" r="1" />
                    </svg>
                    <span className="truncate max-w-[120px]">{note.type === 'auto' ? t('game.floatingNote.systemLog') : t('game.floatingNote.note')}</span>
                </div>
                <div className="flex items-center gap-1" onMouseDown={e => e.stopPropagation()}>
                    <button
                        onClick={() => setShowColorPicker(!showColorPicker)}
                        className="p-1 hover:bg-black/10 rounded"
                        title={t('game.floatingNote.changeColor')}
                    >
                        {/* Palette */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                            <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                            <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                            <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => onToggleCollapse(note.id)}
                        className="p-1 hover:bg-black/10 rounded"
                    >
                        {note.isCollapsed ? (
                            // Maximize2
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                            </svg>
                        ) : (
                            // Minus
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                        )}
                    </button>
                    <button
                        onClick={() => onClose(note.id)}
                        className="p-1 hover:bg-black/10 rounded text-red-500"
                        title={t('game.floatingNote.minimize')}
                    >
                        {/* X */}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Color Picker */}
            {showColorPicker && !note.isCollapsed && (
                <div className="p-2 bg-white border-b flex gap-1 justify-around">
                    {COLORS.map(c => (
                        <button
                            key={c.name}
                            className={`w-5 h-5 rounded-full border ${c.header} ${note.color === c.name ? 'ring-2 ring-offset-1 ring-gray-400' : ''}`}
                            onClick={() => {
                                onColorChange(note.id, c.name);
                                setShowColorPicker(false);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Content */}
            {!note.isCollapsed && (
                <div className="p-3 text-sm text-gray-800 whitespace-pre-wrap max-h-[300px] overflow-y-auto bg-white/50">
                    {note.content}
                    <div className="mt-2 text-xs text-gray-400 text-right">
                        {new Date(note.timestamp).toLocaleTimeString()}
                    </div>
                </div>
            )}
        </div>
    );
};




