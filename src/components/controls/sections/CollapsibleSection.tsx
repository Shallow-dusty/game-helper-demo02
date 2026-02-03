import React from 'react';

interface CollapsibleSectionProps {
    title: React.ReactNode;
    isCollapsed: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

export const CollapsibleSection = React.memo<CollapsibleSectionProps>(({
    title,
    isCollapsed,
    onToggle,
    children,
}) => {
    return (
        <div className="bg-stone-900 rounded border border-stone-700">
            <button
                className="w-full p-3 flex justify-between items-center text-xs font-bold text-stone-500 uppercase cursor-pointer hover:bg-stone-800 hover:text-stone-400 transition-colors duration-200"
                onClick={onToggle}
                aria-expanded={!isCollapsed}
            >
                <span>{title}</span>
                <span className="text-stone-600 transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(0deg)' : 'rotate(180deg)' }}>{isCollapsed ? '▼' : '▲'}</span>
            </button>
            {!isCollapsed && children}
        </div>
    );
});
