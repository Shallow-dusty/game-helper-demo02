
import React, { useState } from 'react';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS, PHASE_LABELS, AUDIO_TRACKS, SCRIPTS } from '../constants';
import { Chat } from './Chat';

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
  
  const [activeTab, setActiveTab] = useState<'game' | 'chat' | 'ai'>('game');
  const [aiPrompt, setAiPrompt] = useState('');

  if (!user || !gameState) return null;

  const currentSeat = gameState.seats.find(s => s.userId === user.id);
  const role = currentSeat?.roleId ? ROLES[currentSeat.roleId] : null;

  const handleAiSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!aiPrompt.trim()) return;
      const prompt = aiPrompt;
      setAiPrompt('');
      setActiveTab('chat'); // Switch to chat to see answer
      await askAi(prompt);
  };

  return (
    <div className="w-full md:w-80 bg-stone-950 border-l border-stone-800 flex flex-col h-full shadow-2xl font-serif">
      
      {/* --- Header: User Info --- */}
      <div className="p-4 border-b border-stone-800 bg-stone-950 flex items-start justify-between shadow-md z-10">
        <div>
            <h2 className="text-lg font-bold text-stone-200 font-cinzel truncate max-w-[200px]">{user.name}</h2>
            <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-0.5 rounded border ${user.isStoryteller ? 'bg-purple-950/30 border-purple-800 text-purple-300' : 'bg-blue-950/30 border-blue-800 text-blue-300'}`}>
                {user.isStoryteller ? 'Storyteller' : 'Villager'}
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
                  {gameState.gameOver.winner === 'GOOD' ? 'GOOD WINS' : 'EVIL WINS'}
              </h2>
              <p className="text-xs text-white/80 mt-1">{gameState.gameOver.reason}</p>
          </div>
      )}

      {/* Room Code Banner */}
      <div className="bg-stone-900 border-b border-stone-800 p-2 flex justify-between items-center px-4">
          <div className="flex flex-col">
              <span className="text-[10px] text-stone-500 uppercase tracking-wider">Room Code</span>
              <span className="text-xl font-mono font-bold text-stone-200 tracking-[0.2em]">{gameState.roomId}</span>
          </div>
          {isOffline ? (
              <span className="text-xs font-bold text-red-400 bg-red-950/30 border border-red-900 px-2 py-1 rounded animate-pulse">
                  OFFLINE / DEMO
              </span>
          ) : (
              <button onClick={leaveGame} className="text-xs text-stone-500 hover:text-red-400 transition-colors border border-stone-800 hover:border-red-900 px-2 py-1 rounded">
                  Leave
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
                        {role.team === 'TOWNSFOLK' ? 'Townsfolk' : 
                         role.team === 'MINION' ? 'Minion' : 
                         role.team === 'DEMON' ? 'Demon' : 'Outsider'}
                </span>
                <p className="text-sm text-stone-400 mt-3 leading-relaxed italic border-t border-stone-800 pt-2">{role.description}</p>
            </div>
        </div>
      )}

      {/* --- Tabs --- */}
      <div className="flex border-b border-stone-800 text-sm bg-stone-950 font-cinzel">
          <button 
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'game' ? 'bg-stone-900 text-stone-100 border-b-2 border-red-800' : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/30'}`}
            onClick={() => setActiveTab('game')}
          >
            Grimoire
          </button>
          <button 
            className={`flex-1 py-3 text-center transition-colors ${activeTab === 'chat' ? 'bg-stone-900 text-stone-100 border-b-2 border-red-800' : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/30'}`}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </button>
          {user.isStoryteller && (
              <button 
                className={`flex-1 py-3 text-center transition-colors ${activeTab === 'ai' ? 'bg-stone-900 text-purple-300 border-b-2 border-purple-800' : 'text-stone-600 hover:text-stone-400 hover:bg-stone-900/30'}`}
                onClick={() => setActiveTab('ai')}
              >
                Oracle (AI)
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
                            <label className="text-xs font-bold text-stone-500 uppercase mb-2 block">📖 剧本 (Script)</label>
                            <select 
                                value={gameState.currentScriptId}
                                onChange={(e) => setScript(e.target.value)}
                                className="w-full bg-stone-950 border border-stone-700 rounded text-sm text-stone-300 p-2"
                            >
                                {Object.values(SCRIPTS).map(script => (
                                    <option key={script.id} value={script.id}>{script.name}</option>
                                ))}
                            </select>
                        </div>

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
                                    <option value="">-- 选择曲目 (Select Track) --</option>
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

                        <h3 className="text-xs font-bold text-stone-500 uppercase border-b border-stone-800 pb-1 font-cinzel">Storyteller Tools</h3>
                        
                        {/* Phase Management */}
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => setPhase('DAY')} className={`btn font-cinzel ${gameState.phase === 'DAY' ? 'bg-amber-900/80 ring-1 ring-amber-600 text-amber-100' : 'bg-stone-800 text-stone-400'}`}>☀ Day</button>
                            <button onClick={() => setPhase('NIGHT')} className={`btn font-cinzel ${gameState.phase === 'NIGHT' ? 'bg-indigo-950 ring-1 ring-indigo-600 text-indigo-200' : 'bg-stone-800 text-stone-400'}`}>🌙 Night</button>
                            <button onClick={() => setPhase('NOMINATION')} className={`btn font-cinzel ${gameState.phase === 'NOMINATION' ? 'bg-emerald-900/80 ring-1 ring-emerald-600 text-emerald-100' : 'bg-stone-800 text-stone-400'}`}>⚖ Nominate</button>
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
                                    <span>Night Order</span>
                                    <span>{gameState.nightCurrentIndex + 1} / {gameState.nightQueue.length}</span>
                                </div>
                                <div className="flex items-center justify-between mb-3 bg-indigo-950/30 p-2 rounded border border-indigo-900/30">
                                    <button onClick={nightPrev} className="w-8 h-8 flex items-center justify-center bg-stone-800 rounded hover:bg-stone-700 text-stone-400">&lt;</button>
                                    <span className={`font-serif text-lg font-bold ${gameState.nightCurrentIndex >= 0 ? 'text-indigo-200' : 'text-stone-600'}`}>
                                        {gameState.nightCurrentIndex >= 0 ? ROLES[gameState.nightQueue[gameState.nightCurrentIndex]]?.name || 'End of Night' : 'Start Night'}
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
                            </div>
                        )}

                        {/* Voting Controls */}
                        {gameState.voting?.isOpen && (
                            <div className="bg-amber-950/20 border border-amber-800/50 p-4 rounded shadow-[0_0_20px_rgba(180,83,9,0.1)] animate-fade-in">
                                <div className="text-xs text-amber-600 mb-3 font-bold uppercase tracking-widest text-center">Voting in Progress</div>
                                <div className="text-sm mb-4 flex justify-between items-center border-b border-amber-900/30 pb-2">
                                    <span className="text-stone-400">Nominee</span>
                                    <span className="font-bold text-amber-100 text-lg font-cinzel">{gameState.seats.find(s => s.id === gameState.voting?.nomineeSeatId)?.userName}</span>
                                </div>
                                <button 
                                    onClick={nextClockHand}
                                    className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-black font-bold rounded-sm mb-2 shadow border border-amber-500 font-cinzel"
                                >
                                    Advance Clock Hand ➜
                                </button>
                                <button onClick={closeVote} className="w-full py-1 bg-transparent hover:bg-red-900/20 text-xs rounded text-red-400 border border-transparent hover:border-red-900/50 transition-colors">
                                    Cancel / End Vote
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* PLAYER CONTROLS */}
                {!user.isStoryteller && (
                    <div className="space-y-4">
                        {gameState.phase === 'NIGHT' && (
                            <div className="p-6 bg-black/60 rounded border border-indigo-900/50 text-center animate-pulse shadow-[0_0_30px_rgba(30,27,75,0.5)] backdrop-blur-sm">
                                <div className="text-4xl mb-4 opacity-80">🌙</div>
                                <h3 className="text-indigo-200 font-bold font-cinzel text-xl tracking-widest">The Night Has Fallen</h3>
                                <p className="text-xs text-indigo-400 mt-2 font-serif italic">Only wake if your name is called.</p>
                            </div>
                        )}

                        {gameState.voting?.isOpen && (
                            <div className="p-4 bg-amber-900/10 rounded border border-amber-800/50 shadow-[0_0_20px_rgba(180,83,9,0.1)]">
                                <h3 className="text-center font-bold text-amber-600 mb-2 flex items-center justify-center gap-2 font-cinzel">
                                    <span>⚖</span> Judgment
                                </h3>
                                <p className="text-xs text-center text-stone-400 mb-6">
                                    On Trial: <span className="text-amber-100 font-bold text-base ml-1">{gameState.seats.find(s => s.id === gameState.voting?.nomineeSeatId)?.userName}</span>
                                </p>
                                
                                {gameState.voting.clockHandSeatId === currentSeat?.id ? (
                                    <div className="animate-bounce">
                                        <button 
                                            onClick={toggleHand}
                                            className={`w-full py-4 rounded-sm text-xl font-bold shadow-xl transition-all border-2 font-cinzel tracking-wider ${currentSeat?.isHandRaised ? 'bg-green-900 border-green-600 hover:bg-green-800 text-green-100' : 'bg-stone-700 border-stone-500 hover:bg-stone-600 text-stone-300'}`}
                                        >
                                            {currentSeat?.isHandRaised ? '✋ VOTE CAST' : 'RAISE HAND?'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center text-stone-600 italic p-3 border border-dashed border-stone-800 rounded-sm font-serif text-sm">
                                        The clock hand turns...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
             </div>
        )}

        {/* Tab: Chat */}
        {activeTab === 'chat' && (
            <Chat />
        )}

        {/* Tab: AI Assistant */}
        {activeTab === 'ai' && user.isStoryteller && (
             <div className="h-full flex flex-col p-4 space-y-4">
                 <div className="flex-1 bg-stone-900/80 rounded p-4 border border-purple-900/30 overflow-y-auto scrollbar-thin">
                    <h3 className="text-purple-400 font-bold mb-2 flex items-center gap-2 font-cinzel">
                        <span>✨</span> Oracle (Gemini)
                    </h3>
                    <p className="text-xs text-stone-500 mb-4 leading-relaxed font-serif italic">
                        I am your servant in the shadows. Ask me of rules, or bid me speak the terrors of the night.
                    </p>
                    
                    {/* Suggested Prompts */}
                    <div className="space-y-2">
                        <button onClick={() => setAiPrompt("给所有玩家写一段夜晚降临的开场白，要恐怖一点，强调未知的恐惧")} className="text-left w-full p-3 bg-purple-950/20 hover:bg-purple-900/30 rounded-sm text-xs text-purple-200 border border-purple-900/30 transition-colors font-serif">
                            📜 生成恐怖夜晚开场白 (Night Intro)
                        </button>
                        <button onClick={() => setAiPrompt("如果有两个'洗衣服'在场上（可能是间谍），我该怎么给信息？")} className="text-left w-full p-3 bg-purple-950/20 hover:bg-purple-900/30 rounded-sm text-xs text-purple-200 border border-purple-900/30 transition-colors font-serif">
                            🤔 规则判定: 多个同角色 (Rule Check)
                        </button>
                    </div>
                 </div>
                 
                 <form onSubmit={handleAiSubmit} className="relative">
                    <textarea
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded p-3 text-sm text-stone-200 focus:border-purple-600 outline-none resize-none h-24 placeholder-stone-700 font-serif"
                        placeholder="Consult the Oracle..."
                    />
                    <button 
                        type="submit" 
                        disabled={isAiThinking || !aiPrompt.trim()}
                        className="mt-2 w-full bg-purple-900 hover:bg-purple-800 text-purple-100 font-bold py-2 rounded border border-purple-950 transition-all flex justify-center items-center gap-2 font-cinzel text-sm"
                    >
                        {isAiThinking ? 'Divining...' : 'Consult'}
                    </button>
                 </form>
             </div>
        )}

      </div>
      <style>{`
        .btn { @apply py-1.5 px-2 rounded-sm text-xs transition-all hover:opacity-90 active:scale-95 shadow-sm border border-stone-900; }
      `}</style>
    </div>
  );
};
