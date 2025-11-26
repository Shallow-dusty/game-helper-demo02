import React from 'react';
import { RoleDef } from '../types';
import { RoleCard } from './RoleCard';

interface RoleReferenceSidebarProps {
    isExpanded: boolean;
    onToggle: () => void;
    playerRoleId: string | null;
    scriptRoles: RoleDef[];
}

export const RoleReferenceSidebar: React.FC<RoleReferenceSidebarProps> = ({
    isExpanded,
    onToggle,
    playerRoleId,
    scriptRoles
}) => {
    const playerRole = scriptRoles.find(r => r.id === playerRoleId);

    // Group roles by team
    const rolesByTeam = {
        TOWNSFOLK: scriptRoles.filter(r => r.team === 'TOWNSFOLK'),
        OUTSIDER: scriptRoles.filter(r => r.team === 'OUTSIDER'),
        MINION: scriptRoles.filter(r => r.team === 'MINION'),
        DEMON: scriptRoles.filter(r => r.team === 'DEMON')
    };

    return (
        <>
            {/* Toggle Button (Always Visible) */}
            <button
                onClick={onToggle}
                className={`fixed top-1/2 -translate-y-1/2 z-40 bg-amber-900 hover:bg-amber-800 text-amber-200 p-3 rounded-l-lg shadow-lg transition-all ${isExpanded ? 'right-[320px]' : 'right-0'
                    }`}
                title={isExpanded ? '收起规则手册' : '展开规则手册'}
            >
                <span className="text-xl">
                    {isExpanded ? '📖▶' : '◀📖'}
                </span>
            </button>

            {/* Sidebar Panel */}
            <div className={`fixed right-0 top-0 h-screen w-[320px] bg-stone-900 border-l border-stone-700 shadow-2xl z-30 transform transition-transform duration-300 ${isExpanded ? 'translate-x-0' : 'translate-x-full'
                } flex flex-col font-serif`}>

                {/* Header */}
                <div className="p-4 border-b border-stone-800 bg-stone-950">
                    <h3 className="text-lg font-bold text-amber-400 font-cinzel">
                        📖 规则手册
                    </h3>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">

                    {/* Player's Role (Sticky at top) */}
                    {playerRole && (
                        <div className="sticky top-0 bg-stone-900 pb-4 z-10">
                            <RoleCard
                                role={playerRole}
                                isPlayerRole={true}
                                size="normal"
                            />
                        </div>
                    )}

                    {/* Divider */}
                    {playerRole && (
                        <div className="border-t border-stone-700 pt-4">
                            <p className="text-xs text-stone-500 mb-4 text-center">
                                所有角色
                            </p>
                        </div>
                    )}

                    {/* All Roles */}
                    <div className="space-y-6">
                        {/* Townsfolk */}
                        {rolesByTeam.TOWNSFOLK.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-blue-400 mb-2 font-cinzel border-b border-blue-900 pb-1">
                                    镇民
                                </h4>
                                <div className="space-y-2">
                                    {rolesByTeam.TOWNSFOLK.map(role => (
                                        role.id !== playerRoleId && (
                                            <RoleCard
                                                key={role.id}
                                                role={role}
                                                size="small"
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Outsider */}
                        {rolesByTeam.OUTSIDER.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-green-400 mb-2 font-cinzel border-b border-green-900 pb-1">
                                    外来者
                                </h4>
                                <div className="space-y-2">
                                    {rolesByTeam.OUTSIDER.map(role => (
                                        role.id !== playerRoleId && (
                                            <RoleCard
                                                key={role.id}
                                                role={role}
                                                size="small"
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Minion */}
                        {rolesByTeam.MINION.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-orange-400 mb-2 font-cinzel border-b border-orange-900 pb-1">
                                    爪牙
                                </h4>
                                <div className="space-y-2">
                                    {rolesByTeam.MINION.map(role => (
                                        role.id !== playerRoleId && (
                                            <RoleCard
                                                key={role.id}
                                                role={role}
                                                size="small"
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Demon */}
                        {rolesByTeam.DEMON.length > 0 && (
                            <div>
                                <h4 className="text-sm font-bold text-red-400 mb-2 font-cinzel border-b border-red-900 pb-1">
                                    恶魔
                                </h4>
                                <div className="space-y-2">
                                    {rolesByTeam.DEMON.map(role => (
                                        role.id !== playerRoleId && (
                                            <RoleCard
                                                key={role.id}
                                                role={role}
                                                size="small"
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};
