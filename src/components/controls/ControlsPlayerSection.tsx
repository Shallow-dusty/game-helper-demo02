import React, { useState } from 'react';
import { useStore } from '../../store';
import { RoleDef, Seat, GamePhase } from '../../types';
import { ROLES, TEAM_COLORS } from '../../constants';
import { VoteButton } from '../game/VoteButton';
import { DoomsdayClock } from '../game/DoomsdayClock';

const ACTIVE_ABILITY_ROLES: Record<string, {
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

// Active Ability Button Component
interface ActiveAbilityButtonProps {
    role: RoleDef;
    seat: Seat;
    gamePhase: GamePhase;
}

const ActiveAbilityButton: React.FC<ActiveAbilityButtonProps> = ({ role, seat, gamePhase }) => {
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
                    className={`w-full py-2 px-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all ${canUse
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

// Compact Role Display Component
interface CompactRoleDisplayProps {
    role: RoleDef;
    seat: Seat;
    gamePhase: GamePhase;
}

const CompactRoleDisplay: React.FC<CompactRoleDisplayProps> = ({ role, seat, gamePhase }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    return (
        <div className="bg-stone-900/80 rounded-lg border border-stone-700 overflow-hidden shadow-sm">
            {/* Header - Always Visible */}
            <div 
                className="p-3 flex items-center justify-between cursor-pointer hover:bg-stone-800/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-stone-600 flex items-center justify-center bg-stone-950 shadow-inner" style={{ borderColor: TEAM_COLORS[role.team] }}>
                        <span className="text-2xl">{role.icon || (role.team === 'DEMON' ? '👿' : role.team === 'MINION' ? '🧪' : '⚜️')}</span>
                    </div>
                    <div>
                        <div className="font-bold font-cinzel text-stone-200 flex items-center gap-2">
                            <span style={{ color: TEAM_COLORS[role.team] }}>{role.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-800 text-stone-500 border border-stone-700 uppercase tracking-wider">
                                {role.team === 'TOWNSFOLK' ? '村民' : role.team === 'MINION' ? '爪牙' : role.team === 'DEMON' ? '恶魔' : '外来者'}
                            </span>
                        </div>
                        <div className="text-xs text-stone-500 font-serif italic truncate max-w-[200px]">
                            {isExpanded ? '点击折叠详情' : role.ability}
                        </div>
                    </div>
                </div>
                <div className="text-stone-600">
                    {isExpanded ? '▼' : '▲'}
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-in slide-in-from-top-2 duration-200">
                    <div className="text-sm text-stone-400 leading-relaxed border-t border-stone-800/50 pt-2 mt-1">
                        {role.ability}
                    </div>
                    
                    {/* Active Ability Button */}
                    <ActiveAbilityButton
                        role={role}
                        seat={seat}
                        gamePhase={gamePhase}
                    />
                </div>
            )}
        </div>
    );
};

interface ControlsPlayerSectionProps {
    onShowHistory: () => void;
    onShowNightAction: () => void;
}

export const ControlsPlayerSection: React.FC<ControlsPlayerSectionProps> = ({
    onShowHistory,
    onShowNightAction
}) => {
    const user = useStore(state => state.user);
    const gameState = useStore(state => state.gameState);
    const toggleHand = useStore(state => state.toggleHand);
    const leaveSeat = useStore(state => state.leaveSeat);

    if (!user || !gameState) return null;

    const currentSeat = gameState.seats.find(s => s.userId === user.id);
    const role = currentSeat?.roleId ? ROLES[currentSeat.roleId] : null;

    return (
        <div className="space-y-3">
            {/* Compact Role Display */}
            {role && currentSeat && (
                <div className="space-y-2">
                    <CompactRoleDisplay
                        role={role}
                        seat={currentSeat}
                        gamePhase={gameState.phase}
                    />
                    <button
                        onClick={() => useStore.getState().openRoleReveal()}
                        className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 text-xs rounded border border-stone-700 flex items-center justify-center gap-2 transition-colors"
                    >
                        <span>👁️</span> 查看完整身份卡
                    </button>
                </div>
            )}

            {/* Night Phase UI */}
            {gameState.phase === 'NIGHT' && (
                <div className="p-4 bg-indigo-950/30 rounded border border-indigo-900/50 text-center shadow-lg backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-xl">🌙</span>
                        <h3 className="text-indigo-200 font-bold font-cinzel tracking-widest">夜幕降临</h3>
                    </div>
                    
                    {/* 当前是你的回合 - 始终显示按钮 */}
                    {currentSeat?.roleId === gameState.nightQueue[gameState.nightCurrentIndex] && (
                        <button
                            onClick={onShowNightAction}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg animate-pulse border border-indigo-400 flex items-center justify-center gap-2"
                        >
                            <span>⚡</span> 执行夜间行动
                        </button>
                    )}

                    {/* 即使不是当前回合，但有夜间技能的角色也可以查看 */}
                    {currentSeat?.roleId &&
                        ROLES[currentSeat.roleId]?.nightAction &&
                        currentSeat.roleId !== gameState.nightQueue[gameState.nightCurrentIndex] && (
                            <button
                                onClick={onShowNightAction}
                                className="mt-2 w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded text-sm border border-stone-600"
                            >
                                查看我的夜间行动
                            </button>
                        )}
                </div>
            )}

            {/* Voting UI */}
            {gameState.voting?.isOpen && (
                <div className="p-3 bg-amber-950/20 rounded border border-amber-800/30 shadow-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-amber-900/20 pb-2">
                        <div className="flex items-center gap-2">
                            <span className="text-amber-600 font-bold">⚖ 审判</span>
                            <span className="text-stone-500 text-xs">受审者:</span>
                            <span className="text-amber-100 font-bold">{gameState.seats.find(s => s.id === gameState.voting?.nomineeSeatId)?.userName}</span>
                        </div>
                    </div>

                    {currentSeat ? (
                        <>
                            <VoteButton
                                isRaised={currentSeat.isHandRaised || false}
                                isLocked={currentSeat.voteLocked || false}
                                isDead={currentSeat.isDead || false}
                                hasGhostVote={currentSeat.hasGhostVote ?? true}
                                onToggle={toggleHand}
                            />
                            <div className="text-center text-xs text-stone-500 font-serif">
                                {currentSeat.voteLocked
                                    ? '说书人已锁定你的投票'
                                    : gameState.voting.clockHandSeatId === currentSeat.id
                                        ? '⏳ 正在结算...'
                                        : '点击按钮举手/放下'}
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-stone-600 italic text-xs">
                            请先入座以参与投票
                        </div>
                    )}
                </div>
            )}

            {/* Voting Stats Chart */}
            <DoomsdayClock />

            {/* Settings / Tools */}
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={onShowHistory}
                    className="bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 py-2 px-3 rounded text-xs border border-stone-800 transition-colors flex items-center justify-center gap-2"
                >
                    <span>📜</span> 历史记录
                </button>

                {currentSeat && (
                    <button
                        onClick={() => void leaveSeat()}
                        className="bg-stone-900 hover:bg-red-950/30 text-stone-400 hover:text-red-400 py-2 px-3 rounded text-xs border border-stone-800 hover:border-red-900/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🚪</span> 离开座位
                    </button>
                )}
            </div>
        </div>
    );
};
