import React from 'react';

interface CollapsibleSectionProps {
    title: string;
    isCollapsed: boolean;
    onToggle: () => void;
    children: React.ReactNode;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    isCollapsed,
    onToggle,
    children,
}) => {
    return (
        <div className="bg-stone-900 rounded border border-stone-700">
            <button
                className="w-full p-3 flex justify-between items-center text-xs font-bold text-stone-500 uppercase"
                onClick={onToggle}
            >
                <span>{title}</span>
                <span className="text-stone-600">{isCollapsed ? '▼' : '▲'}</span>
            </button>
            {!isCollapsed && children}
        </div>
    );
};
