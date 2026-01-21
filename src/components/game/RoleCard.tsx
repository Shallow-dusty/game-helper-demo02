import React from 'react';
import { useTranslation } from 'react-i18next';
import { RoleDef } from '../../types';
import { Icon } from '../ui/Icon';

interface RoleCardProps {
    role: RoleDef;
    isPlayerRole?: boolean;
    size?: 'small' | 'normal' | 'large';
    showDetails?: boolean;
}

const TEAM_COLORS: Record<string, string> = {
    TOWNSFOLK: 'blue',
    OUTSIDER: 'green',
    MINION: 'orange',
    DEMON: 'red',
    TRAVELER: 'purple',
    FABLED: 'yellow'
};

const ROLE_ICONS: Record<string, keyof typeof import('lucide-react')> = {
    fortune_teller: 'Eye',
    investigator: 'Search',
    monk: 'HandMetal',
    imp: 'Flame',
    default: 'Theater'
};

export const RoleCard: React.FC<RoleCardProps> = React.memo(({
    role,
    isPlayerRole = false,
    size = 'normal',
    showDetails = false
}) => {
    const { t } = useTranslation();
    const color = TEAM_COLORS[role.team] ?? 'stone';
    const teamName = t(`game.roleCard.teams.${role.team}`, { defaultValue: role.team });
    const iconName = ROLE_ICONS[role.id] || ROLE_ICONS.default;

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
            <div className={`relative ${sizeClasses.large} rounded-xl border-4 border-gothic-holy bg-gradient-to-br from-gothic-bg to-gothic-surface shadow-2xl animate-pulse-glow animate-float`}>
                {/* Hero Badge */}
                <div className="absolute -top-3 -right-3 bg-gothic-holy text-gothic-bg-dark px-3 py-1 rounded-full text-xs font-bold shadow-lg font-cinzel">
                    {t('game.roleCard.yourRole')}
                </div>

                {/* Role Icon/Name */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gothic-holy/20 rounded-full flex items-center justify-center border-2 border-gothic-holy/30">
                        <Icon icon={iconName} size="2xl" variant="holy" />
                    </div>
                    <div>
                        <h3 className={`${titleSizeClasses.large} font-bold text-gothic-holy font-cinzel`}>
                            {role.name}
                        </h3>
                        <span className={`text-xs uppercase tracking-wider text-gothic-holy/80`}>
                            {teamName}
                        </span>
                    </div>
                </div>

                {/* Ability */}
                <div className="space-y-3">
                    <div>
                        <h4 className="text-sm uppercase tracking-wider text-yellow-500/60 mb-2">{t('game.roleCard.ability')}</h4>
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
                    {(role.firstNight === true || role.otherNight === true) && (
                        <div className="flex gap-4 pt-3 border-t border-yellow-500/30">
                            {role.firstNight && (
                                <div className="text-sm">
                                    <span className="text-yellow-500/70">{t('game.roleCard.firstNight')}: </span>
                                    <span className="text-stone-300">{t('common.yes')}</span>
                                </div>
                            )}
                            {role.otherNight && (
                                <div className="text-sm">
                                    <span className="text-yellow-500/70">{t('game.roleCard.otherNight')}: </span>
                                    <span className="text-stone-300">{t('common.yes')}</span>
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

    const hoverShadowClasses = {
        blue: 'hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:border-blue-400',
        green: 'hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:border-green-400',
        orange: 'hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:border-orange-400',
        red: 'hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:border-red-400',
        purple: 'hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:border-purple-400',
        stone: 'hover:shadow-[0_0_20px_rgba(120,113,108,0.4)] hover:border-stone-400'
    };

    return (
        <div className={`${sizeClasses[size]} rounded-lg border-2 ${cardClasses[color as keyof typeof cardClasses] || cardClasses.stone} ${hoverShadowClasses[color as keyof typeof hoverShadowClasses] || hoverShadowClasses.stone} bg-stone-900 hover:bg-stone-800 transition-all duration-300 hover:scale-105 cursor-pointer h-full flex flex-col`}>
            {/* Role Name */}
            <div className="flex items-center justify-between mb-2">
                <h4 className={`${titleSizeClasses[size]} font-bold ${titleClasses[color as keyof typeof titleClasses] || titleClasses.stone} font-cinzel ${role.name.length > 4 ? 'text-[10px]' : ''}`}>
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
            {(role.firstNight === true || role.otherNight === true) && (
                <div className="flex gap-3 text-xs text-stone-500 pt-2 border-t border-stone-700 mt-auto">
                    {role.firstNight && <span>{t('game.roleCard.firstNight')}: {t('common.yes')}</span>}
                    {role.otherNight && <span>{t('game.roleCard.other')}: {t('common.yes')}</span>}
                </div>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    // Custom equality check for memoization
    return prevProps.role.id === nextProps.role.id &&
        prevProps.isPlayerRole === nextProps.isPlayerRole &&
        prevProps.size === nextProps.size &&
        prevProps.showDetails === nextProps.showDetails;
});




