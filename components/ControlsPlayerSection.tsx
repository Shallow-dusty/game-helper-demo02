import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS } from '../constants';
import { VotingChart } from './VotingChart';
import { VoteButton } from './VoteButton';
import { RoleDef, Seat, GamePhase } from '../types';

// Roles with active day abilities
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

// Role Card for Player
interface PlayerRoleCardProps {
    role: RoleDef;
    seat: Seat;
    gamePhase: GamePhase;
}

const PlayerRoleCard: React.FC<PlayerRoleCardProps> = ({ role, seat, gamePhase }) => {
    const [skillDescriptionMode, setSkillDescriptionMode] = useState<'simple' | 'detailed'>('simple');
    const [isFlipped, setIsFlipped] = useState(false);

    // Load preference from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('skillDescriptionMode') as 'simple' | 'detailed';
        if (savedMode) {
            setSkillDescriptionMode(savedMode);
        }
    }, []);

    const toggleSkillMode = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newMode = skillDescriptionMode === 'simple' ? 'detailed' : 'simple';
        setSkillDescriptionMode(newMode);
        localStorage.setItem('skillDescriptionMode', newMode);
    };

    return (
        <div className="px-4 pb-4 border-b border-stone-800 bg-stone-950/50 perspective-[1000px]">
            <div
                className={`relative transition-all duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                onClick={() => setIsFlipped(!isFlipped)}
            >
                {/* Front Face (Card Back / Cover) */}
                <div className="absolute inset-0 backface-hidden z-10 rounded border border-stone-700 bg-stone-900 shadow-xl flex flex-col items-center justify-center overflow-hidden group">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605806616949-1e87b487bc2a?q=80&w=1000&auto=format&fit=crop')] bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <div className="w-20 h-20 rounded-full border-2 border-stone-600 flex items-center justify-center mb-4 bg-stone-950/50 backdrop-blur-sm group-hover:scale-110 transition-transform duration-500">
                        <span className="text-4xl">👁️</span>
                    </div>
                    <h3 className="text-xl font-cinzel font-bold text-stone-400 tracking-widest group-hover:text-stone-200 transition-colors">点击查看身份</h3>
                    <p className="text-xs text-stone-600 mt-2 font-serif italic">CONFIDENTIAL</p>
                </div>

                {/* Back Face (Actual Role Content) */}
                <div className="relative backface-hidden rotate-y-180 bg-stone-900 rounded border border-stone-700 overflow-hidden">
                    <div className="p-4">
                        <div className="absolute top-0 right-0 p-1 opacity-20 text-4xl">
                            {role.team === 'DEMON' ? '👿' : role.team === 'MINION' ? '🧪' : '⚜️'}
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-bold flex items-center gap-2 text-lg font-cinzel" style={{ color: TEAM_COLORS[role.team] }}>
                                <span>{role.name}</span>
                            </div>
                            <button
                                onClick={toggleSkillMode}
                                className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded border border-stone-600 transition-colors z-20 relative"
                                title="切换详细/简略描述"
                            >
                                {skillDescriptionMode === 'simple' ? '详细' : '简略'}
                            </button>
                        </div>
                        <span className="text-[10px] opacity-70 border border-current px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ color: TEAM_COLORS[role.team] }}>
                            {role.team === 'TOWNSFOLK' ? '村民' :
                                role.team === 'MINION' ? '爪牙' :
                                    role.team === 'DEMON' ? '恶魔' : '外来者'}
                        </span>
                        {skillDescriptionMode === 'detailed' && (
                            <p className="text-sm text-stone-400 mt-3 leading-relaxed italic border-t border-stone-800 pt-2">{role.ability}</p>
                        )}

                        {/* Active Ability Button */}
                        <div onClick={e => e.stopPropagation()}>
                            <ActiveAbilityButton
                                role={role}
                                seat={seat}
                                gamePhase={gamePhase}
                            />
                        </div>
                    </div>
                </div>
            </div>
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

    if (!user || !gameState) return null;

    const currentSeat = gameState.seats.find(s => s.userId === user.id);
    const role = currentSeat?.roleId ? ROLES[currentSeat.roleId] : null;

    return (
        <div className="space-y-4">
            {/* Player Role Card */}
            {role && currentSeat && (
                <PlayerRoleCard
                    role={role}
                    seat={currentSeat}
                    gamePhase={gameState.phase}
                />
            )}

            {/* Voting Stats */}
            <VotingChart />

            {/* Night Phase UI */}
            {gameState.phase === 'NIGHT' && (
                <div className="p-6 bg-black/60 rounded border border-indigo-900/50 text-center shadow-[0_0_30px_rgba(30,27,75,0.5)] backdrop-blur-sm">
                    <div className="text-4xl mb-4 opacity-80">🌙</div>
                    <h3 className="text-indigo-200 font-bold font-cinzel text-xl tracking-widest">夜幕降临</h3>
                    <p className="text-xs text-indigo-400 mt-2 font-serif italic">只有被叫到名字时才醒来。</p>

                    {/* 当前是你的回合 - 始终显示按钮 */}
                    {currentSeat?.roleId === gameState.nightQueue[gameState.nightCurrentIndex] && (
                        <button
                            onClick={onShowNightAction}
                            className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg animate-pulse border-2 border-indigo-400"
                        >
                            🌙 执行夜间行动
                        </button>
                    )}

                    {/* 即使不是当前回合，但有夜间技能的角色也可以查看 */}
                    {currentSeat?.roleId &&
                        ROLES[currentSeat.roleId]?.nightAction &&
                        currentSeat.roleId !== gameState.nightQueue[gameState.nightCurrentIndex] && (
                            <button
                                onClick={onShowNightAction}
                                className="mt-4 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm border border-stone-600"
                            >
                                查看我的夜间行动
                            </button>
                        )}
                </div>
            )}

            {/* Voting UI */}
            {gameState.voting?.isOpen && (
                <div className="p-4 bg-amber-900/10 rounded border border-amber-800/50 shadow-[0_0_20px_rgba(180,83,9,0.1)] space-y-4">
                    <div>
                        <h3 className="text-center font-bold text-amber-600 mb-2 flex items-center justify-center gap-2 font-cinzel">
                            <span>⚖</span> 审判
                        </h3>
                        <p className="text-xs text-center text-stone-400">
                            受审者: <span className="text-amber-100 font-bold text-base ml-1">{gameState.seats.find(s => s.id === gameState.voting?.nomineeSeatId)?.userName}</span>
                        </p>
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
                                    ? '说书人已锁定你的投票。'
                                    : gameState.voting.clockHandSeatId === currentSeat.id
                                        ? '⏳ 说书人正在结算你的选择...'
                                        : '可提前举手 / 放下，等待说书人锁定'}
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-stone-600 italic p-3 border border-dashed border-stone-800 rounded-sm font-serif text-sm">
                            请先入座以参与投票
                        </div>
                    )}
                </div>
            )}

            {/* Settings for Player */}
            <div className="bg-stone-900 p-3 rounded border border-stone-700 mt-4">
                <div className="text-xs font-bold text-stone-500 uppercase mb-2">⚙️ 设置</div>
                {/* History Button for Players */}
                <button
                    onClick={onShowHistory}
                    className="mt-2 w-full bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                    title="查看历史记录"
                >
                    <span>📜</span> 历史
                </button>

                {/* FR-01: Leave Seat Button for Players */}
                {currentSeat && (
                    <button
                        onClick={() => useStore.getState().leaveSeat()}
                        className="mt-2 w-full bg-red-900/30 hover:bg-red-800/50 text-red-400 py-2 px-3 rounded text-xs border border-red-900/50 transition-colors flex items-center justify-center gap-1"
                        title="离开当前座位"
                    >
                        <span>🚪</span> 离开座位
                    </button>
                )}
            </div>
        </div>
    );
};
