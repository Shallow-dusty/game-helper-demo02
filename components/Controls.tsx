import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS, PHASE_LABELS, AUDIO_TRACKS, SCRIPTS } from '../constants';
import { Chat } from './Chat';
import { HistoryViewer } from './HistoryViewer';
import { NightActionPanel } from './NightActionPanel';
import { StorytellerNotebook } from './StorytellerNotebook';
import { PlayerNotebook } from './PlayerNotebook';
import { PlayerNightAction } from './PlayerNightAction';
import { RoleReferencePanel } from './RoleReferencePanel';
import { VotingChart } from './VotingChart';
import { ScriptCompositionGuide } from './ScriptCompositionGuide';

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
    const [showRoleReference, setShowRoleReference] = useState(false);
    const [showCompositionGuide, setShowCompositionGuide] = useState(false);
    const [skillDescriptionMode, setSkillDescriptionMode] = useState<'simple' | 'detailed'>('simple');

    // Load preference from localStorage
    useEffect(() => {
        const savedMode = localStorage.getItem('skillDescriptionMode') as 'simple' | 'detailed';
        if (savedMode) {
            setSkillDescriptionMode(savedMode);
        }
    }, []);

    const toggleSkillMode = () => {
        const newMode = skillDescriptionMode === 'simple' ? 'detailed' : 'simple';
        setSkillDescriptionMode(newMode);
        localStorage.setItem('skillDescriptionMode', newMode);
    };
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

    // Auto-trigger player night action
    useEffect(() => {
        if (!user || !gameState || user.isStoryteller) return;
        if (gameState.phase !== 'NIGHT') return;

        const currentSeat = gameState.seats.find(s => s.userId === user.id);
        if (!currentSeat || !currentSeat.roleId) return;

        const currentNightRole = gameState.nightQueue[gameState.nightCurrentIndex];
        if (currentNightRole === currentSeat.roleId) {
            // It's my turn!
            // Check if I have a night action
            const role = ROLES[currentSeat.roleId];
            if (role?.nightAction) {
                setShowNightAction(true);
            }
        }
    }, [gameState?.phase, gameState?.nightCurrentIndex, user?.id]);

    // Audio Element Ref
    const audioRef = React.useRef<HTMLAudioElement>(null);

    // Sync audio state with ref
    useEffect(() => {
        if (!audioRef.current) return;

        const audio = audioRef.current;
        // If trackId is empty, pause and clear src
        if (!gameState.audio.trackId) {
            audio.pause();
            audio.src = '';
            return;
        }

        const track = AUDIO_TRACKS[gameState.audio.trackId];

        if (track && audio.src !== track.url) {
            audio.src = track.url;
        }

        audio.volume = gameState.audio.volume;

        if (gameState.audio.isPlaying) {
            // Use a promise to handle play(), as it can be interrupted
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error("Audio play failed (likely browser policy):", e);
                    // Optionally update state to paused if play fails
                });
            }
        } else {
            audio.pause();
        }
    }, [gameState?.audio?.trackId, gameState?.audio?.isPlaying, gameState?.audio?.volume]);


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
            className="bg-stone-950 border-l border-stone-800 flex flex-col h-full shadow-2xl font-serif relative transition-none z-50"
            style={{ width: `${width}px` }}
        >
            {/* Audio Element */}
            <audio ref={audioRef} loop />

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

                {/* Mobile Close Button - 移除了游戏规则按钮，已在Game Tab中 */}
                <div className="flex items-center gap-2">
                    {onClose && (
                        <button onClick={onClose} className="md:hidden text-stone-400 hover:text-white p-2">
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



            {/* Player Role Reveal (In Header Area) */}
            {!user.isStoryteller && role && (
                <div className="px-4 pb-4 border-b border-stone-800 bg-stone-950/50">
                    <div className="p-4 bg-stone-900 rounded border border-stone-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-1 opacity-20 text-4xl">
                            {role.team === 'DEMON' ? '👿' : role.team === 'MINION' ? '🧪' : '⚜️'}
                        </div>
                        <div className="flex justify-between items-center mb-2">
                            <div className="font-bold flex items-center gap-2 text-lg font-cinzel" style={{ color: TEAM_COLORS[role.team] }}>
                                <span>{role.name}</span>
                            </div>
                            <button
                                onClick={toggleSkillMode}
                                className="text-[10px] px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded border border-stone-600 transition-colors"
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
                <button
                    onClick={() => setActiveTab('notebook')}
                    className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'notebook' ? 'border-amber-600 text-amber-500 bg-stone-900' : 'border-transparent text-stone-500 hover:text-stone-300 hover:bg-stone-900/50'}`}
                >
                    📓 笔记
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
                                            onClick={() => useStore.getState().addSeat()}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                            title="添加一个空座位"
                                        >
                                            <span>➕</span> 添加座位
                                        </button>
                                        <button
                                            onClick={() => useStore.getState().removeSeat()}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                            title="移除最后一个座位"
                                        >
                                            <span>➖</span> 移除座位
                                        </button>
                                        <button
                                            onClick={() => useStore.getState().assignRoles()}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                            title="随机分配角色给所有玩家"
                                        >
                                            <span>🎲</span> 自动分配角色
                                        </button>
                                        <button
                                            onClick={() => {
                                                const hasEmptyRoles = gameState.seats.some(s => !s.roleId);
                                                if (hasEmptyRoles) {
                                                    alert("错误：有玩家未分配角色！请先分配角色再发放。");
                                                    return;
                                                }
                                                useStore.getState().distributeRoles();
                                            }}
                                            className="bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                            title="将角色信息发送给玩家"
                                        >
                                            <span>👀</span> 发放角色
                                        </button>
                                        <button
                                            onClick={() => setShowCompositionGuide(true)}
                                            className="bg-stone-800 hover:bg-amber-900 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                            title="查看板子配置建议"
                                        >
                                            <span>📊</span> 板子参考
                                        </button>

                                        {/* Phase Switch Button */}
                                        {gameState.phase === 'SETUP' || gameState.phase === 'DAY' ? (
                                            <button
                                                onClick={() => useStore.getState().startGame()}
                                                className="col-span-2 bg-indigo-900 hover:bg-indigo-800 text-indigo-100 py-2 px-3 rounded text-xs border border-indigo-700 transition-colors flex items-center justify-center gap-1 font-bold shadow-lg"
                                            >
                                                <span>🌙</span> {gameState.phase === 'SETUP' ? '开始游戏 (进入夜晚)' : '进入夜晚'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setPhase('DAY')}
                                                className="col-span-2 bg-amber-700 hover:bg-amber-600 text-white py-2 px-3 rounded text-xs border border-amber-600 transition-colors flex items-center justify-center gap-1 font-bold shadow-lg"
                                            >
                                                <span>☀</span> 天亮 (进入白天)
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Audio Controls */}
                                <div className="bg-stone-900 p-3 rounded border border-stone-700">
                                    <div className="text-xs font-bold text-stone-500 uppercase mb-2">🎵 氛围音效 (Audio)</div>
                                    <select
                                        className="w-full bg-stone-950 border border-stone-700 rounded text-xs text-stone-300 p-1 mb-2"
                                        onChange={(e) => setAudioTrack(e.target.value)}
                                        value={gameState.audio.trackId || ''}
                                    >
                                        <option value="">-- 选择音效 --</option>
                                        {Object.entries(AUDIO_TRACKS).map(([id, track]) => (
                                            <option key={id} value={id}>{track.name}</option>
                                        ))}
                                    </select>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={toggleAudioPlay}
                                            className={`flex-1 py-1 rounded text-xs font-bold ${gameState.audio.isPlaying ? 'bg-amber-700 text-white' : 'bg-stone-800 text-stone-400'}`}
                                        >
                                            {gameState.audio.isPlaying ? '⏸ 暂停' : '▶ 播放'}
                                        </button>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={gameState.audio.volume}
                                            onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                                            className="w-20 accent-amber-600"
                                        />
                                    </div>
                                </div>

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

                                        {/* Manual Day Switch (Backup) */}
                                        <button
                                            onClick={() => setPhase('DAY')}
                                            className="mt-3 w-full py-2 bg-amber-900/30 hover:bg-amber-800/50 text-amber-500 rounded text-xs border border-amber-900/50 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <span>☀</span> 强制天亮
                                        </button>
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
                                    {/* Voting Stats */}
                                    <VotingChart />

                                    {/* Player Controls */}
                                    {gameState.phase === 'NIGHT' && (
                                        <div className="p-6 bg-black/60 rounded border border-indigo-900/50 text-center animate-pulse shadow-[0_0_30px_rgba(30,27,75,0.5)] backdrop-blur-sm">
                                            <div className="text-4xl mb-4 opacity-80">🌙</div>
                                            <h3 className="text-indigo-200 font-bold font-cinzel text-xl tracking-widest">夜幕降临</h3>
                                            <p className="text-xs text-indigo-400 mt-2 font-serif italic">只有被叫到名字时才醒来。</p>
                                            {currentSeat?.roleId === gameState.nightQueue[gameState.nightCurrentIndex] && (
                                                <button
                                                    onClick={() => setShowNightAction(true)}
                                                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold animate-bounce shadow-lg"
                                                >
                                                    执行行动
                                                </button>
                                            )}
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

                                    {/* Settings for Player */}
                                    <div className="bg-stone-900 p-3 rounded border border-stone-700 mt-4">
                                        <div className="text-xs font-bold text-stone-500 uppercase mb-2">⚙️ 设置</div>
                                        <button
                                            onClick={toggleSkillMode}
                                            className="w-full bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className={`px-2 py-1 rounded text-xs ${skillDescriptionMode === 'detailed' ? 'bg-amber-900 text-amber-200' : 'bg-stone-700 text-stone-300'}`}>
                                                {skillDescriptionMode === 'detailed' ? '详细' : '简略'}
                                            </span>
                                        </button>
                                        {/* History Button for Players */}
                                        <button
                                            onClick={() => setShowHistory(true)}
                                            className="mt-2 w-full bg-stone-800 hover:bg-stone-700 text-stone-300 py-2 px-3 rounded text-xs border border-stone-600 transition-colors flex items-center justify-center gap-1"
                                            title="查看历史记录"
                                        >
                                            <span>📜</span> 历史
                                        </button>
                                    </div>
                                </div>
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
                            {gameState.aiMessages.map(msg => (
                                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-stone-800 text-stone-200' : 'bg-amber-900/30 text-amber-100 border border-amber-800/30'}`}>
                                        {msg.content}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-stone-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        {user.isStoryteller && (
                                            <button onClick={() => deleteAiMessage(msg.id)} className="text-[10px] text-red-900 hover:text-red-500">Del</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {isAiThinking && (
                                <div className="flex items-start">
                                    <div className="bg-amber-900/30 text-amber-100 p-3 rounded-lg text-sm border border-amber-800/30 animate-pulse">
                                        Thinking...
                                    </div>
                                </div>
                            )}
                        </div>
                        <form onSubmit={handleAiSubmit} className="flex gap-2">
                            <input
                                type="text"
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                placeholder="Ask AI helper..."
                                className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-stone-300 focus:border-amber-600 focus:outline-none"
                            />
                            <button type="submit" disabled={!aiPrompt.trim() || isAiThinking} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-2 rounded">
                                Send
                            </button>
                        </form>
                        {user.isStoryteller && (
                            <div className="mt-2 flex justify-between">
                                <button onClick={clearAiMessages} className="text-xs text-stone-500 hover:text-stone-300">Clear History</button>
                                <select
                                    value={aiProvider}
                                    onChange={(e) => setAiProvider(e.target.value as any)}
                                    className="bg-stone-950 border border-stone-800 text-[10px] text-stone-500 rounded"
                                >
                                    <option value="gemini">Gemini</option>
                                    <option value="openai">OpenAI</option>
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
            </div>

            {/* --- Modals --- */}
            {showHistory && <HistoryViewer onClose={() => setShowHistory(false)} />}
            {showRoleReference && (
                <RoleReferencePanel
                    isOpen={showRoleReference}
                    onClose={() => setShowRoleReference(false)}
                    playerRoleId={currentSeat?.roleId || null}
                    scriptRoles={SCRIPTS[gameState.currentScriptId]?.roles.map(id => ROLES[id]).filter(Boolean) || []}
                />
            )}
            {showCompositionGuide && (
                <ScriptCompositionGuide
                    onClose={() => setShowCompositionGuide(false)}
                    playerCount={gameState.seats.length}
                    onApplyStrategy={(strategy, roles) => {
                        if (roles) {
                            const allRoles = [
                                ...roles.townsfolk,
                                ...roles.outsider,
                                ...roles.minion,
                                ...roles.demon
                            ];

                            // Shuffle roles
                            const shuffledRoles = allRoles.sort(() => Math.random() - 0.5);

                            // Get seats and assignRole function
                            const seats = useStore.getState().gameState.seats;
                            const assignRole = useStore.getState().assignRole;

                            // Assign roles
                            seats.forEach((seat, index) => {
                                if (index < shuffledRoles.length) {
                                    assignRole(seat.id, shuffledRoles[index].id);
                                } else {
                                    assignRole(seat.id, null as any);
                                }
                            });
                        }
                        setShowCompositionGuide(false);
                    }}
                />
            )}
            {showNightAction && currentNightRole && (
                <NightActionPanel
                    roleId={currentNightRole}
                    onComplete={() => setShowNightAction(false)}
                />
            )}
            {/* Player Night Action Modal */}
            {showNightAction && !user.isStoryteller && currentSeat?.roleId && (
                <PlayerNightAction
                    roleId={currentSeat.roleId}
                    onComplete={() => setShowNightAction(false)}
                />
            )}
        </div>
    );
};
