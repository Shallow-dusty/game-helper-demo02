import React from 'react';
import { RoleDef } from '../types';

interface RoleCardProps {
    role: RoleDef;
    isPlayerRole?: boolean;
    size?: 'small' | 'normal' | 'large';
    showDetails?: boolean;
}

const TEAM_COLORS = {
    TOWNSFOLK: 'blue',
    OUTSIDER: 'green',
    MINION: 'orange',
    DEMON: 'red',
    TRAVELER: 'purple'
};

const TEAM_NAMES = {
    TOWNSFOLK: '镇民',
    OUTSIDER: '外来者',
    MINION: '爪牙',
    DEMON: '恶魔',
    TRAVELER: '旅行者'
};

export const RoleCard: React.FC<RoleCardProps> = ({
    role,
    isPlayerRole = false,
    size = 'normal',
    showDetails = false
}) => {
    const color = TEAM_COLORS[role.team] || 'stone';
    const teamName = TEAM_NAMES[role.team] || role.team;

    // Size classes
    const sizeClasses = {
        small: 'p-3 text-sm',
        normal: 'p-4 text-base',
        large: 'p-6 text-lg'
    };

    const titleSizeClasses = {
        small: 'text-lg',
        normal: 'text-xl',
        large: 'text-3xl'
    };

    if (isPlayerRole) {
        return (
            <div className={`relative ${sizeClasses.large} rounded-xl border-4 border-yellow-500 bg-gradient-to-br from-stone-950 to-stone-900 shadow-2xl animate-pulse-glow`}>
                {/* Hero Badge */}
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-stone-950 px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                    你的角色
                </div>

                {/* Role Icon/Name */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center text-3xl">
                        {role.id === 'fortune_teller' && '🔮'}
                        {role.id === 'investigator' && '🔍'}
                        {role.id === 'monk' && '🙏'}
                        {role.id === 'imp' && '👹'}
                        {!['fortune_teller', 'investigator', 'monk', 'imp'].includes(role.id) && '🎭'}
                    </div>
                    <div>
                        <h3 className={`${titleSizeClasses.large} font-bold text-yellow-400 font-cinzel`}>
                            {role.name}
                        </h3>
                        <span className={`text-xs uppercase tracking-wider text-yellow-500/80`}>
                            {teamName}
                        </span>
                    </div>
                </div>

                {/* Ability */}
                <div className="space-y-3">
                    <div>
                        <h4 className="text-sm uppercase tracking-wider text-yellow-500/60 mb-2">角色能力</h4>
                        <p className="text-lg text-stone-200 leading-relaxed font-medium">
                            {role.ability}
                        </p>
                    </div>

                    {/* Detailed Description */}
                    {showDetails && role.detailedDescription && (
                        <div className="pt-3 border-t border-yellow-500/30">
                            <div className="text-sm text-stone-300 leading-relaxed space-y-2"
                                dangerouslySetInnerHTML={{
                                    __html: role.detailedDescription
                                        .split('\n').join('<br/>')
                                        .replace(/\*\*(.+?)\*\*/g, '<strong class="text-yellow-400">$1</strong>')
                                }}
                            />
                        </div>
                    )}

                    {/* Night Order */}
                    {(role.firstNight || role.otherNight) && (
                        <div className="flex gap-4 pt-3 border-t border-yellow-500/30">
                            {role.firstNight && (
                                <div className="text-sm">
                                    <span className="text-yellow-500/70">首夜: </span>
                                    <span className="text-stone-300">{role.firstNight}</span>
                                </div>
                            )}
                            {role.otherNight && (
                                <div className="text-sm">
                                    <span className="text-yellow-500/70">其他夜晚: </span>
                                    <span className="text-stone-300">{role.otherNight}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Normal role card
    const cardClasses = {
        blue: 'border-blue-500',
        green: 'border-green-500',
        orange: 'border-orange-500',
        red: 'border-red-500',
        purple: 'border-purple-500',
        stone: 'border-stone-500'
    };

    const titleClasses = {
        blue: 'text-blue-300',
        green: 'text-green-300',
        orange: 'text-orange-300',
        red: 'text-red-300',
        purple: 'text-purple-300',
        stone: 'text-stone-300'
    };

    const badgeTextClasses = {
        blue: 'text-blue-500/60 bg-blue-950/30',
        green: 'text-green-500/60 bg-green-950/30',
        orange: 'text-orange-500/60 bg-orange-950/30',
        red: 'text-red-500/60 bg-red-950/30',
        purple: 'text-purple-500/60 bg-purple-950/30',
        stone: 'text-stone-500/60 bg-stone-950/30'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-lg border-2 ${cardClasses[color as keyof typeof cardClasses] || cardClasses.stone} bg-stone-900 hover:bg-stone-800 transition-all hover:scale-105 hover:shadow-lg cursor-pointer h-full flex flex-col`}>
            {/* Role Name */}
            <div className="flex items-center justify-between mb-2">
                <h4 className={`${titleSizeClasses[size]} font-bold ${titleClasses[color as keyof typeof titleClasses] || titleClasses.stone} font-cinzel`}>
                    {role.name}
                </h4>
                <span className={`text-[10px] uppercase tracking-wider ${badgeTextClasses[color as keyof typeof badgeTextClasses] || badgeTextClasses.stone} px-2 py-0.5 rounded`}>
                    {teamName}
                </span>
            </div>

            {/* Ability */}
            <p className="text-sm text-stone-300 leading-relaxed mb-2 flex-grow">
                {role.ability}
            </p>

            {/* Detailed Description */}
            {showDetails && role.detailedDescription && (
                <div className="pt-2 mt-2 border-t border-stone-700/50">
                    <div className="text-xs text-stone-400 leading-relaxed space-y-1"
                        dangerouslySetInnerHTML={{
                            __html: role.detailedDescription
                                .split('\n').join('<br/>')
                                .replace(/\*\*(.+?)\*\*/g, '<strong class="text-stone-200">$1</strong>')
                        }}
                    />
                </div>
            )}

            {/* Night Order (compact) */}
            {(role.firstNight || role.otherNight) && (
                <div className="flex gap-3 text-xs text-stone-500 pt-2 border-t border-stone-700 mt-auto">
                    {role.firstNight && <span>首夜: {role.firstNight}</span>}
                    {role.otherNight && <span>其他: {role.otherNight}</span>}
                </div>
            )}
        </div>
    );
};
