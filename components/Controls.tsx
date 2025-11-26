import React, { useState } from 'react';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS, PHASE_LABELS, AUDIO_TRACKS, SCRIPTS } from '../constants';
import { Chat } from './Chat';
import { HistoryViewer } from './HistoryViewer';
import { NightActionPanel } from './NightActionPanel';
import { StorytellerNotebook } from './StorytellerNotebook';
import { HelpModal } from './HelpModal';

interface ControlsProps {
    onClose?: () => void; // For mobile drawer closing
}

export const Controls: React.FC<ControlsProps> = ({ onClose }) => {
    const user = useStore(state => state.user);
    const gameState = useStore(state => state.gameState);
    const setPhase = useStore(state => state.setPhase);
    const setScript = useStore(state => state.setScript);
    const nightNext = useStore(state => state.nightNext);
    const nightPrev = useStore(state => state.nightPrev);
    const nextClockHand = useStore(state => state.nextClockHand);
    const toggleHand = useStore(state => state.toggleHand);
    const closeVote = useStore(state => state.closeVote);
    const askAi = useStore(state => state.askAi);
    const isAiThinking = useStore(state => state.isAiThinking);
    const toggleWhispers = useStore(state => state.toggleWhispers);
    const leaveGame = useStore(state => state.leaveGame);
    const isOffline = useStore(state => state.isOffline);

    // Audio Actions
    const setAudioTrack = useStore(state => state.setAudioTrack);
    const toggleAudioPlay = useStore(state => state.toggleAudioPlay);
    const setAudioVolume = useStore(state => state.setAudioVolume);
    const aiProvider = useStore(state => state.aiProvider);
    const setAiProvider = useStore(state => state.setAiProvider);
    const clearAiMessages = useStore(state => state.clearAiMessages);
    const deleteAiMessage = useStore(state => state.deleteAiMessage);

    const [activeTab, setActiveTab] = useState<'game' | 'chat' | 'ai' | 'notebook'>('game');
    const [aiPrompt, setAiPrompt] = useState('');
    const [showHistory, setShowHistory] = useState(false);
    const [showNightAction, setShowNightAction] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [currentNightRole, setCurrentNightRole] = useState<string | null>(null);

    const [width, setWidth] = useState(320); // Default 320px
    const [isResizing, setIsResizing] = useState(false);

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

    if (!user || !gameState) return null;

    const currentSeat = gameState.seats.find(s => s.userId === user.id);
    const role = currentSeat?.roleId ? ROLES[currentSeat.roleId] : null;

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
            style={{ width: `${width}px` }}
        >
            {/* Drag Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-purple-500/50 z-50 transition-colors"
                onMouseDown={() => setIsResizing(true)}
            />

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
                {onClose && (
                    <button onClick={onClose} className="md:hidden text-stone-400 hover:text-white p-2">
                        ✕
                    </button>
                )}
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



            {/* Player Role Reveal (In Header Area) */}
            {!user.isStoryteller && role && (
                <div className="px-4 pb-4 border-b border-stone-800 bg-stone-950/50">
                    <div className="p-4 bg-stone-900 rounded border border-stone-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-20 text-4xl">
                            {role.team === 'DEMON' ? '👿' : role.team === 'MINION' ? '🧪' : '⚜️'}
                        </div>
                        <div className="font-bold flex justify-between items-center text-lg font-cinzel" style={{ color: TEAM_COLORS[role.team] }}>
                            <span>{role.name}</span>
                        </div>
                        <span className="text-[10px] opacity-70 border border-current px-1.5 py-0.5 rounded uppercase tracking-widest" style={{ color: TEAM_COLORS[role.team] }}>
                            {role.team === 'TOWNSFOLK' ? '村民' :
                                role.team === 'MINION' ? '爪牙' :
                                    role.team === 'DEMON' ? '恶魔' : '外来者'}
                        </span>
                        {gameState.skillDescriptionMode === 'detailed' && (
                            <p className="text-sm text-stone-400 mt-3 leading-relaxed italic border-t border-stone-800 pt-2">{role.ability}</p>
                        )}
                    </div>
                </div>
            )}

            {/* --- Tabs --- */}
            <div className="flex border-b border-stone-800 text-sm bg-stone-950 font-cinzel">
                <button
                    onClick={() => setActiveTab('game')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'game' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                >
                    🎮 游戏
                </button>
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'chat' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                >
                    💬 聊天
                </button>
                <button
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'ai' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                >
                    🤖 助手
                </button>
                {user.isStoryteller && (
                    <button
                        onClick={() => setActiveTab('notebook')}
                        className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'notebook' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                    >
                        📓 笔记
                    </button>
                )}
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
                            <div className="space-y-6">

                                {/* Script Selector */}
                                <div className="bg-stone-900 p-3 rounded border border-stone-700">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="text-xs font-bold text-stone-500 uppercase block">📖 剧本 (Script)</label>
                                        <label className="cursor-pointer text-[10px] text-blue-400 hover:text-blue-300 border border-blue-900/50 px-2 py-0.5 rounded bg-blue-950/20 transition-colors">
                                            📥 导入 (Import)
                                            <input
                                                type="file"
                                                accept=".json"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => {
                                                            const content = ev.target?.result as string;
                                                            if (content) useStore.getState().importScript(content);
                                                        };
                                                        reader.readAsText(file);
                                                    }
                                                    e.target.value = ''; // Reset
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <select
                                        value={gameState.currentScriptId}
                                        onChange={(e) => setScript(e.target.value)}
                                        className="w-full bg-stone-950 border border-stone-700 rounded text-sm text-stone-300 p-2"
                                    >
                                        <optgroup label="官方剧本">
                                            {Object.values(SCRIPTS).map(script => (
                                                <option key={script.id} value={script.id}>{script.name}</option>
                                            ))}
                                        </optgroup>
                                        {Object.keys(gameState.customScripts || {}).length > 0 && (
                                            <optgroup label="自定义剧本">
                                                {Object.values(gameState.customScripts).map(script => (
                                                    <option key={script.id} value={script.id}>{script.name}</option>
                                                ))}
                                            </optgroup>
                                        )}
                                    </select>
                                </div>

                                {/* Game Setup */}
                                <div className="bg-stone-900 p-3 rounded border border-stone-700 space-y-2">
                                    <div className="text-xs font-bold text-stone-500 uppercase">⚙️ 游戏设置 (Setup)</div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => useStore.getState().addVirtualPlayer()}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                            title="添加一个虚拟玩家占位"
                                        >
                                            <span>🤖</span> 添加虚拟玩家
                                        </button>
                                        <button
                                            onClick={() => useStore.getState().toggleSkillDescriptionMode()}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                            title="切换技能描述显示模式"
                                        >
                                            <span>{gameState.skillDescriptionMode === 'simple' ? '📝' : '📄'}</span>
                                            {gameState.skillDescriptionMode === 'simple' ? '详细模式' : '简单模式'}
                                        </button>
                                        <button
                                            onClick={() => useStore.getState().autoAssignRoles()}
                                            disabled={gameState.setupPhase !== 'ASSIGNING'}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                        >
                                            <span>🎲</span> 自动分配角色
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            onClick={() => gameState.rolesRevealed ? useStore.getState().hideRoles() : useStore.getState().revealRoles()}
                                            className={`py-2 px-3 rounded text-xs border transition-colors flex items-center justify-center gap-1
                                                ${gameState.rolesRevealed
                                                    ? 'bg-amber-900/30 text-amber-500 border-amber-900'
                                                    : 'bg-stone-800 text-stone-300 border-stone-600 hover:bg-stone-700'}
                                            `}
                                        >
                                            <span>{gameState.rolesRevealed ? '🫣' : '👀'}</span>
                                            {gameState.rolesRevealed ? '隐藏角色' : '发放角色'}
                                        </button>
                                        <button
                                            onClick={() => useStore.getState().startGame()}
                                            disabled={gameState.setupPhase === 'STARTED'}
                                            className="bg-red-900 hover:bg-red-800 text-red-100 py-2 px-3 rounded text-xs border border-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                                        >
                                            <span>🌙</span> 开始游戏
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* AUDIO CONTROL PANEL */}
                        <div className="bg-stone-900/80 p-3 rounded border border-stone-700 shadow-md">
                            <h3 className="text-xs font-bold text-stone-500 uppercase mb-2 flex items-center gap-2">
                                🎵 氛围音效 (Atmosphere)
                            </h3>
                            <div className="flex flex-col gap-2">
                                <select
                                    className="w-full bg-stone-950 border border-stone-700 rounded text-xs text-stone-300 p-2 outline-none focus:border-stone-500"
                                    value={gameState.audio.trackId || ''}
                                    onChange={(e) => setAudioTrack(e.target.value)}
                                >
                                    <option value="">-- 选择曲目 --</option>
                                    {Object.entries(AUDIO_TRACKS).map(([key, track]) => (
                                        <option key={key} value={key}>{track.name}</option>
                                    ))}
                                </select>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={toggleAudioPlay}
                                        className={`flex-1 py-1.5 rounded text-xs font-bold border transition-colors ${gameState.audio.isPlaying ? 'bg-red-900/50 border-red-800 text-red-200' : 'bg-stone-800 border-stone-600 text-stone-400'}`}
                                    >
                                        {gameState.audio.isPlaying ? '❚❚ 暂停' : '▶ 播放'}
                                    </button>
                                    <input
                                        type="range"
                                        min="0" max="1" step="0.1"
                                        value={gameState.audio.volume}
                                        onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                                        className="w-24 accent-red-700 h-1 bg-stone-700 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>

                        <h3 className="text-xs font-bold text-stone-500 uppercase border-b border-stone-800 pb-1 font-cinzel flex justify-between items-center">
                            说书人工具
                            <button onClick={() => setShowHelp(true)} className="text-stone-500 hover:text-stone-300 text-[10px] border border-stone-700 px-1.5 rounded-full transition-colors" title="操作指南">?</button>
                        </h3>

                        {/* History Button */}
                        <button
                            onClick={() => setShowHistory(true)}
                            className="w-full btn flex items-center justify-center gap-2 font-serif bg-stone-800 border-stone-600 text-stone-300 hover:bg-stone-700"
                        >
                            <span>📜</span> 历史记录 (History)
                        </button>

                        {/* Phase Management */}
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setPhase('DAY')} className={`btn font-cinzel ${gameState.phase === 'DAY' ? 'bg-amber-900/80 ring-1 ring-amber-600 text-amber-100' : 'bg-stone-800 text-stone-400'}`}>☀ 白天</button>
                            <button onClick={() => setPhase('NIGHT')} className={`btn font-cinzel ${gameState.phase === 'NIGHT' ? 'bg-indigo-950 ring-1 ring-indigo-600 text-indigo-200' : 'bg-stone-800 text-stone-400'}`}>🌙 夜晚</button>
                            <button onClick={() => setPhase('NOMINATION')} className={`btn font-cinzel ${gameState.phase === 'NOMINATION' ? 'bg-emerald-900/80 ring-1 ring-emerald-600 text-emerald-100' : 'bg-stone-800 text-stone-400'}`}>⚖ 提名</button>
                        </div>

                        {/* Whisper Toggle */}
                        <button
                            onClick={toggleWhispers}
                            className={`w-full btn flex items-center justify-center gap-2 font-serif ${gameState.allowWhispers ? 'bg-stone-800 border-stone-600 text-stone-300' : 'bg-red-950 border-red-800 text-red-300'}`}
                        >
                            <span>{gameState.allowWhispers ? '🟢' : '🔴'}</span>
                            {gameState.allowWhispers ? '允许私聊 (Whispers On)' : '禁止私聊 (Whispers Off)'}
                        </button>

                        {/* Night Queue Manager */}
                        {gameState.phase === 'NIGHT' && (
                            <div className="bg-black/30 p-3 rounded border border-indigo-900/50 shadow-lg">
                                <div className="text-xs text-indigo-400/70 mb-2 flex justify-between uppercase tracking-wider">
                                    <span>夜间行动顺序</span>
                                    <span>{gameState.nightCurrentIndex + 1} / {gameState.nightQueue.length}</span>
                                </div>
                                <div className="flex items-center justify-between mb-3 bg-indigo-950/30 p-2 rounded border border-indigo-900/30">
                                    <button onClick={nightPrev} className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400">&lt;</button>
                                    <span className={`font-serif text-lg font-bold ${gameState.nightCurrentIndex >= 0 ? 'text-indigo-200' : 'text-stone-600'}`}>
                                        {gameState.nightCurrentIndex >= 0 ? ROLES[gameState.nightQueue[gameState.nightCurrentIndex]]?.name || '天亮' : '入夜'}
                                    </span>
                                    <button onClick={nightNext} className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400">&gt;</button>
                                </div>
                                <div className="text-[10px] text-stone-500 flex flex-wrap gap-1.5">
                                    {gameState.nightQueue.map((rid, idx) => (
                                        <span
                                            key={idx}
                                            className={`px-1.5 py-0.5 rounded transition-all border ${idx === gameState.nightCurrentIndex ? 'bg-indigo-900 text-indigo-100 border-indigo-500 shadow-[0_0_10px_#4f46e5]' : idx < gameState.nightCurrentIndex ? 'text-stone-700 border-transparent decoration-stone-700 line-through' : 'bg-stone-800 text-stone-500 border-stone-700'}`}
                                        >
                                            {ROLES[rid]?.name}
                                        </span>
                                    ))}
                                </div>

                                {/* Night Action Button */}
                                {gameState.nightCurrentIndex >= 0 && gameState.nightQueue[gameState.nightCurrentIndex] && ROLES[gameState.nightQueue[gameState.nightCurrentIndex]]?.nightAction && (
                                    <button
                                        onClick={() => {
                                            setCurrentNightRole(gameState.nightQueue[gameState.nightCurrentIndex]);
                                            setShowNightAction(true);
                                        }}
                                        className="mt-3 w-full py-2 bg-purple-900/50 hover:bg-purple-800/50 border border-purple-700 text-purple-200 rounded font-bold text-sm transition-all shadow-lg"
                                    >
                                        🌙 执行夜间动作
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Voting Controls */}
                        {gameState.voting?.isOpen && (
                            <div className="bg-amber-950/20 border border-amber-800/50 p-4 rounded shadow-[0_0_20px_rgba(180,83,9,0.1)] animate-fade-in">
                                <div className="text-xs text-amber-600 mb-3 font-bold uppercase tracking-widest text-center">投票进行中</div>
                                <div className="text-sm mb-4 flex justify-between items-center border-b border-amber-900/30 pb-2">
                                    <span className="text-stone-400">被提名者</span>
                                    <span className="font-bold text-amber-100 text-lg font-cinzel">{gameState.seats.find(s => s.id === gameState.voting?.nomineeSeatId)?.userName}</span>
                                </div>
                                <button
                                    onClick={nextClockHand}
                                    className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-black font-bold rounded-sm mb-2 shadow border border-amber-500 font-cinzel"
                                >
                                    移动时针 ➜
                                </button>
                                <button onClick={closeVote} className="w-full py-1 bg-transparent hover:bg-red-900/20 text-xs rounded text-red-400 border border-transparent hover:border-red-900/50 transition-colors">
                                    取消 / 结束投票
                                </button>
                            </div>
                        )}
                    </div>
                )
                }

                {/* PLAYER CONTROLS */}
                {
                    !user.isStoryteller && (
                        <div className="space-y-4">
                            {gameState.phase === 'NIGHT' && (
                                <div className="p-6 bg-black/60 rounded border border-indigo-900/50 text-center animate-pulse shadow-[0_0_30px_rgba(30,27,75,0.5)] backdrop-blur-sm">
                                    <div className="text-4xl mb-4 opacity-80">🌙</div>
                                    <h3 className="text-indigo-200 font-bold font-cinzel text-xl tracking-widest">夜幕降临</h3>
                                    <p className="text-xs text-indigo-400 mt-2 font-serif italic">只有被叫到名字时才醒来。</p>
                                </div>
                            )}

                            {gameState.voting?.isOpen && (
                                <div className="p-4 bg-amber-900/10 rounded border border-amber-800/50 shadow-[0_0_20px_rgba(180,83,9,0.1)]">
                                    <h3 className="text-center font-bold text-amber-600 mb-2 flex items-center justify-center gap-2 font-cinzel">
                                        <span>⚖</span> 审判
                                    </h3>
                                    <p className="text-xs text-center text-stone-400 mb-6">
                                        受审者: <span className="text-amber-100 font-bold text-base ml-1">{gameState.seats.find(s => s.id === gameState.voting?.nomineeSeatId)?.userName}</span>
                                    </p>

                                    {gameState.voting.clockHandSeatId === currentSeat?.id ? (
                                        <div className="animate-bounce">
                                            <button
                                                onClick={toggleHand}
                                                className={`w-full py-4 rounded-sm text-xl font-bold shadow-xl transition-all border-2 font-cinzel tracking-wider ${currentSeat?.isHandRaised ? 'bg-green-900 border-green-600 hover:bg-green-800 text-green-100' : 'bg-stone-700 border-stone-500 hover:bg-stone-600 text-stone-300'}`}
                                            >
                                                {currentSeat?.isHandRaised ? '✋ 已投票' : '举手投票？'}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-center text-stone-600 italic p-3 border border-dashed border-stone-800 rounded-sm font-serif text-sm">
                                            时针转动中...
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )
                }
            </div>
                )}

            {/* Tab: Notebook */}
            {activeTab === 'notebook' && user.isStoryteller && (
                <div className="h-full p-2 overflow-hidden">
                    <StorytellerNotebook />
                </div>
            )}

            {/* Tab: Chat */}
            {
                activeTab === 'chat' && (
                    <Chat />
                )
            }

            {/* Tab: AI Assistant */}
            {
                activeTab === 'ai' && user.isStoryteller && (
                    <div className="h-full flex flex-col p-4 space-y-4 relative">
                        {/* AI Chat History */}
                        <div className="flex-1 bg-stone-900/80 rounded p-4 border border-purple-900/30 overflow-y-auto scrollbar-thin space-y-4">
                            <div className="flex justify-between items-center mb-4 border-b border-purple-900/20 pb-2 sticky top-0 bg-stone-900/95 z-10">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-purple-400 font-bold flex items-center gap-2 font-cinzel">
                                        <span>✨</span> 先知
                                    </h3>
                                    <button
                                        onClick={() => {
                                            if (confirm('清空所有助手聊天记录？')) clearAiMessages();
                                        }}
                                        className="text-[10px] text-stone-500 hover:text-red-400 border border-stone-800 hover:border-red-900 px-1.5 py-0.5 rounded transition-colors"
                                        title="清空聊天"
                                    >
                                        🗑️
                                    </button>
                                </div>
                                <select
                                    value={aiProvider}
                                    onChange={(e) => setAiProvider(e.target.value as any)}
                                    className="bg-stone-950 border border-purple-900/50 text-purple-300 text-xs rounded px-2 py-1 outline-none focus:border-purple-500 max-w-[150px]"
                                >
                                    <optgroup label="DeepSeek R1 (Reasoning)">
                                        <option value="sf_r1">🧠 DeepSeek R1 (Full)</option>
                                        <option value="sf_r1_llama_70b">🦙 R1 Llama 70B</option>
                                        <option value="sf_r1_qwen_32b">🤖 R1 Qwen 32B</option>
                                        <option value="sf_r1_qwen_7b_pro">⚡ R1 Qwen 7B Pro</option>
                                    </optgroup>
                                    <optgroup label="Other High Performance">
                                        <option value="sf_minimax_m2">🦄 MiniMax M2 (230B)</option>
                                        <option value="sf_kimi_k2_thinking">🤔 Kimi K2 Thinking</option>
                                    </optgroup>
                                    <optgroup label="Official / Legacy">
                                        <option value="deepseek">DeepSeek V3.2 (Official)</option>
                                        <option value="kimi">Kimi (Official - Fixing)</option>
                                    </optgroup>
                                </select>
                            </div>

                            {/* Messages */}
                            {gameState.messages
                                .filter(m => m.senderId === 'ai_guide')
                                .map(msg => {
                                    // Parse <think> tags
                                    const thinkMatch = msg.content.match(/<think>([\s\S]*?)<\/think>/);
                                    const thinkContent = thinkMatch ? thinkMatch[1] : null;
                                    const mainContent = msg.content.replace(/<think>[\s\S]*?<\/think>/, '').trim();

                                    return (
                                        <div
                                            key={msg.id}
                                            className="group relative bg-purple-950/20 border border-purple-900/30 p-3 rounded-lg text-sm text-stone-300 hover:bg-purple-950/30 transition-colors"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-purple-400 font-bold text-xs">{msg.senderName}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-stone-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                                    <button
                                                        onClick={() => deleteAiMessage(msg.id)}
                                                        className="text-stone-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Delete Message"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Thinking Content */}
                                            {thinkContent && (
                                                <details className="mb-2 bg-black/20 rounded border border-purple-900/20 overflow-hidden">
                                                    <summary className="text-[10px] text-purple-400/70 bg-purple-900/10 px-2 py-1 cursor-pointer hover:bg-purple-900/20 select-none flex items-center gap-1">
                                                        <span>💭</span> 思考过程
                                                    </summary>
                                                    <div className="p-2 text-xs text-stone-500 font-mono whitespace-pre-wrap border-t border-purple-900/10 bg-black/10">
                                                        {thinkContent.trim()}
                                                    </div>
                                                </details>
                                            )}

                                            <div className="whitespace-pre-wrap leading-relaxed">{mainContent || (thinkContent ? '' : msg.content)}</div>

                                            {/* Action Buttons (Visible on Hover/Focus) */}
                                            <div className="absolute top-8 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-stone-950/80 rounded p-1 backdrop-blur-sm z-10">
                                                <button
                                                    onClick={() => useStore.getState().forwardMessage(msg.id, null)}
                                                    className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded border border-stone-600"
                                                    title="Broadcast to All"
                                                >
                                                    📢 公示
                                                </button>
                                                <div className="relative group/menu">
                                                    <button className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded border border-stone-600">
                                                        🤫 私发...
                                                    </button>
                                                    {/* Dropdown for Whisper */}
                                                    <div className="absolute right-0 top-full mt-1 w-32 bg-stone-900 border border-stone-700 rounded shadow-xl hidden group-hover/menu:block z-50 max-h-48 overflow-y-auto">
                                                        {gameState.seats.filter(s => s.userId).map(seat => (
                                                            <button
                                                                key={seat.id}
                                                                onClick={() => useStore.getState().forwardMessage(msg.id, seat.userId)}
                                                                className="w-full text-left px-2 py-1.5 text-xs text-stone-400 hover:bg-stone-800 hover:text-stone-200 truncate"
                                                            >
                                                                {seat.userName}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                            {/* Thinking Indicator */}
                            {isAiThinking && (
                                <div className="flex items-center gap-2 text-purple-400 text-xs animate-pulse p-2">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    <span>先知正在占卜...</span>
                                </div>
                            )}

                            {/* Empty State */}
                            {!isAiThinking && gameState.messages.filter(m => m.senderId === 'ai_guide').length === 0 && (
                                <p className="text-xs text-stone-500 text-center mt-10 italic">
                                    向先知寻求指引...
                                </p>
                            )}
                        </div>

                        {/* Input Area */}
                        <form onSubmit={handleAiSubmit} className="relative shrink-0">
                            <textarea
                                value={aiPrompt}
                                onChange={e => setAiPrompt(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-sm text-stone-200 focus:border-purple-600 outline-none resize-none h-24 placeholder-stone-700 font-serif disabled:opacity-50"
                                placeholder="询问先知..."
                                disabled={isAiThinking}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleAiSubmit(e);
                                    }
                                }}
                            />
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <span className="text-[10px] text-stone-600 hidden md:inline">Shift+Enter 换行</span>
                                <button
                                    type="submit"
                                    disabled={isAiThinking || !aiPrompt.trim()}
                                    className="bg-purple-900 hover:bg-purple-800 disabled:bg-stone-800 disabled:text-stone-600 text-purple-100 font-bold py-1.5 px-4 rounded border border-purple-950 transition-all font-cinzel text-xs shadow-lg"
                                >
                                    {isAiThinking ? '...' : '发送'}
                                </button>
                            </div>
                        </form>
                    </div>
                )
            }
        </div>



            {/* History Modal */ }
    { showHistory && <HistoryViewer onClose={() => setShowHistory(false)} /> }

    {/* Night Action Panel */ }
    {
        showNightAction && currentNightRole && (
            <NightActionPanel
                roleId={currentNightRole}
                onComplete={() => {
                    setShowNightAction(false);
                    setCurrentNightRole(null);
                }}
            />
        )
    }

    {/* Help Modal */ }
    { showHelp && <HelpModal onClose={() => setShowHelp(false)} /> }

    <style>{`
        .btn { @apply py-1.5 px-2 rounded-sm text-xs transition-all hover:opacity-90 active:scale-95 shadow-sm border border-stone-900; }
      `}</style>
        </div >
    );
};
