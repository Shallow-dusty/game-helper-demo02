import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { ROLES, PHASE_LABELS, SCRIPTS, Z_INDEX } from '../constants';
import { Chat } from './Chat';
import { GameHistoryView } from './GameHistoryView';
import { NightActionPanel } from './NightActionPanel';
import { StorytellerNotebook } from './StorytellerNotebook';
import { PlayerNotebook } from './PlayerNotebook';
import { PlayerNightAction } from './PlayerNightAction';
import { RoleReferencePanel } from './RoleReferencePanel';
import { ScriptCompositionGuide } from './ScriptCompositionGuide';
import { ScriptEditor } from './ScriptEditor';
import { ControlsSTSection } from './ControlsSTSection';
import { ControlsPlayerSection } from './ControlsPlayerSection';
import { ControlsAudioTab } from './ControlsAudioTab';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { Gamepad2, MessageSquare, Bot, Book, Music, X, GripVertical } from 'lucide-react';

interface ControlsProps {
    onClose?: () => void; // For mobile drawer closing
}

export const Controls: React.FC<ControlsProps> = ({ onClose }) => {
    const user = useStore(state => state.user);
    const gameState = useStore(state => state.gameState);
    const askAi = useStore(state => state.askAi);
    const isAiThinking = useStore(state => state.isAiThinking);
    const leaveGame = useStore(state => state.leaveGame);
    const isOffline = useStore(state => state.isOffline);

    // AI Provider settings
    const aiProvider = useStore(state => state.aiProvider);
    const setAiProvider = useStore(state => state.setAiProvider);
    const clearAiMessages = useStore(state => state.clearAiMessages);
    const deleteAiMessage = useStore(state => state.deleteAiMessage);

    const [activeTab, setActiveTab] = useState<'game' | 'chat' | 'ai' | 'notebook' | 'audio'>(() => {
        const saved = localStorage.getItem('grimoire_active_tab');
        return (saved === 'game' || saved === 'chat' || saved === 'ai' || saved === 'notebook' || saved === 'audio') ? saved : 'game';
    });

    useEffect(() => {
        localStorage.setItem('grimoire_active_tab', activeTab);
    }, [activeTab]);

    const [aiPrompt, setAiPrompt] = useState('');
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
        if (!currentSeat?.roleId) return;

        const currentNightRole = gameState.nightQueue[gameState.nightCurrentIndex];
        if (currentNightRole === currentSeat.roleId) {
            const role = ROLES[currentSeat.roleId];
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
                    wakeSound.play().catch(e => console.log('Audio blocked:', e));
                } catch (e) {
                    // Ignore audio errors
                }
            }
        }
    }, [gameState?.phase, gameState?.nightCurrentIndex, user?.id]);

    if (!user || !gameState) return null;

    const currentSeat = gameState.seats.find(s => s.userId === user.id);

    const handleAiSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiPrompt.trim()) return;
        const prompt = aiPrompt;
        setAiPrompt('');
        await askAi(prompt);
    };

    const tabs = [
        { id: 'game', label: '游戏', icon: <Gamepad2 className="w-4 h-4" /> },
        { id: 'chat', label: '聊天', icon: <MessageSquare className="w-4 h-4" /> },
        ...(user.isStoryteller ? [
            { id: 'ai', label: 'AI助手', icon: <Bot className="w-4 h-4" /> },
            { id: 'audio', label: '音效', icon: <Music className="w-4 h-4" /> }
        ] : []),
        { id: 'notebook', label: '笔记', icon: <Book className="w-4 h-4" /> },
    ];

    return (
        <div
            className="bg-stone-950 border-l border-stone-800 flex flex-col h-full shadow-2xl font-serif relative transition-none"
            style={{ width: isMobile ? '100%' : `${width}px` }}
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
            {gameState.gameOver?.isOver && (
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
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex-1 py-3 px-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 relative overflow-hidden group flex items-center justify-center gap-2 min-w-[80px]",
                            activeTab === tab.id
                                ? 'border-amber-600 text-amber-500 bg-stone-900/50'
                                : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/30'
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
                {activeTab === 'ai' && (
                    <div className="h-full flex flex-col p-4">
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin scrollbar-thumb-stone-800">
                            {gameState.aiMessages.length === 0 && (
                                <div className="text-center text-stone-500 py-8 flex flex-col items-center gap-3">
                                    <Bot className="w-12 h-12 opacity-50" />
                                    <p className="text-sm font-cinzel">AI 助手已就绪</p>
                                    <p className="text-xs text-stone-600">询问规则、建议或背景故事。</p>
                                </div>
                            )}
                            {gameState.aiMessages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={cn(
                                        "max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap shadow-sm",
                                        msg.role === 'user' ? 'bg-stone-800 text-stone-200' :
                                            msg.role === 'system' ? 'bg-red-900/30 text-red-300 border border-red-800/30' :
                                                'bg-amber-900/30 text-amber-100 border border-amber-800/30'
                                    )}>
                                        {msg.content}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-stone-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        {user.isStoryteller && msg.role !== 'user' && (
                                            <button onClick={() => deleteAiMessage(msg.id)} className="text-[10px] text-red-900 hover:text-red-500">删除</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isAiThinking && (
                                <div className="flex items-start">
                                    <div className="bg-amber-900/30 text-amber-100 p-3 rounded-lg text-sm border border-amber-800/30 animate-pulse flex items-center gap-2">
                                        <Bot className="w-4 h-4" /> 思考中...
                                    </div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleAiSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="询问魔典..."
                                className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-stone-300 focus:border-amber-600 focus:outline-none placeholder:text-stone-700"
                            />
                            <Button type="submit" disabled={!aiPrompt.trim() || isAiThinking} size="sm">
                                发送
                            </Button>
                        </form>
                        {user.isStoryteller && (
                            <div className="mt-2 flex justify-between items-center">
                                <button onClick={clearAiMessages} className="text-xs text-stone-500 hover:text-stone-300">清除历史</button>
                                <select
                                    value={aiProvider}
                                    onChange={(e) => setAiProvider(e.target.value as any)}
                                    className="bg-stone-950 border border-stone-800 text-[10px] text-stone-500 rounded px-1 focus:outline-none focus:border-stone-600"
                                >
                                    <optgroup label="官方 API">
                                        <option value="deepseek">DeepSeek V3</option>
                                    </optgroup>
                                    <optgroup label="其他 (可能存在跨域问题)">
                                        <option value="kimi">Kimi K2</option>
                                        <option value="sf_r1">DeepSeek R1 (SF)</option>
                                        <option value="sf_r1_llama_70b">R1 Llama 70B (SF)</option>
                                        <option value="sf_r1_qwen_32b">R1 Qwen 32B (SF)</option>
                                    </optgroup>
                                </select>
                            </div>
                        )}
                    </div>
                )}

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
                    playerRoleId={currentSeat?.roleId || null}
                    scriptRoles={SCRIPTS[gameState.currentScriptId]?.roles.map(id => ROLES[id]).filter((r): r is import('../types').RoleDef => !!r) || []}
                />,
                document.body
            )}
            {showCompositionGuide && gameState?.seats && createPortal(
                <ScriptCompositionGuide
                    onClose={() => setShowCompositionGuide(false)}
                    playerCount={gameState.seats.filter(s => s.userId || s.isVirtual).length || gameState.seats.length || 7}
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
            {showNightAction && !user.isStoryteller && currentSeat?.roleId && createPortal(
                <PlayerNightAction
                    roleId={currentSeat.roleId}
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

