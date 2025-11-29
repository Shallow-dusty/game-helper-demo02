import React, { useState, useMemo } from 'react';
import { RoleDef } from '../types';
import { RoleCard } from './RoleCard';
import { Z_INDEX } from '../constants';

interface RoleReferencePanelProps {
    isOpen: boolean;
    onClose: () => void;
    playerRoleId: string | null;
    scriptRoles: RoleDef[];
}

// 阵营配置
const TEAM_CONFIG = {
    TOWNSFOLK: { label: '🏘️ 镇民 (Townsfolk)', color: 'blue' },
    OUTSIDER: { label: '🌿 外来者 (Outsider)', color: 'green' },
    MINION: { label: '👿 爪牙 (Minion)', color: 'orange' },
    DEMON: { label: '👹 恶魔 (Demon)', color: 'red' },
    TRAVELER: { label: '🎒 旅行者 (Traveler)', color: 'purple' }
} as const;

type TeamType = keyof typeof TEAM_CONFIG;

export const RoleReferencePanel: React.FC<RoleReferencePanelProps> = ({
    isOpen,
    onClose,
    playerRoleId,
    scriptRoles
}) => {
    const [descriptionMode, setDescriptionMode] = useState<'simple' | 'detailed'>('simple');
    const [activeTab, setActiveTab] = useState<'roles' | 'rules'>('roles');
    const [searchQuery, setSearchQuery] = useState('');
    const [collapsedTeams, setCollapsedTeams] = useState<Record<TeamType, boolean>>({
        TOWNSFOLK: false,
        OUTSIDER: false,
        MINION: false,
        DEMON: false,
        TRAVELER: false
    });

    const playerRole = scriptRoles.find(r => r.id === playerRoleId);

    // 切换阵营折叠状态
    const toggleTeamCollapse = (team: TeamType) => {
        setCollapsedTeams(prev => ({ ...prev, [team]: !prev[team] }));
    };

    // 展开/折叠所有阵营
    const toggleAllTeams = (collapse: boolean) => {
        setCollapsedTeams({
            TOWNSFOLK: collapse,
            OUTSIDER: collapse,
            MINION: collapse,
            DEMON: collapse,
            TRAVELER: collapse
        });
    };

    // 搜索过滤和高亮
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
            DEMON: scriptRoles.filter(r => r.team === 'DEMON' && filterFn(r)),
            TRAVELER: scriptRoles.filter(r => r.team === 'TRAVELER' && filterFn(r))
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

    // 统计搜索结果数量
    const totalMatchedCount = useMemo(() => {
        return Object.values(filteredRolesByTeam).reduce((sum, roles) => sum + roles.length, 0);
    }, [filteredRolesByTeam]);

    // 早期返回必须放在所有 hooks 之后
    if (!isOpen) return null;

    // 渲染阵营区块
    const renderTeamSection = (team: TeamType) => {
        const roles = filteredRolesByTeam[team];
        if (roles.length === 0) return null;

        const config = TEAM_CONFIG[team];
        const isCollapsed = collapsedTeams[team];
        const colorClass = {
            blue: { header: 'text-blue-400 border-blue-900', bg: 'hover:bg-blue-950/30' },
            green: { header: 'text-green-400 border-green-900', bg: 'hover:bg-green-950/30' },
            orange: { header: 'text-orange-400 border-orange-900', bg: 'hover:bg-orange-950/30' },
            red: { header: 'text-red-400 border-red-900', bg: 'hover:bg-red-950/30' },
            purple: { header: 'text-purple-400 border-purple-900', bg: 'hover:bg-purple-950/30' }
        }[config.color];

        return (
            <div key={team}>
                {/* 可折叠的阵营标题 */}
                <button
                    onClick={() => toggleTeamCollapse(team)}
                    className={`w-full flex items-center justify-between text-xl font-bold ${colorClass.header} mb-3 font-cinzel border-b pb-2 ${colorClass.bg} px-2 py-1 rounded-t transition-colors`}
                >
                    <span>{config.label} ({roles.length})</span>
                    <span className="text-sm transition-transform duration-200" style={{ transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>
                        ▼
                    </span>
                </button>

                {/* 角色网格（可折叠） */}
                <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 transition-all duration-300 overflow-hidden ${isCollapsed ? 'max-h-0 opacity-0 mb-0' : 'max-h-[5000px] opacity-100 mb-8'}`}>
                    {roles.map(role => (
                        <div
                            key={role.id}
                            className={`relative ${isRoleMatched(role) ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-stone-900 rounded-lg' : ''}`}
                        >
                            {/* 搜索匹配高亮标记 */}
                            {isRoleMatched(role) && role.id !== playerRoleId && (
                                <div className="absolute -top-2 -right-2 z-10 bg-amber-500 text-black text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                                    匹配
                                </div>
                            )}
                            <RoleCard
                                role={role}
                                isPlayerRole={role.id === playerRoleId}
                                showDetails={descriptionMode === 'detailed'}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200 font-serif"
            style={{ zIndex: Z_INDEX.modal }}
        >
            <div className="glass-panel w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden relative">
                {/* Decorative glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent blur-sm" />

                {/* Header */}
                <div className="p-4 md:p-6 border-b border-stone-800 flex justify-between items-center bg-stone-950/50 sticky top-0 z-10">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 rounded-full bg-amber-900/20 border border-amber-700/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <span className="text-2xl">📖</span>
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-amber-100 font-cinzel tracking-wider drop-shadow-md">
                            规则手册 <span className="text-amber-600 text-lg">Grimoire</span>
                        </h2>
                        {activeTab === 'roles' && (
                            <button
                                onClick={() => setDescriptionMode(descriptionMode === 'simple' ? 'detailed' : 'simple')}
                                className="ml-2 px-3 py-1 text-xs bg-stone-800/50 hover:bg-stone-700/50 text-amber-200/80 hover:text-amber-100 rounded-full border border-stone-700 transition-all flex items-center gap-2 group"
                            >
                                <span className="group-hover:scale-110 transition-transform">{descriptionMode === 'simple' ? '🔍' : '📝'}</span>
                                <span className="hidden md:inline">{descriptionMode === 'simple' ? '显示详细' : '显示简略'}</span>
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-100 hover:bg-stone-800/50 transition-all"
                    >
                        ✕
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-800 bg-stone-950/30 sticky top-[60px] md:top-[88px] z-10 backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`flex-1 py-4 text-sm font-cinzel font-bold tracking-widest transition-all border-b-2 relative overflow-hidden group ${activeTab === 'roles'
                            ? 'border-amber-600 text-amber-400 bg-amber-900/10'
                            : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/20'
                            }`}
                    >
                        <span className="relative z-10 group-hover:scale-110 inline-block transition-transform duration-300">🎭 角色能力</span>
                        {activeTab === 'roles' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse-glow" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`flex-1 py-4 text-sm font-cinzel font-bold tracking-widest transition-all border-b-2 relative overflow-hidden group ${activeTab === 'rules'
                            ? 'border-amber-600 text-amber-400 bg-amber-900/10'
                            : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/20'
                            }`}
                    >
                        <span className="relative z-10 group-hover:scale-110 inline-block transition-transform duration-300">📜 游戏规则</span>
                        {activeTab === 'rules' && <div className="absolute inset-0 bg-amber-500/5 animate-pulse-glow" />}
                    </button>
                </div>

                {/* 搜索栏和折叠控制 - 仅在角色标签页显示 */}
                {activeTab === 'roles' && (
                    <div className="p-3 md:p-4 border-b border-stone-800 bg-stone-900/40 flex flex-col md:flex-row gap-3 items-stretch md:items-center sticky top-[108px] md:top-[136px] z-10 backdrop-blur-md">
                        {/* 搜索框 */}
                        <div className="relative flex-1 group">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="🔍 搜索角色名或技能关键字..."
                                className="w-full px-4 py-2.5 pl-10 bg-black/40 border border-stone-700 rounded-lg text-stone-200 placeholder-stone-600 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/50 text-sm transition-all group-hover:border-stone-600"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 group-focus-within:text-amber-500 transition-colors">🔍</span>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300 w-5 h-5 flex items-center justify-center rounded-full hover:bg-stone-800"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* 搜索结果计数 */}
                        {searchQuery && (
                            <span className="text-xs text-stone-500 whitespace-nowrap px-2">
                                找到 <span className="text-amber-400 font-bold">{totalMatchedCount}</span> 个角色
                            </span>
                        )}

                        {/* 折叠控制按钮 */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => toggleAllTeams(true)}
                                className="px-3 py-2 text-xs bg-stone-800/50 hover:bg-stone-700/50 text-stone-300 rounded border border-stone-700 hover:border-stone-500 transition-all whitespace-nowrap"
                            >
                                📁 全部折叠
                            </button>
                            <button
                                onClick={() => toggleAllTeams(false)}
                                className="px-3 py-2 text-xs bg-stone-800/50 hover:bg-stone-700/50 text-stone-300 rounded border border-stone-700 hover:border-stone-500 transition-all whitespace-nowrap"
                            >
                                📂 全部展开
                            </button>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-8 scrollbar-thin">

                    {activeTab === 'roles' && (
                        <>
                            {/* Player's Role (Hero Card) - 不受搜索影响 */}
                            {playerRole && (
                                <div className="mb-8">
                                    <RoleCard
                                        role={playerRole}
                                        isPlayerRole={true}
                                        size="large"
                                        showDetails={true} // Always show details for own role
                                    />
                                </div>
                            )}

                            {/* 搜索无结果提示 */}
                            {searchQuery && totalMatchedCount === 0 && (
                                <div className="text-center py-12 text-stone-500">
                                    <span className="text-4xl mb-4 block">🔍</span>
                                    <p>没有找到匹配 "<span className="text-amber-400">{searchQuery}</span>" 的角色</p>
                                    <p className="text-xs mt-2">尝试搜索角色名称或技能关键字</p>
                                </div>
                            )}

                            {/* All Roles Grouped by Team */}
                            <div className="space-y-2">
                                {renderTeamSection('TOWNSFOLK')}
                                {renderTeamSection('OUTSIDER')}
                                {renderTeamSection('MINION')}
                                {renderTeamSection('DEMON')}
                                {renderTeamSection('TRAVELER')}
                            </div>
                        </>
                    )}

                    {activeTab === 'rules' && (
                        <div className="max-w-4xl mx-auto space-y-8 text-stone-300">
                            <div className="bg-stone-950/50 p-6 rounded-lg border border-stone-800">
                                <h3 className="text-xl font-bold text-amber-400 mb-4 font-cinzel">基本流程</h3>
                                <ul className="space-y-3 list-disc list-inside">
                                    <li><strong className="text-stone-200">夜晚</strong>：所有玩家闭眼。说书人唤醒特定角色进行行动（如查验、杀人、保护）。</li>
                                    <li><strong className="text-stone-200">白天</strong>：所有玩家睁眼。大家自由讨论，分享信息（或谎言）。</li>
                                    <li><strong className="text-stone-200">提名与投票</strong>：玩家可以提名处决嫌疑人。如果票数过半且最高，该玩家被处决。</li>
                                    <li><strong className="text-stone-200">死亡</strong>：死亡玩家失去技能，但仍可说话，且只有最后一票投票权。</li>
                                </ul>
                            </div>

                            <div className="bg-stone-950/50 p-6 rounded-lg border border-stone-800">
                                <h3 className="text-xl font-bold text-amber-400 mb-4 font-cinzel">获胜条件</h3>
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-4 bg-blue-950/20 border border-blue-900/50 rounded">
                                        <h4 className="font-bold text-blue-400 mb-2">好人阵营 (Townsfolk & Outsider)</h4>
                                        <p>处决恶魔。</p>
                                        <p className="text-sm text-stone-500 mt-2">注：只要恶魔死亡且无法传位，好人即获胜。</p>
                                    </div>
                                    <div className="p-4 bg-red-950/20 border border-red-900/50 rounded">
                                        <h4 className="font-bold text-red-400 mb-2">邪恶阵营 (Minion & Demon)</h4>
                                        <p>场上只剩下 2 名玩家。</p>
                                        <p className="text-sm text-stone-500 mt-2">注：或者达成特殊获胜条件（如市长、圣徒等）。</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-stone-950/50 p-6 rounded-lg border border-stone-800">
                                <h3 className="text-xl font-bold text-amber-400 mb-4 font-cinzel">常见术语</h3>
                                <dl className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                                    <div>
                                        <dt className="font-bold text-stone-200">醉酒 (Drunk)</dt>
                                        <dd className="text-sm text-stone-400">你以为你是某个角色，但实际上你不是。你的技能无效，且可能得到错误信息。</dd>
                                    </div>
                                    <div>
                                        <dt className="font-bold text-stone-200">中毒 (Poisoned)</dt>
                                        <dd className="text-sm text-stone-400">你的技能暂时无效，且可能得到错误信息。通常由投毒者造成。</dd>
                                    </div>
                                    <div>
                                        <dt className="font-bold text-stone-200">疯狂 (Madness)</dt>
                                        <dd className="text-sm text-stone-400">你必须表现得像某个特定角色，否则可能会受到惩罚（通常是处决）。</dd>
                                    </div>
                                    <div>
                                        <dt className="font-bold text-stone-200">死亡投票 (Ghost Vote)</dt>
                                        <dd className="text-sm text-stone-400">死亡玩家在整局游戏中只有一次投票机会。</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pulsing glow animation styles */}
            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { 
                        box-shadow: 0 0 30px rgba(234, 179, 8, 0.5),
                                    0 0 60px rgba(234, 179, 8, 0.3),
                                    inset 0 0 20px rgba(234, 179, 8, 0.1);
                    }
                    50% { 
                        box-shadow: 0 0 50px rgba(234, 179, 8, 0.8),
                                    0 0 100px rgba(234, 179, 8, 0.5),
                                    inset 0 0 30px rgba(234, 179, 8, 0.2);
                    }
                }
                .animate-pulse-glow {
                    animation: pulse-glow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};
