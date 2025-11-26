import React, { useState } from 'react';
import { RoleDef } from '../types';
import { RoleCard } from './RoleCard';

interface RoleReferencePanelProps {
    isOpen: boolean;
    onClose: () => void;
    playerRoleId: string | null;
    scriptRoles: RoleDef[];
}

export const RoleReferencePanel: React.FC<RoleReferencePanelProps> = ({
    isOpen,
    onClose,
    playerRoleId,
    scriptRoles
}) => {
    const [descriptionMode, setDescriptionMode] = useState<'simple' | 'detailed'>('simple');
    const [activeTab, setActiveTab] = useState<'roles' | 'rules'>('roles');

    if (!isOpen) return null;

    const playerRole = scriptRoles.find(r => r.id === playerRoleId);

    // Group roles by team
    const rolesByTeam = {
        TOWNSFOLK: scriptRoles.filter(r => r.team === 'TOWNSFOLK'),
        OUTSIDER: scriptRoles.filter(r => r.team === 'OUTSIDER'),
        MINION: scriptRoles.filter(r => r.team === 'MINION'),
        DEMON: scriptRoles.filter(r => r.team === 'DEMON'),
        TRAVELER: scriptRoles.filter(r => r.team === 'TRAVELER')
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 font-serif">
            <div className="bg-stone-900 border border-stone-700 rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-6 border-b border-stone-800 flex justify-between items-center bg-stone-950">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-bold text-amber-400 font-cinzel tracking-wider">
                            📖 规则手册
                        </h2>
                        {activeTab === 'roles' && (
                            <button
                                onClick={() => setDescriptionMode(descriptionMode === 'simple' ? 'detailed' : 'simple')}
                                className="px-3 py-1 text-xs bg-stone-800 hover:bg-stone-700 text-amber-300 rounded border border-stone-600 transition-colors flex items-center gap-2"
                            >
                                {descriptionMode === 'simple' ? (
                                    <><span>🔍</span> 显示详细</>
                                ) : (
                                    <><span>📝</span> 显示简略</>
                                )}
                            </button>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-stone-500 hover:text-stone-200 transition-colors text-xl font-bold"
                    >
                        ✕ 关闭
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-800 bg-stone-950">
                    <button
                        onClick={() => setActiveTab('roles')}
                        className={`flex-1 py-3 px-4 text-sm font-cinzel transition-colors border-b-2 ${activeTab === 'roles'
                                ? 'border-amber-600 text-amber-500 bg-stone-900'
                                : 'border-transparent text-stone-500 hover:text-stone-300'
                            }`}
                    >
                        🎭 角色能力
                    </button>
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`flex-1 py-3 px-4 text-sm font-cinzel transition-colors border-b-2 ${activeTab === 'rules'
                                ? 'border-amber-600 text-amber-500 bg-stone-900'
                                : 'border-transparent text-stone-500 hover:text-stone-300'
                            }`}
                    >
                        📜 游戏规则
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">

                    {activeTab === 'roles' && (
                        <>
                            {/* Player's Role (Hero Card) */}
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

                            {/* All Roles Grouped by Team */}
                            <div className="space-y-8">
                                {/* Townsfolk */}
                                {rolesByTeam.TOWNSFOLK.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-blue-400 mb-4 font-cinzel border-b border-blue-900 pb-2">
                                            🏘️ 镇民 (Townsfolk)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {rolesByTeam.TOWNSFOLK.map(role => (
                                                <RoleCard
                                                    key={role.id}
                                                    role={role}
                                                    isPlayerRole={role.id === playerRoleId}
                                                    showDetails={descriptionMode === 'detailed'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Outsider */}
                                {rolesByTeam.OUTSIDER.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-green-400 mb-4 font-cinzel border-b border-green-900 pb-2">
                                            🌿 外来者 (Outsider)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {rolesByTeam.OUTSIDER.map(role => (
                                                <RoleCard
                                                    key={role.id}
                                                    role={role}
                                                    isPlayerRole={role.id === playerRoleId}
                                                    showDetails={descriptionMode === 'detailed'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Minion */}
                                {rolesByTeam.MINION.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-orange-400 mb-4 font-cinzel border-b border-orange-900 pb-2">
                                            👿 爪牙 (Minion)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {rolesByTeam.MINION.map(role => (
                                                <RoleCard
                                                    key={role.id}
                                                    role={role}
                                                    isPlayerRole={role.id === playerRoleId}
                                                    showDetails={descriptionMode === 'detailed'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Demon */}
                                {rolesByTeam.DEMON.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-red-400 mb-4 font-cinzel border-b border-red-900 pb-2">
                                            👹 恶魔 (Demon)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {rolesByTeam.DEMON.map(role => (
                                                <RoleCard
                                                    key={role.id}
                                                    role={role}
                                                    isPlayerRole={role.id === playerRoleId}
                                                    showDetails={descriptionMode === 'detailed'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Traveler */}
                                {rolesByTeam.TRAVELER.length > 0 && (
                                    <div>
                                        <h3 className="text-xl font-bold text-purple-400 mb-4 font-cinzel border-b border-purple-900 pb-2">
                                            🎒 旅行者 (Traveler)
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {rolesByTeam.TRAVELER.map(role => (
                                                <RoleCard
                                                    key={role.id}
                                                    role={role}
                                                    isPlayerRole={role.id === playerRoleId}
                                                    showDetails={descriptionMode === 'detailed'}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
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
