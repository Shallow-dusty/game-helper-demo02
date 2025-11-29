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
import { ControlsSTSection } from './ControlsSTSection';
import { ControlsPlayerSection } from './ControlsPlayerSection';
import { ControlsAudioTab } from './ControlsAudioTab';

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
            // Calculate new width: Window width - Mouse X
            // (Since sidebar is on the right)
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
            // It's my turn!
            // Check if I have a night action
            const role = ROLES[currentSeat.roleId];
            if (role?.nightAction) {
                setShowNightAction(true);

                // FR-03: 震动 + 音效提醒玩家唤醒（仅在说书人开启时）
                if (gameState.vibrationEnabled) {
                    // 震动 API
                    if ('vibrate' in navigator) {
                        navigator.vibrate([200, 100, 200]); // 短-停-短 模式
                    }
                }

                // 播放唤醒音效（音效不受振动开关影响，音量小不易察觉）
                try {
                    const wakeSound = new Audio('/sounds/wake.mp3');
                    wakeSound.volume = 0.3;
                    wakeSound.play().catch(e => console.log('音效播放被浏览器阻止:', e));
                } catch (e) {
                    // 忽略音效加载失败
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
        // setActiveTab('chat'); // No longer switch to chat
        await askAi(prompt);
    };

    return (
        <div
            className="bg-stone-950 border-l border-stone-800 flex flex-col h-full shadow-2xl font-serif relative transition-none"
            style={{ width: isMobile ? '100%' : `${width}px` }}
        >
            {/* Drag Handle (Desktop Only) */}
            {!isMobile && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-purple-500/50 transition-colors"
                    style={{ zIndex: Z_INDEX.dropdown }}
                    onMouseDown={() => setIsResizing(true)}
                />
            )}

            {/* --- Header: User Info --- */}
            <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-start justify-between shadow-md z-10">
                <div>
                    <h2 className="text-lg font-bold text-stone-200 font-cinzel truncate max-w-[200px]">{user.name}</h2>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`px-2 py-0.5 rounded border ${user.isStoryteller ? 'bg-purple-950/30 border-purple-800 text-purple-300' : 'bg-blue-950/30 border-blue-800 text-blue-300'}`}>
                            {user.isStoryteller ? '说书人' : '村民'}
                        </span>
                        {currentSeat && <span className="text-stone-500">座位 {currentSeat.id + 1}</span>}
                    </div>
                </div>

                {/* Mobile Close Button */}
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button onClick={onClose} className="md:hidden text-stone-400 hover:text-white p-2 bg-stone-900 rounded-full w-10 h-10 flex items-center justify-center active:bg-stone-800">
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* GAME OVER BANNER */}
            {gameState.gameOver?.isOver && (
                <div className={`p-4 text-center border-b-4 animate-bounce ${gameState.gameOver.winner === 'GOOD' ? 'bg-blue-900 border-blue-500' : 'bg-red-900 border-red-500'}`}>
                    <h2 className="text-2xl font-bold text-white font-cinzel tracking-widest">
                        {gameState.gameOver.winner === 'GOOD' ? '好人胜利' : '邪恶胜利'}
                    </h2>
                    <p className="text-xs text-white/80 mt-1">{gameState.gameOver.reason}</p>
                </div>
            )}

            {/* Room Code Banner */}
            <div className="bg-stone-900 border-b border-stone-800 p-2 flex justify-between items-center px-4">
                <div className="flex flex-col">
                    <span className="text-[10px] text-stone-500 uppercase tracking-wider">房间号</span>
                    <span className="text-xl font-mono font-bold text-stone-200 tracking-[0.2em]">{gameState.roomId}</span>
                </div>
                {isOffline ? (
                    <span className="text-xs font-bold text-red-400 bg-red-950/30 border border-red-900 px-2 py-1 rounded animate-pulse">
                        离线 / 演示
                    </span>
                ) : (
                    <button onClick={leaveGame} className="text-xs text-stone-500 hover:text-red-400 transition-colors border border-stone-800 hover:border-red-900 px-2 py-1 rounded">
                        离开
                    </button>
                )}
            </div>



            {/* --- Tabs --- */}
            <div className="flex border-b border-stone-800 text-sm bg-stone-950 font-cinzel sticky top-0 z-20">
                <button
                    onClick={() => setActiveTab('game')}
                    className={`flex-1 py-4 md:py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'game' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                >
                    <span className="text-lg md:text-base mr-1">🎮</span> 游戏
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-4 md:py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'chat' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                >
                    <span className="text-lg md:text-base mr-1">💬</span> 聊天
                </button>
                {/* AI 助手仅对说书人显示 */}
                {user.isStoryteller && (
                    <button
                        onClick={() => setActiveTab('ai')}
                        className={`flex-1 py-4 md:py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'ai' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                    >
                        <span className="text-lg md:text-base mr-1">🤖</span> 助手
                    </button>
                )}
                {user.isStoryteller && (
                    <button
                        onClick={() => setActiveTab('audio')}
                        className={`flex-1 py-4 md:py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'audio' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                    >
                        <span className="text-lg md:text-base mr-1">🎵</span> 音效
                    </button>
                )}
                <button
                    onClick={() => setActiveTab('notebook')}
                    className={`flex-1 py-4 md:py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'notebook' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                >
                    <span className="text-lg md:text-base mr-1">📓</span> 笔记
                </button>
            </div>

            {/* --- Content Area --- */}
            <div className="flex-1 overflow-hidden relative bg-stone-900/50">

                {/* Tab: Game Controls */}
                {activeTab === 'game' && (
                    <div className="h-full overflow-y-auto p-4 space-y-6 scrollbar-thin">

                        {/* GAME PHASE DISPLAY */}
                        <div className="text-center p-4 bg-black/40 rounded border border-stone-800 shadow-inner backdrop-blur-sm">
                            <div className="text-xs text-stone-500 uppercase tracking-[0.2em] mb-1 font-cinzel">Current Phase</div>
                            <div className="text-3xl font-bold text-amber-600 tracking-widest font-cinzel drop-shadow-md">{PHASE_LABELS[gameState.phase]}</div>
                        </div>

                        {/* ST CONTROLS */}
                        {user.isStoryteller && (
                            <ControlsSTSection
                                onShowCompositionGuide={() => setShowCompositionGuide(true)}
                                onShowNightAction={(roleId) => {
                                    setCurrentNightRole(roleId);
                                    setShowNightAction(true);
                                }}
                            />
                        )}

                        {/* PLAYER CONTROLS */}
                        {!user.isStoryteller && (
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
                        <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin">
                            {/* AI Messages */}
                            {gameState.aiMessages.length === 0 && (
                                <div className="text-center text-stone-500 py-8">
                                    <div className="text-3xl mb-2">🤖</div>
                                    <p className="text-sm">AI 助手就绪</p>
                                    <p className="text-xs text-stone-600 mt-1">输入问题，获取游戏建议</p>
                                </div>
                            )}
                            {gameState.aiMessages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-stone-800 text-stone-200'
                                        : msg.role === 'system'
                                            ? 'bg-red-900/30 text-red-300 border border-red-800/30'
                                            : 'bg-amber-900/30 text-amber-100 border border-amber-800/30'
                                        }`}>
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
                                    <div className="bg-amber-900/30 text-amber-100 p-3 rounded-lg text-sm border border-amber-800/30 animate-pulse">
                                        思考中...
                                    </div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleAiSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="询问 AI 助手..."
                                className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-stone-300 focus:border-amber-600 focus:outline-none"
                            />
                            <button type="submit" disabled={!aiPrompt.trim() || isAiThinking} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-2 rounded">
                                发送
                            </button>
                        </form>
                        {user.isStoryteller && (
                            <div className="mt-2 flex justify-between items-center">
                                <button onClick={clearAiMessages} className="text-xs text-stone-500 hover:text-stone-300">清空记录</button>
                                <select
                                    value={aiProvider}
                                    onChange={(e) => setAiProvider(e.target.value as any)}
                                    className="bg-stone-950 border border-stone-800 text-[10px] text-stone-500 rounded px-1"
                                >
                                    <optgroup label="官方 API（推荐）">
                                        <option value="deepseek">DeepSeek V3 (稳定)</option>
                                    </optgroup>
                                    <optgroup label="其他（可能有 CORS 问题）">
                                        <option value="kimi">Kimi K2</option>
                                        <option value="sf_r1">DeepSeek R1 (SF)</option>
                                        <option value="sf_r1_llama_70b">R1 Llama 70B (SF)</option>
                                        <option value="sf_r1_qwen_32b">R1 Qwen 32B (SF)</option>
                                    </optgroup>
                                </select>
                            </div>
                        )}
                        <p className="text-[10px] text-stone-600 mt-2 text-center">
                            💡 提示：仅 DeepSeek 官方 API 稳定可用，其他 API 可能因 CORS 策略无法访问
                        </p>
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

            {/* --- Modals (Portaled to body to avoid z-index/transform issues) --- */}
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
            {/* Player Night Action Modal */}
            {showNightAction && !user.isStoryteller && currentSeat?.roleId && createPortal(
                <PlayerNightAction
                    roleId={currentSeat.roleId}
                    onComplete={() => setShowNightAction(false)}
                />,
                document.body
            )}
        </div>
    );
};
