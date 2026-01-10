import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store';
import { Z_INDEX, ROLES, PHASE_LABELS, SCRIPTS } from '../../constants';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Gamepad2, MessageSquare, Bot, Music, Book, GripVertical, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { ControlsSTSection } from './ControlsSTSection';
import { ControlsPlayerSection } from './ControlsPlayerSection';
import { Chat } from './Chat';
import { StorytellerNotebook } from '../game/StorytellerNotebook';
import { PlayerNotebook } from '../game/PlayerNotebook';
import { ControlsAudioTab } from './ControlsAudioTab';
import { ControlsAITab } from './ControlsAITab';
import { GameHistoryView } from '../history/GameHistoryView';
import { RoleReferencePanel } from './RoleReferencePanel';
import { ScriptCompositionGuide } from '../script/ScriptCompositionGuide';
import { NightActionPanel } from '../game/NightActionPanel';
import { PlayerNightAction } from '../game/PlayerNightAction';
import { ScriptEditor } from '../script/ScriptEditor';
import { VoiceRoomLink } from '../ui/VoiceRoomLink';
import { shallow } from 'zustand/shallow';

interface ControlsProps {
    onClose?: () => void;
}

// 优化的选择器
const useControlsState = () => useStore(
    state => ({
        user: state.user,
        phase: state.gameState?.phase,
        currentScriptId: state.gameState?.currentScriptId,
        roomId: state.gameState?.roomId,
        isOffline: state.isOffline,
    }),
    shallow
);

const useControlsActions = () => useStore(
    state => ({
        leaveGame: state.leaveGame,
        setModalOpen: state.setModalOpen,
    }),
    shallow
);

export const Controls: React.FC<ControlsProps> = ({ onClose }) => {
    const { user, phase, currentScriptId, roomId, isOffline } = useControlsState();
    const { leaveGame, setModalOpen } = useControlsActions();

    // 仅在需要完整 gameState 时才订阅（传递给子组件）
    const gameState = useStore(state => state.gameState);

    const [activeTab, setActiveTab] = useState<'game' | 'chat' | 'ai' | 'notebook' | 'audio'>(() => {
        const saved = localStorage.getItem('grimoire_active_tab');
        return (saved === 'game' || saved === 'chat' || saved === 'ai' || saved === 'notebook' || saved === 'audio') ? saved : 'game';
    });

    useEffect(() => {
        localStorage.setItem('grimoire_active_tab', activeTab);
    }, [activeTab]);
    const [showHistory, setShowHistory] = useState(false);
    const [showNightAction, setShowNightAction] = useState(false);
    const [showRoleReference, setShowRoleReference] = useState(false);
    const [showCompositionGuide, setShowCompositionGuide] = useState(false);
    const [currentNightRole, setCurrentNightRole] = useState<string | null>(null);
    const [showScriptEditor, setShowScriptEditor] = useState(false);

    const [width, setWidth] = useState(320); // Default 320px
    const [isResizing, setIsResizing] = useState(false);

    // Mobile detection
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Sync modal state to global store for Z-index coordination
    useEffect(() => {
        const isAnyModalOpen = showHistory || showNightAction || showRoleReference || showCompositionGuide || showScriptEditor;
        setModalOpen(isAnyModalOpen);
    }, [showHistory, showNightAction, showRoleReference, showCompositionGuide, showScriptEditor, setModalOpen]);

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = window.innerWidth - e.clientX;
            if (newWidth > 250 && newWidth < 800) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    // Auto-trigger player night action
    useEffect(() => {
        if (!user || !gameState || user.isStoryteller) return;
        if (gameState.phase !== 'NIGHT') return;

        const currentSeat = gameState.seats.find(s => s.userId === user.id);
        if (!currentSeat?.seenRoleId) return;

        const currentNightRole = gameState.nightQueue[gameState.nightCurrentIndex];
        if (currentNightRole === currentSeat.seenRoleId) {
            const role = ROLES[currentSeat.seenRoleId];
            if (role?.nightAction) {
                setShowNightAction(true);
                if (gameState.vibrationEnabled) {
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200]);
                    }
                }
                try {
                    const wakeSound = new Audio('/audio/sfx/wake.mp3');
                    wakeSound.volume = 0.3;
                    wakeSound.play().catch((e: unknown) => console.warn('Audio blocked:', e));
                } catch {
                    // Ignore audio errors
                }
            }
        }
    }, [gameState?.phase, gameState?.nightCurrentIndex, user?.id]);

    if (!user || !gameState) return null;

    const currentSeat = gameState.seats.find(s => s.userId === user.id);

    const tabs = [
        { id: 'game' as const, label: '游戏', icon: <Gamepad2 className="w-4 h-4" /> },
        { id: 'chat' as const, label: '聊天', icon: <MessageSquare className="w-4 h-4" /> },
        ...(user.isStoryteller ? [
            { id: 'ai' as const, label: 'AI助手', icon: <Bot className="w-4 h-4" /> },
            { id: 'audio' as const, label: '音效', icon: <Music className="w-4 h-4" /> }
        ] : []),
        { id: 'notebook' as const, label: '笔记', icon: <Book className="w-4 h-4" /> },
    ];

    return (
        <div
            className="glass-panel border-l border-stone-800 flex flex-col h-full shadow-2xl font-serif relative transition-none"
            style={{ width: isMobile ? '100%' : `${String(width)}px` }}
        >
            {/* Drag Handle (Desktop Only) */}
            {!isMobile && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-amber-500/50 transition-colors flex items-center justify-center group"
                    style={{ zIndex: Z_INDEX.dropdown }}
                    onMouseDown={() => setIsResizing(true)}
                >
                    <GripVertical className="w-3 h-3 text-stone-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            )}

            {/* --- Header: User Info --- */}
            <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-start justify-between shadow-md z-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 to-transparent pointer-events-none" />
                <div className="relative z-10">
                    <h2 className="text-lg font-bold text-stone-200 font-cinzel truncate max-w-[200px]">{user.name}</h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={cn(
                            "px-2 py-0.5 rounded border text-xs font-bold uppercase tracking-wider",
                            user.isStoryteller ? 'bg-red-950/30 border-red-800 text-red-400' : 'bg-blue-950/30 border-blue-800 text-blue-400'
                        )}>
                            {user.isStoryteller ? '说书人' : '村民'}
                        </span>
                        {currentSeat && <span className="text-stone-500 text-xs">座位 {currentSeat.id + 1}</span>}
                    </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                    {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="md:hidden text-stone-400 hover:text-white">
                            <X className="w-5 h-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* GAME OVER BANNER */}
            {gameState.gameOver.isOver && (
                <div className={cn(
                    "p-4 text-center border-b-4 animate-in slide-in-from-top duration-500",
                    gameState.gameOver.winner === 'GOOD' ? 'bg-blue-900/90 border-blue-500' : 'bg-red-900/90 border-red-500'
                )}>
                    <h2 className="text-2xl font-bold text-white font-cinzel tracking-widest drop-shadow-md">
                        {gameState.gameOver.winner === 'GOOD' ? '好人胜利' : '邪恶胜利'}
                    </h2>
                    <p className="text-xs text-white/80 mt-1 font-serif italic">{gameState.gameOver.reason}</p>
                </div>
            )}

            {/* Room Code Banner */}
            <div className="bg-stone-900/50 border-b border-stone-800 p-3 flex justify-between items-center px-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider font-cinzel">房间号</span>
                    <span className="text-xl font-mono font-bold text-stone-200 tracking-[0.2em]">{gameState.roomId}</span>
                </div>
                {isOffline ? (
                    <span className="text-xs font-bold text-red-400 bg-red-950/30 border border-red-900 px-2 py-1 rounded animate-pulse">
                        离线 / 演示
                    </span>
                ) : (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={leaveGame}
                        className="text-stone-500 hover:text-red-400 hover:bg-red-950/20 h-8 text-xs uppercase tracking-wider"
                    >
                        离开
                    </Button>
                )}
            </div>

            {/* --- Tabs --- */}
            <div className="flex border-b border-stone-800 text-sm bg-stone-950/95 backdrop-blur font-cinzel sticky top-0 z-20 shadow-lg overflow-x-auto scrollbar-none">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 relative overflow-hidden group flex items-center justify-center gap-2 min-w-[80px]",
                            activeTab === tab.id
                                ? 'border-amber-600 text-amber-500 bg-black/40'
                                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-black/20'
                        )}
                    >
                        <span className="group-hover:scale-110 transition-transform">{tab.icon}</span>
                        <span>{tab.label}</span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute inset-0 bg-amber-600/5 pointer-events-none"
                                initial={false}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* --- Content Area --- */}
            <div className="flex-1 overflow-hidden relative bg-stone-900/30">

                {/* Tab: Game Controls */}
                {activeTab === 'game' && (
                    <div className="h-full overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent">
                        <div className="text-center p-4 bg-black/40 rounded border border-stone-800 shadow-inner backdrop-blur-sm">
                            <div className="text-xs text-stone-500 uppercase tracking-[0.2em] mb-1 font-cinzel">当前阶段</div>
                            <div className="text-3xl font-bold text-amber-600 tracking-widest font-cinzel drop-shadow-md">{PHASE_LABELS[gameState.phase]}</div>
                        </div>

                        <VoiceRoomLink />

                        {user.isStoryteller ? (
                            <ControlsSTSection
                                onShowCompositionGuide={() => setShowCompositionGuide(true)}
                                onShowNightAction={(roleId) => {
                                    setCurrentNightRole(roleId);
                                    setShowNightAction(true);
                                }}
                                onShowHistory={() => setShowHistory(true)}
                                onShowScriptEditor={() => setShowScriptEditor(true)}
                            />
                        ) : (
                            <ControlsPlayerSection
                                onShowHistory={() => setShowHistory(true)}
                                onShowNightAction={() => setShowNightAction(true)}
                            />
                        )}
                    </div>
                )}

                {/* Tab: Chat */}
                {activeTab === 'chat' && (
                    <div className="h-full flex flex-col">
                        <Chat />
                    </div>
                )}

                {/* Tab: AI */}
                {activeTab === 'ai' && <ControlsAITab />}

                {/* Tab: Notebook */}
                {activeTab === 'notebook' && (
                    <div className="h-full">
                        {user.isStoryteller ? <StorytellerNotebook /> : <PlayerNotebook />}
                    </div>
                )}

                {/* Tab: Audio */}
                {activeTab === 'audio' && user.isStoryteller && (
                    <ControlsAudioTab />
                )}
            </div>

            {/* --- Modals --- */}
            {showHistory && createPortal(
                <GameHistoryView onClose={() => setShowHistory(false)} />,
                document.body
            )}
            {showRoleReference && createPortal(
                <RoleReferencePanel
                    isOpen={showRoleReference}
                    onClose={() => setShowRoleReference(false)}
                    playerRoleId={currentSeat?.seenRoleId ?? null}
                    scriptRoles={SCRIPTS[gameState.currentScriptId]?.roles.map(id => ROLES[id]).filter((r): r is import('../../types').RoleDef => !!r) ?? []}
                />,
                document.body
            )}
            {showCompositionGuide && createPortal(
                <ScriptCompositionGuide
                    onClose={() => setShowCompositionGuide(false)}
                    playerCount={gameState.seats.length || 7}
                    onApplyStrategy={(strategy, roles) => {
                        if (roles) {
                            const allRoles = [
                                ...roles.townsfolk,
                                ...roles.outsider,
                                ...roles.minion,
                                ...roles.demon
                            ].map(r => r.id);

                            useStore.getState().applyStrategy(strategy.name, allRoles);
                        }
                        setShowCompositionGuide(false);
                    }}
                />,
                document.body
            )}
            {showNightAction && user.isStoryteller && currentNightRole && createPortal(
                <NightActionPanel
                    roleId={currentNightRole}
                    onComplete={() => setShowNightAction(false)}
                />,
                document.body
            )}
            {showNightAction && !user.isStoryteller && currentSeat?.seenRoleId && createPortal(
                <PlayerNightAction
                    roleId={currentSeat.seenRoleId}
                    onComplete={() => setShowNightAction(false)}
                />,
                document.body
            )}
            {showScriptEditor && createPortal(
                <ScriptEditor onClose={() => setShowScriptEditor(false)} />,
                document.body
            )}
        </div>
    );
};

