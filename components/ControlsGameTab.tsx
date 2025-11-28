import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store';
import { ROLES, PHASE_LABELS, AUDIO_TRACKS, SCRIPTS } from '../constants';
import { NightActionPanel } from './NightActionPanel';
import { NightActionManager } from './NightActionManager';
import { ScriptCompositionGuide } from './ScriptCompositionGuide';
import { VotingChart } from './VotingChart';
import { VoteButton } from './VoteButton';
import { showError } from './Toast';

interface ControlsGameTabProps {
  isMobile: boolean;
}

export const ControlsGameTab: React.FC<ControlsGameTabProps> = () => {
  const user = useStore(state => state.user);
  const gameState = useStore(state => state.gameState);
  const setPhase = useStore(state => state.setPhase);
  const setScript = useStore(state => state.setScript);
  const nightNext = useStore(state => state.nightNext);
  const nightPrev = useStore(state => state.nightPrev);
  const nextClockHand = useStore(state => state.nextClockHand);
  const toggleHand = useStore(state => state.toggleHand);
  const closeVote = useStore(state => state.closeVote);

  // Audio Actions
  const setAudioTrack = useStore(state => state.setAudioTrack);
  const toggleAudioPlay = useStore(state => state.toggleAudioPlay);
  const setAudioVolume = useStore(state => state.setAudioVolume);

  const [showNightAction, setShowNightAction] = useState(false);
  const [showCompositionGuide, setShowCompositionGuide] = useState(false);
  const [currentNightRole, setCurrentNightRole] = useState<string | null>(null);

  // 移动端可折叠区块状态
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    setup: false,
    phase: false,
    audio: true, // 默认折叠音频
    voting: false
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (!user || !gameState) return null;

  const currentSeat = gameState.seats.find(s => s.userId === user.id);
  const currentNightRoleId = gameState.nightQueue[gameState.nightCurrentIndex];

  return (
    <div className="h-full overflow-y-auto p-4 space-y-6 scrollbar-thin">
      {/* GAME PHASE DISPLAY */}
      <div className="text-center p-4 bg-black/40 rounded border border-stone-800 shadow-inner backdrop-blur-sm">
        <div className="text-xs text-stone-500 uppercase tracking-[0.2em] mb-1 font-cinzel">Current Phase</div>
        <div className="text-3xl font-bold text-amber-600 tracking-widest font-cinzel drop-shadow-md">{PHASE_LABELS[gameState.phase]}</div>
      </div>

      {/* ST CONTROLS */}
      {user.isStoryteller && (
        <div className="space-y-6">
          {/* Night Action Manager - 处理玩家夜间行动请求 */}
          <NightActionManager />

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

          {/* Game Setup - Collapsible on Mobile */}
          <div className="bg-stone-900 rounded border border-stone-700">
            <button
              className="w-full p-3 flex justify-between items-center text-xs font-bold text-stone-500 uppercase md:cursor-default"
              onClick={() => toggleSection('setup')}
            >
              <span>⚙️ 游戏设置 (Setup)</span>
              <span className="md:hidden text-stone-600">{collapsedSections.setup ? '▼' : '▲'}</span>
            </button>

            <div className={`space-y-2 px-3 pb-3 ${collapsedSections.setup ? 'hidden md:block' : ''}`}>
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
                      showError("有玩家未分配角色！请先分配角色再发放。");
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

                {/* 振动开关 - 线下游戏应关闭，避免自爆 */}
                <button
                  onClick={() => useStore.getState().toggleVibration()}
                  className={`col-span-2 py-2 px-3 rounded text-xs border transition-colors flex items-center justify-center gap-1 ${gameState.vibrationEnabled
                    ? 'bg-green-900/50 border-green-700 text-green-300 hover:bg-green-800/50'
                    : 'bg-stone-800 border-stone-600 text-stone-400 hover:bg-stone-700'
                    }`}
                  title="线下游戏应关闭振动，避免暴露玩家身份"
                >
                  <span>{gameState.vibrationEnabled ? '📳' : '🔇'}</span>
                  {gameState.vibrationEnabled ? '夜间振动提醒: 开启' : '夜间振动提醒: 关闭'}
                </button>
              </div>
            </div>
          </div>

          {/* Audio Controls - Collapsible */}
          <div className="bg-stone-900 rounded border border-stone-700">
            <button
              className="w-full p-3 flex justify-between items-center text-xs font-bold text-stone-500 uppercase"
              onClick={() => toggleSection('audio')}
            >
              <span className="flex items-center gap-2">
                🎵 氛围音效
                {gameState.audio.isPlaying && (
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="正在播放" />
                )}
              </span>
              <span className="text-stone-600">{collapsedSections.audio ? '▼' : '▲'}</span>
            </button>

            <div className={`px-3 pb-3 ${collapsedSections.audio ? 'hidden' : ''}`}>
              {/* 当前播放信息 */}
              {gameState.audio.trackId && AUDIO_TRACKS[gameState.audio.trackId]?.url && (
                <div className="mb-2 p-2 bg-stone-950/50 rounded border border-stone-800 text-xs">
                  <div className="flex items-center gap-2 text-stone-400">
                    <span className={gameState.audio.isPlaying ? 'text-green-400' : 'text-stone-500'}>
                      {gameState.audio.isPlaying ? '🔊' : '🔇'}
                    </span>
                    <span className="text-stone-300 font-medium">
                      {gameState.audio.trackId && AUDIO_TRACKS[gameState.audio.trackId]?.name}
                    </span>
                  </div>
                </div>
              )}

              {/* 音频不可用提示 */}
              {(!Object.values(AUDIO_TRACKS).some(t => t.url && t.url !== '')) && (
                <div className="mb-2 p-2 bg-amber-950/30 rounded border border-amber-800/50 text-xs text-amber-400">
                  <span>⚠️ 音频资源未配置，请在 constants.ts 中设置有效的音频URL</span>
                </div>
              )}

              {/* 阶段自动切换提示 */}
              <div className="mb-2 text-[10px] text-stone-500 flex items-center gap-1">
                <span>💡</span>
                <span>切换阶段时音乐会自动更换</span>
              </div>

              <select
                className="w-full bg-stone-950 border border-stone-700 rounded text-xs text-stone-300 p-1.5 mb-2"
                onChange={(e) => setAudioTrack(e.target.value)}
                value={gameState.audio.trackId || ''}
              >
                <option value="">-- 手动选择音效 --</option>
                <optgroup label="阶段音乐">
                  {Object.entries(AUDIO_TRACKS)
                    .filter(([_, track]) => track.phase && track.url && track.url !== '')
                    .map(([id, track]) => (
                      <option key={id} value={id}>{track.name}</option>
                    ))}
                </optgroup>
                <optgroup label="特殊音乐">
                  {Object.entries(AUDIO_TRACKS)
                    .filter(([_, track]) => !track.phase && track.url && track.url !== '')
                    .map(([id, track]) => (
                      <option key={id} value={id}>{track.name}</option>
                    ))}
                </optgroup>
              </select>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleAudioPlay}
                  className={`flex-1 py-1.5 rounded text-xs font-bold transition-colors ${gameState.audio.isPlaying
                    ? 'bg-amber-700 hover:bg-amber-600 text-white'
                    : 'bg-stone-800 hover:bg-stone-700 text-stone-400'
                    }`}
                >
                  {gameState.audio.isPlaying ? '⏸ 暂停' : '▶ 播放'}
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-stone-600 text-xs">🔈</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={gameState.audio.volume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="w-16 accent-amber-600"
                    title={`音量: ${Math.round(gameState.audio.volume * 100)}%`}
                  />
                  <span className="text-stone-600 text-xs">🔊</span>
                </div>
              </div>
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
                  {(gameState.nightCurrentIndex >= 0 && currentNightRoleId && ROLES[currentNightRoleId]?.name) || '天亮'}
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
              {gameState.nightCurrentIndex >= 0 && currentNightRoleId && ROLES[currentNightRoleId]?.nightAction && (
                <button
                  onClick={() => {
                    if (currentNightRoleId) setCurrentNightRole(currentNightRoleId);
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
      )}

      {/* PLAYER CONTROLS */}
      {!user.isStoryteller && (
        <div className="space-y-4">
          {/* Voting Stats */}
          <VotingChart />

          {/* Player Controls */}
          {gameState.phase === 'NIGHT' && (
            <div className="p-6 bg-black/60 rounded border border-indigo-900/50 text-center shadow-[0_0_30px_rgba(30,27,75,0.5)] backdrop-blur-sm">
              <div className="text-4xl mb-4 opacity-80">🌙</div>
              <h3 className="text-indigo-200 font-bold font-cinzel text-xl tracking-widest">夜幕降临</h3>
              <p className="text-xs text-indigo-400 mt-2 font-serif italic">只有被叫到名字时才醒来。</p>

              {/* 当前是你的回合 - 始终显示按钮 */}
              {currentSeat?.roleId === currentNightRoleId && (
                <button
                  onClick={() => setShowNightAction(true)}
                  className="mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg animate-pulse border-2 border-indigo-400"
                >
                  🌙 执行夜间行动
                </button>
              )}

              {/* 即使不是当前回合，但有夜间技能的角色也可以查看 */}
              {currentSeat?.roleId &&
                ROLES[currentSeat.roleId]?.nightAction &&
                currentSeat.roleId !== currentNightRoleId && (
                  <button
                    onClick={() => setShowNightAction(true)}
                    className="mt-4 px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm border border-stone-600"
                  >
                    查看我的夜间行动
                  </button>
                )}
            </div>
          )}

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
              onClick={() => {
                // This will be handled by parent component
                const event = new CustomEvent('showHistory');
                window.dispatchEvent(event);
              }}
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
      )}

      {/* --- Modals --- */}
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
              ];

              // Shuffle roles
              const shuffledRoles = [...allRoles].sort(() => Math.random() - 0.5);

              // Get seats with players and assignRole function
              const currentState = useStore.getState().gameState;
              const assignRole = useStore.getState().assignRole;

              if (!currentState) return;

              // Get only occupied seats (real players + virtual)
              const occupiedSeats = currentState.seats.filter(s => s.userId || s.isVirtual);

              // First, clear ALL seat roles
              currentState.seats.forEach(seat => {
                assignRole(seat.id, null as unknown as string);
              });

              // Then assign new roles only to occupied seats
              occupiedSeats.forEach((seat, index) => {
                if (index < shuffledRoles.length && shuffledRoles[index]) {
                  assignRole(seat.id, shuffledRoles[index].id);
                }
              });

              // Add system message
              currentState.messages.push({
                id: Math.random().toString(36).substr(2, 9),
                senderId: 'system',
                senderName: '系统',
                recipientId: null,
                content: `📊 已应用 "${strategy.name}" 策略，重新分配了 ${shuffledRoles.length} 个角色。`,
                timestamp: Date.now(),
                type: 'system'
              });

              useStore.setState({ gameState: { ...currentState } });
              useStore.getState().syncToCloud();
            }
            setShowCompositionGuide(false);
          }}
        />,
        document.body
      )}
      {showNightAction && currentNightRole && createPortal(
        <NightActionPanel
          roleId={currentNightRole}
          onComplete={() => setShowNightAction(false)}
        />,
        document.body
      )}
    </div>
  );
};
