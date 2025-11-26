import React, { useState } from 'react';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS } from '../constants';

export const ScriptReference: React.FC = () => {
    const { gameState } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

    // Get roles for current script (currently hardcoded to TB, but ready for expansion)
    // In a real implementation, we would filter by gameState.currentScriptId
    const allRoles = Object.values(ROLES);

    const filteredRoles = allRoles.filter(role => {
        const matchesSearch = role.name.includes(searchTerm) || role.ability.includes(searchTerm);
        const matchesTeam = selectedTeam ? role.team === selectedTeam : true;
        return matchesSearch && matchesTeam;
    });

    const groupedRoles = {
        TOWNSFOLK: filteredRoles.filter(r => r.team === 'TOWNSFOLK'),
        OUTSIDER: filteredRoles.filter(r => r.team === 'OUTSIDER'),
        MINION: filteredRoles.filter(r => r.team === 'MINION'),
        DEMON: filteredRoles.filter(r => r.team === 'DEMON'),
        TRAVELER: filteredRoles.filter(r => r.team === 'TRAVELER'),
    };

    return (
        <div className="h-full flex flex-col bg-stone-900/50 rounded-lg overflow-hidden border border-stone-800">
            <div className="p-3 border-b border-stone-800 bg-stone-900">
                <h3 className="text-sm font-bold text-stone-300 mb-2 font-cinzel">板子参考 (Script Reference)</h3>

                {/* Search */}
                <input
                    type="text"
                    placeholder="搜索角色或技能..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-stone-950 border border-stone-700 rounded px-2 py-1 text-xs text-stone-200 focus:outline-none focus:border-stone-500 mb-2"
                />

                {/* Team Filters */}
                <div className="flex gap-1 flex-wrap">
                    <button
                        onClick={() => setSelectedTeam(null)}
                        className={`px-2 py-0.5 text-[10px] rounded border ${!selectedTeam ? 'bg-stone-700 border-stone-500 text-white' : 'bg-stone-900 border-stone-800 text-stone-500'}`}
                    >
                        全部
                    </button>
                    {['TOWNSFOLK', 'OUTSIDER', 'MINION', 'DEMON'].map(team => (
                        <button
                            key={team}
                            onClick={() => setSelectedTeam(team === selectedTeam ? null : team)}
                            className={`px-2 py-0.5 text-[10px] rounded border transition-colors`}
                            style={{
                                backgroundColor: team === selectedTeam ? `${TEAM_COLORS[team as keyof typeof TEAM_COLORS]}20` : 'transparent',
                                borderColor: team === selectedTeam ? TEAM_COLORS[team as keyof typeof TEAM_COLORS] : '#292524',
                                color: team === selectedTeam ? TEAM_COLORS[team as keyof typeof TEAM_COLORS] : '#78716c'
                            }}
                        >
                            {team === 'TOWNSFOLK' ? '村民' : team === 'OUTSIDER' ? '外来者' : team === 'MINION' ? '爪牙' : '恶魔'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
                {Object.entries(groupedRoles).map(([team, roles]) => {
                    if (roles.length === 0) return null;
                    return (
                        <div key={team} className="mb-4">
                            <h4
                                className="text-xs font-bold uppercase tracking-wider mb-2 border-b border-stone-800 pb-1 sticky top-0 bg-stone-900/95 backdrop-blur z-10"
                                style={{ color: TEAM_COLORS[team as keyof typeof TEAM_COLORS] }}
                            >
                                {team === 'TOWNSFOLK' ? '村民' : team === 'OUTSIDER' ? '外来者' : team === 'MINION' ? '爪牙' : team === 'DEMON' ? '恶魔' : '旅行者'}
                            </h4>
                            <div className="space-y-2">
                                {roles.map(role => (
                                    <div key={role.id} className="bg-stone-950/50 p-2 rounded border border-stone-800/50 hover:border-stone-700 transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-stone-300 text-sm">{role.name}</span>
                                            {role.icon && <span className="text-lg opacity-50">{role.icon}</span>}
                                        </div>
                                        <p className="text-xs text-stone-500 leading-relaxed">{role.ability}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
