import React from 'react';
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
                    <h2 className="text-2xl font-bold text-amber-400 font-cinzel tracking-wider">
                        📖 角色规则手册
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-stone-500 hover:text-stone-200 transition-colors text-xl font-bold"
                    >
                        ✕ 关闭
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">

                    {/* Player's Role (Hero Card) */}
                    {playerRole && (
                        <div className="mb-8">
                            <RoleCard
                                role={playerRole}
                                isPlayerRole={true}
                                size="large"
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
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
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
