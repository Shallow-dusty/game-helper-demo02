import React, { useState } from 'react';
import { InfoCard as InfoCardType } from '../types';

interface InfoCardProps {
    card: InfoCardType;
}

const CARD_COLORS = {
    role_info: 'blue',
    ability: 'purple',
    hint: 'amber',
    custom: 'stone'
};

export const InfoCard: React.FC<InfoCardProps> = ({ card }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const colorPrefix = card.color || CARD_COLORS[card.type];
    const isLongContent = card.content.length > 150;

    return (
        <div className={`border-2 border-${colorPrefix}-700 bg-${colorPrefix}-950/30 rounded-lg overflow-hidden my-2 shadow-lg`}>
            {/* Header */}
            <div
                className={`bg-${colorPrefix}-900/50 p-3 flex items-center justify-between cursor-pointer hover:bg-${colorPrefix}-900/70 transition-colors`}
                onClick={() => isLongContent && setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-2">
                    {card.icon && <span className="text-2xl">{card.icon}</span>}
                    <h4 className={`font-bold text-${colorPrefix}-200 font-cinzel`}>{card.title}</h4>
                </div>
                {isLongContent && (
                    <button className={`text-${colorPrefix}-400 text-xs`}>
                        {isExpanded ? '▼' : '▶'}
                    </button>
                )}
            </div>

            {/* Content */}
            {(isExpanded || !isLongContent) && (
                <div className={`p-4 text-sm text-${colorPrefix}-100 leading-relaxed whitespace-pre-wrap`}>
                    {card.content}
                </div>
            )}

            {/* Type Badge */}
            <div className={`px-3 pb-2 flex justify-end`}>
                <span className={`text-[10px] text-${colorPrefix}-500 uppercase tracking-wider`}>
                    {card.type === 'role_info' && '角色信息'}
                    {card.type === 'ability' && '能力提示'}
                    {card.type === 'hint' && '游戏提示'}
                    {card.type === 'custom' && '自定义'}
                </span>
            </div>
        </div>
    );
};
