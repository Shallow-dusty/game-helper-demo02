import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RoleDef } from '../../types';
import { RoleCard } from '../game/RoleCard';
import { Z_INDEX } from '../../constants';

interface RoleReferenceSidebarProps {
    isExpanded: boolean;
    onToggle: () => void;
    playerRoleId: string | null;
    scriptRoles: RoleDef[];
}

// 阵营配置
const TEAM_CONFIG = {
    TOWNSFOLK: { label: 'controls.roleReference.teamTownsfolk', color: 'blue' },
    OUTSIDER: { label: 'controls.roleReference.teamOutsider', color: 'green' },
    MINION: { label: 'controls.roleReference.teamMinion', color: 'orange' },
    DEMON: { label: 'controls.roleReference.teamDemon', color: 'red' }
} as const;

type TeamType = keyof typeof TEAM_CONFIG;

export const RoleReferenceSidebar: React.FC<RoleReferenceSidebarProps> = ({
    isExpanded,
    onToggle,
    playerRoleId,
    scriptRoles
}) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedTeams, setCollapsedTeams] = useState<Record<TeamType, boolean>>({
        TOWNSFOLK: false,
        OUTSIDER: false,
        MINION: false,
        DEMON: false
    });

    const playerRole = scriptRoles.find(r => r.id === playerRoleId);

    // 切换阵营折叠状态
    const toggleTeamCollapse = (team: TeamType) => {
        setCollapsedTeams(prev => ({ ...prev, [team]: !prev[team] }));
    };

    // 搜索过滤
    const filteredRolesByTeam = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        const filterFn = (role: RoleDef) => {
            if (!query) return true;
            return (
                role.name.toLowerCase().includes(query) ||
                role.ability.toLowerCase().includes(query) ||
                role.id.toLowerCase().includes(query)
            );
        };

        return {
            TOWNSFOLK: scriptRoles.filter(r => r.team === 'TOWNSFOLK' && filterFn(r)),
            OUTSIDER: scriptRoles.filter(r => r.team === 'OUTSIDER' && filterFn(r)),
            MINION: scriptRoles.filter(r => r.team === 'MINION' && filterFn(r)),
            DEMON: scriptRoles.filter(r => r.team === 'DEMON' && filterFn(r))
        };
    }, [scriptRoles, searchQuery]);

    // 检查角色是否匹配搜索（用于高亮）
    const isRoleMatched = (role: RoleDef) => {
        if (!searchQuery.trim()) return false;
        const query = searchQuery.toLowerCase().trim();
        return (
            role.name.toLowerCase().includes(query) ||
            role.ability.toLowerCase().includes(query)
        );
    };

    // 渲染阵营区块
    const renderTeamSection = (team: TeamType) => {
        const roles = filteredRolesByTeam[team].filter(r => r.id !== playerRoleId);
        if (roles.length === 0) return null;

        const config = TEAM_CONFIG[team];
        const isCollapsed = collapsedTeams[team];
        const colorClass = {
            blue: 'text-blue-400 border-blue-900 hover:bg-blue-950/30',
            green: 'text-green-400 border-green-900 hover:bg-green-950/30',
            orange: 'text-orange-400 border-orange-900 hover:bg-orange-950/30',
            red: 'text-red-400 border-red-900 hover:bg-red-950/30'
        }[config.color];

        return (
            <div key={team}>
                {/* 可折叠的阵营标题 */}
                <button
                    onClick={() => toggleTeamCollapse(team)}
                    className={`w-full flex items-center justify-between text-sm font-bold ${colorClass} mb-2 font-cinzel border-b pb-1 px-1 py-0.5 rounded-t transition-colors`}
                >
                    <span>{t(config.label)} ({roles.length})</span>
                    <span className="text-xs transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </button>

                {/* 角色列表（可折叠） */}
                <div className={`space-y-2 transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-[2000px] opacity-100 mb-4'}`}>
                    {roles.map(role => (
                        <div
                            key={role.id}
                            className={`relative ${isRoleMatched(role) ? 'ring-2 ring-amber-500 ring-offset-1 ring-offset-stone-900 rounded' : ''}`}
                        >
                            <RoleCard
                                role={role}
                                size="small"
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <>
            {/* Toggle Button (Always Visible) */}
            <button
                onClick={onToggle}
                className={`fixed top-1/2 -translate-y-1/2 bg-amber-900 hover:bg-amber-800 text-amber-200 p-3 rounded-l-lg shadow-lg transition-all ${isExpanded ? 'right-[320px]' : 'right-0'}`}
                style={{ zIndex: Z_INDEX.sidebar }}
                title={isExpanded ? t('controls.roleReference.collapseSidebar') : t('controls.roleReference.expandSidebar')}
            >
                <span className="text-xl">
                    {isExpanded ? '📖▶' : '◀📖'}
                </span>
            </button>

            {/* Sidebar Panel */}
            <div
                className={`fixed right-0 top-0 h-screen w-[320px] bg-stone-900 border-l border-stone-700 shadow-2xl transform transition-transform duration-300 ${isExpanded ? 'translate-x-0' : 'translate-x-full'} flex flex-col font-serif`}
                style={{ zIndex: Z_INDEX.sidebar }}
            >

                {/* Header */}
                <div className="p-4 border-b border-stone-800 bg-stone-950">
                    <h3 className="text-lg font-bold text-amber-400 font-cinzel">
                        📖 {t('controls.roleReference.title')}
                    </h3>
                </div>

                {/* 搜索栏 */}
                <div className="p-3 border-b border-stone-800 bg-stone-900/50">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t('controls.roleReference.searchRoles')}
                            className="w-full px-3 py-2 pl-8 bg-stone-800 border border-stone-700 rounded text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-600 text-sm"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500 text-xs">🔍</span>
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 text-sm"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">

                    {/* Player's Role (Sticky at top) */}
                    {playerRole && (
                        <div className="sticky top-0 bg-stone-900 pb-3 z-10">
                            <RoleCard
                                role={playerRole}
                                isPlayerRole={true}
                                size="normal"
                            />
                        </div>
                    )}

                    {/* Divider */}
                    {playerRole && (
                        <div className="border-t border-stone-700 pt-3">
                            <p className="text-xs text-stone-500 mb-3 text-center">
                                {t('controls.roleReference.allRoles')} {searchQuery && t('controls.roleReference.searchingFor', { query: searchQuery })}
                            </p>
                        </div>
                    )}

                    {/* All Roles by Team */}
                    <div className="space-y-2">
                        {renderTeamSection('TOWNSFOLK')}
                        {renderTeamSection('OUTSIDER')}
                        {renderTeamSection('MINION')}
                        {renderTeamSection('DEMON')}
                    </div>

                    {/* 搜索无结果提示 */}
                    {searchQuery && Object.values(filteredRolesByTeam).every(roles => roles.filter(r => r.id !== playerRoleId).length === 0) && (
                        <div className="text-center py-8 text-stone-500">
                            <span className="text-2xl mb-2 block">🔍</span>
                            <p className="text-sm">{t('controls.roleReference.noMatchingRoles')}</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};
