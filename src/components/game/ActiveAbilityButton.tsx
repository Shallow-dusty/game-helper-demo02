import React, { useState } from 'react';
import { useStore } from '../../store';
import { RoleDef, Seat, GamePhase } from '../../types';

// Roles with active day abilities
export const ACTIVE_ABILITY_ROLES: Record<string, { 
    name: string; 
    buttonText: string; 
    icon: string;
    phase: 'DAY' | 'ANY';
    requiresTarget: boolean;
    description: string;
}> = {
    slayer: {
        name: '杀手',
        buttonText: '发动杀手技能',
        icon: '🏹',
        phase: 'DAY',
        requiresTarget: true,
        description: '选择一名玩家，若为恶魔则立即死亡'
    },
    virgin: {
        name: '处女',
        buttonText: '声明处女身份',
        icon: '🕯️',
        phase: 'DAY',
        requiresTarget: false,
        description: '若被镇民提名，提名者立即死亡'
    },
    artist: {
        name: '艺术家',
        buttonText: '向ST提问',
        icon: '🎨',
        phase: 'DAY',
        requiresTarget: false,
        description: '向说书人提一个是非题'
    },
    juggler: {
        name: '杂耍艺人',
        buttonText: '猜测角色',
        icon: '🤹',
        phase: 'DAY',
        requiresTarget: true,
        description: '第一天猜测最多5人的角色'
    },
    gossip: {
        name: '造谣者',
        buttonText: '发表造谣',
        icon: '💬',
        phase: 'DAY',
        requiresTarget: false,
        description: '公开声明一个陈述，若为真则当晚死一人'
    }
};

interface ActiveAbilityButtonProps {
    role: RoleDef;
    seat: Seat;
    gamePhase: GamePhase;
}

export const ActiveAbilityButton: React.FC<ActiveAbilityButtonProps> = ({ role, seat, gamePhase }) => {
    const sendMessage = useStore(state => state.sendMessage);
    const [showModal, setShowModal] = useState(false);
    const [targetInput, setTargetInput] = useState('');
    
    const abilityConfig = ACTIVE_ABILITY_ROLES[role.id];
    
    // Don't show if role has no active ability
    if (!abilityConfig) return null;
    
    // Don't show if ability already used
    if (seat.hasUsedAbility) {
        return (
            <div className="mt-3 pt-3 border-t border-stone-800">
                <div className="text-xs text-stone-600 italic flex items-center gap-2">
                    <span>🚫</span>
                    <span>技能已使用</span>
                </div>
            </div>
        );
    }
    
    // Check phase requirement
    const canUse = abilityConfig.phase === 'ANY' || gamePhase === abilityConfig.phase;
    
    const handleActivate = () => {
        if (abilityConfig.requiresTarget) {
            setShowModal(true);
        } else {
            // Send activation message to chat
            sendMessage(`⚡ 【${role.name}】发动技能: ${abilityConfig.description}`, null);
            setShowModal(false);
        }
    };
    
    const handleSubmitTarget = () => {
        if (targetInput.trim()) {
            sendMessage(`⚡ 【${role.name}】发动技能 → 目标: ${targetInput}`, null);
            setTargetInput('');
            setShowModal(false);
        }
    };
    
    return (
        <>
            <div className="mt-3 pt-3 border-t border-stone-800">
                <button
                    onClick={handleActivate}
                    disabled={!canUse}
                    className={`w-full py-2 px-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                        canUse 
                            ? 'bg-amber-900/50 hover:bg-amber-800/50 text-amber-200 border border-amber-700 shadow-[0_0_10px_rgba(245,158,11,0.2)]' 
                            : 'bg-stone-800 text-stone-600 border border-stone-700 cursor-not-allowed'
                    }`}
                >
                    <span>{abilityConfig.icon}</span>
                    <span>{abilityConfig.buttonText}</span>
                </button>
                {!canUse && (
                    <p className="text-[10px] text-stone-600 mt-1 text-center">
                        仅在{abilityConfig.phase === 'DAY' ? '白天' : '任意阶段'}可用
                    </p>
                )}
            </div>
            
            {/* Target Selection Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-stone-900 border border-stone-700 rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-amber-500 mb-2 flex items-center gap-2">
                            <span>{abilityConfig.icon}</span>
                            {role.name}
                        </h3>
                        <p className="text-sm text-stone-400 mb-4">{abilityConfig.description}</p>
                        
                        <input
                            type="text"
                            value={targetInput}
                            onChange={e => setTargetInput(e.target.value)}
                            placeholder="输入目标玩家名称或座位号..."
                            className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-stone-300 mb-4"
                            autoFocus
                        />
                        
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2 bg-stone-800 text-stone-400 rounded text-sm"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSubmitTarget}
                                disabled={!targetInput.trim()}
                                className="flex-1 py-2 bg-amber-700 hover:bg-amber-600 text-white rounded text-sm font-bold disabled:opacity-50"
                            >
                                确认发动
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};




