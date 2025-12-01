import React, { useState } from 'react';
import { InfoCard as InfoCardType } from '../../types';

interface InfoCardProps {
    card: InfoCardType;
}

const CARD_COLORS = {
    role_info: 'blue',
    ability: 'purple',
    hint: 'amber',
    custom: 'stone'
};

// Tailwind 需要完整类名才能正确编译
const COLOR_CLASSES = {
    blue: {
        border: 'border-blue-700',
        bg: 'bg-blue-950/30',
        headerBg: 'bg-blue-900/50',
        headerHover: 'hover:bg-blue-900/70',
        title: 'text-blue-200',
        content: 'text-blue-100',
        button: 'text-blue-400',
        badge: 'text-blue-500'
    },
    purple: {
        border: 'border-purple-700',
        bg: 'bg-purple-950/30',
        headerBg: 'bg-purple-900/50',
        headerHover: 'hover:bg-purple-900/70',
        title: 'text-purple-200',
        content: 'text-purple-100',
        button: 'text-purple-400',
        badge: 'text-purple-500'
    },
    amber: {
        border: 'border-amber-700',
        bg: 'bg-amber-950/30',
        headerBg: 'bg-amber-900/50',
        headerHover: 'hover:bg-amber-900/70',
        title: 'text-amber-200',
        content: 'text-amber-100',
        button: 'text-amber-400',
        badge: 'text-amber-500'
    },
    stone: {
        border: 'border-stone-700',
        bg: 'bg-stone-950/30',
        headerBg: 'bg-stone-900/50',
        headerHover: 'hover:bg-stone-900/70',
        title: 'text-stone-200',
        content: 'text-stone-100',
        button: 'text-stone-400',
        badge: 'text-stone-500'
    },
    indigo: {
        border: 'border-indigo-700',
        bg: 'bg-indigo-950/30',
        headerBg: 'bg-indigo-900/50',
        headerHover: 'hover:bg-indigo-900/70',
        title: 'text-indigo-200',
        content: 'text-indigo-100',
        button: 'text-indigo-400',
        badge: 'text-indigo-500'
    },
    red: {
        border: 'border-red-700',
        bg: 'bg-red-950/30',
        headerBg: 'bg-red-900/50',
        headerHover: 'hover:bg-red-900/70',
        title: 'text-red-200',
        content: 'text-red-100',
        button: 'text-red-400',
        badge: 'text-red-500'
    },
    green: {
        border: 'border-green-700',
        bg: 'bg-green-950/30',
        headerBg: 'bg-green-900/50',
        headerHover: 'hover:bg-green-900/70',
        title: 'text-green-200',
        content: 'text-green-100',
        button: 'text-green-400',
        badge: 'text-green-500'
    }
};

export const InfoCard: React.FC<InfoCardProps> = ({ card }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const colorKey = (card.color || CARD_COLORS[card.type]) as keyof typeof COLOR_CLASSES;
    const colors = COLOR_CLASSES[colorKey] || COLOR_CLASSES.stone;
    const isLongContent = card.content.length > 150;

    return (
        <div className={`border-2 ${colors.border} ${colors.bg} rounded-lg overflow-hidden my-2 shadow-lg`}>
            {/* Header */}
            <div
                className={`${colors.headerBg} p-3 flex items-center justify-between cursor-pointer ${colors.headerHover} transition-colors`}
                onClick={() => isLongContent && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {card.icon && <span className="text-2xl">{card.icon}</span>}
                    <h4 className={`font-bold ${colors.title} font-cinzel`}>{card.title}</h4>
                </div>
                {isLongContent && (
                    <button className={`${colors.button} text-xs`}>
                        {isExpanded ? '▼' : '▶'}
                    </button>
                )}
            </div>

            {/* Content */}
            {(isExpanded || !isLongContent) && (
                <div className={`p-4 text-sm ${colors.content} leading-relaxed whitespace-pre-wrap`}>
                    {card.content}
                </div>
            )}

            {/* Type Badge */}
            <div className={`px-3 pb-2 flex justify-end`}>
                <span className={`text-[10px] ${colors.badge} uppercase tracking-wider`}>
                    {card.type === 'role_info' && '角色信息'}
                    {card.type === 'ability' && '能力提示'}
                    {card.type === 'hint' && '游戏提示'}
                    {card.type === 'custom' && '自定义'}
                </span>
            </div>
        </div>
    );
};



