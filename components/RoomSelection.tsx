
import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useSandboxStore } from '../sandboxStore';
import { showWarning } from './Toast';
import { AdminPanel } from './AdminPanel';

export const RoomSelection = () => {
  const user = useStore(state => state.user);
  const createGame = useStore(state => state.createGame);
  const joinGame = useStore(state => state.joinGame);
  const leaveGame = useStore(state => state.leaveGame);

  // 沙盒模式
  const startSandbox = useSandboxStore(state => state.startSandbox);

  const [seatCount, setSeatCount] = useState(12); // Default setup
  const [roomCode, setRoomCode] = useState('');
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);
  const [isRejoining, setIsRejoining] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showSandboxOptions, setShowSandboxOptions] = useState(false);

  // 检查是否有上次的房间记录
  useEffect(() => {
    const savedRoom = localStorage.getItem('grimoire_last_room');
    if (savedRoom) {
      setLastRoomCode(savedRoom);
    }
  }, []);

  // 监听 localStorage 变化（当 joinGame 失败时会清除记录）
  useEffect(() => {
    const checkStorage = () => {
      const savedRoom = localStorage.getItem('grimoire_last_room');
      if (!savedRoom && lastRoomCode) {
        setLastRoomCode(null);
        setIsRejoining(false);
      }
    };

    // 定时检查（因为同一页面的 localStorage 变化不会触发 storage 事件）
    const interval = setInterval(checkStorage, 500);
    return () => clearInterval(interval);
  }, [lastRoomCode]);

  const handleCreate = () => {
    void createGame(seatCount);
  };

  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (roomCode.length === 4) {
      void joinGame(roomCode);
    } else {
      showWarning("请输入4位房间号");
    }
  };

  const handleRejoin = async () => {
    if (lastRoomCode && !isRejoining) {
      setIsRejoining(true);
      await joinGame(lastRoomCode);
      // 如果还在这个页面，说明加入失败了
      setIsRejoining(false);
    }
  };

  const clearLastRoom = () => {
    localStorage.removeItem('grimoire_last_room');
    setLastRoomCode(null);
  };

  return (
    <div className="absolute inset-0 bg-stone-950 font-serif overflow-y-scroll overflow-x-hidden -webkit-overflow-scrolling-touch">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-stone-950 via-stone-900/50 to-stone-950 pointer-events-none"></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12 animate-fade-in">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-stone-500 font-cinzel text-sm tracking-[0.3em] uppercase mb-3">Welcome, {user?.name}</h2>
          <h1 className="text-5xl md:text-6xl font-bold text-stone-200 font-cinzel text-shadow-glow mb-4">
            选择你的命运
          </h1>
          <p className="text-stone-600 italic font-serif text-lg">Choose your destiny...</p>
        </div>

        {/* 继续上次游戏提示 */}
        {lastRoomCode && (
          <div className="mb-12 glass-panel border border-amber-900/30 rounded-lg p-6 flex items-center justify-between animate-float">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-amber-900/20 rounded-full flex items-center justify-center border border-amber-700/50">
                <span className="text-2xl">🔄</span>
              </div>
              <div>
                <p className="text-amber-200 font-bold font-cinzel text-lg">检测到上次游戏 (Resume Game)</p>
                <p className="text-amber-400/60 text-sm font-mono tracking-wider">ROOM: {lastRoomCode}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => void handleRejoin()}
                disabled={isRejoining}
                className="px-6 py-2 bg-amber-800 hover:bg-amber-700 disabled:bg-stone-800 disabled:cursor-wait text-white rounded font-bold font-cinzel tracking-wider shadow-lg transition-all hover:scale-105"
              >
                {isRejoining ? 'CONNECTING...' : 'RESUME'}
              </button>
              <button
                onClick={clearLastRoom}
                disabled={isRejoining}
                className="px-4 py-2 bg-stone-900/50 hover:bg-stone-800 text-stone-500 hover:text-stone-300 rounded transition-colors disabled:opacity-50 border border-stone-800"
                title="清除记录"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">

          {/* CREATE ROOM CARD */}
          <div className="glass-panel p-8 rounded-xl flex flex-col items-center text-center group hover:border-red-900/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(127,29,29,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="w-20 h-20 bg-stone-900/80 rounded-full flex items-center justify-center mb-6 border border-stone-700 group-hover:scale-110 transition-transform duration-500 group-hover:border-red-800 group-hover:bg-red-950/30 shadow-xl relative z-10">
              <span className="text-4xl filter drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">🕯️</span>
            </div>

            <h3 className="text-3xl font-bold text-stone-200 font-cinzel mb-3 relative z-10">创建房间</h3>
            <p className="text-stone-500 mb-8 relative z-10 font-serif">开启一个新的仪式，召集村民与恶魔。<br /><span className="text-xs opacity-60">(Start a new ritual)</span></p>

            <div className="w-full space-y-6 mb-8 relative z-10 bg-stone-950/30 p-6 rounded-lg border border-stone-800/50">
              <div className="flex justify-between items-center text-stone-300 font-bold font-cinzel">
                <span className="text-sm tracking-wider">人数 (PLAYERS)</span>
                <span className="text-3xl text-red-600 font-black">{seatCount}</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                value={seatCount}
                onChange={(e) => setSeatCount(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-red-800 hover:accent-red-700 transition-colors"
              />
              <div className="flex justify-between text-[10px] text-stone-600 font-cinzel tracking-widest uppercase">
                <span>Teensy (5)</span>
                <span>Standard (12)</span>
                <span>Legion (20)</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-4 bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 text-stone-100 font-bold rounded font-cinzel tracking-[0.2em] border border-red-900/50 shadow-lg transition-all active:scale-[0.98] relative z-10 group/btn overflow-hidden"
            >
              <span className="relative z-10">开始仪式 (CREATE)</span>
              <div className="absolute inset-0 bg-red-600/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
            </button>
          </div>

          {/* JOIN ROOM CARD */}
          <div className="glass-panel p-8 rounded-xl flex flex-col items-center text-center group hover:border-blue-900/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(30,58,138,0.15)] relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="w-20 h-20 bg-stone-900/80 rounded-full flex items-center justify-center mb-6 border border-stone-700 group-hover:scale-110 transition-transform duration-500 group-hover:border-blue-800 group-hover:bg-blue-950/30 shadow-xl relative z-10">
              <span className="text-4xl filter drop-shadow-[0_0_5px_rgba(37,99,235,0.5)]">🗝️</span>
            </div>

            <h3 className="text-3xl font-bold text-stone-200 font-cinzel mb-3 relative z-10">加入房间</h3>
            <p className="text-stone-500 mb-8 relative z-10 font-serif">输入房间号码，进入已存在的迷雾。<br /><span className="text-xs opacity-60">(Enter the mist)</span></p>

            <form onSubmit={handleJoin} className="w-full space-y-6 mb-8 mt-auto relative z-10">
              <div className="relative group/input">
                <input
                  type="text"
                  maxLength={4}
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="8888"
                  className="w-full bg-stone-950/50 border-b-2 border-stone-700 py-6 text-center text-4xl text-stone-100 tracking-[0.5em] font-cinzel focus:border-blue-700 focus:bg-stone-900/80 outline-none transition-all placeholder-stone-800"
                />
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-700 scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-500"></div>
              </div>
            </form>

            <button
              onClick={handleJoin}
              disabled={roomCode.length !== 4}
              className="w-full py-4 bg-gradient-to-r from-stone-900 to-stone-800 hover:from-blue-950 hover:to-blue-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-stone-900 disabled:hover:to-stone-800 text-stone-100 font-bold rounded font-cinzel tracking-[0.2em] border border-stone-700 hover:border-blue-800 shadow-lg transition-all active:scale-[0.98] relative z-10"
            >
              进入房间 (JOIN)
            </button>
          </div>

        </div>

        {/* SANDBOX MODE SECTION */}
        <div className="mt-12 border-t border-stone-800/50 pt-12">
          <div className="text-center mb-8">
            <h2 className="text-lg text-stone-500 font-cinzel tracking-widest uppercase opacity-70">或者尝试 (Or Try)...</h2>
          </div>

          <div className="glass-panel p-6 rounded-lg group hover:border-emerald-900/50 transition-all hover:shadow-[0_0_30px_rgba(6,78,59,0.15)] max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center border border-stone-700 group-hover:scale-110 transition-transform group-hover:border-emerald-700 group-hover:bg-emerald-950/30 shrink-0 shadow-lg">
                <span className="text-3xl">🧪</span>
              </div>

              <div className="flex-1 text-center md:text-left">
                <h3 className="text-xl font-bold text-stone-200 font-cinzel mb-2 group-hover:text-emerald-400 transition-colors">沙盒模式 (Sandbox)</h3>
                <p className="text-sm text-stone-500 leading-relaxed">
                  本地练习模式，无需联网。适合学习规则、测试剧本配置、熟悉说书人操作。<br />
                  <span className="text-xs opacity-70">Local practice mode. No internet required.</span>
                </p>
              </div>

              <div className="shrink-0 w-full md:w-auto">
                {showSandboxOptions ? (
                  <div className="flex flex-col md:flex-row items-center gap-3 animate-fade-in">
                    <select
                      value={seatCount}
                      onChange={(e) => setSeatCount(parseInt(e.target.value))}
                      className="bg-stone-950 border border-stone-700 text-stone-200 px-4 py-2 rounded text-sm focus:outline-none focus:border-emerald-600 w-full md:w-auto font-cinzel"
                    >
                      {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                        <option key={n} value={n}>{n} Players</option>
                      ))}
                    </select>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => {
                          startSandbox(seatCount);
                        }}
                        className="flex-1 md:flex-none px-6 py-2 bg-emerald-900 hover:bg-emerald-800 text-white font-bold rounded font-cinzel tracking-wider border border-emerald-950 shadow-lg transition-all active:scale-[0.98]"
                      >
                        START
                      </button>
                      <button
                        onClick={() => setShowSandboxOptions(false)}
                        className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded transition-colors border border-stone-700"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSandboxOptions(true)}
                    className="w-full md:w-auto px-8 py-3 bg-stone-900/50 hover:bg-emerald-950/50 text-stone-300 hover:text-emerald-200 font-bold rounded font-cinzel tracking-wider border border-stone-700 hover:border-emerald-800 shadow-lg transition-all active:scale-[0.98]"
                  >
                    进入沙盒 →
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 text-[10px] text-stone-600 font-cinzel tracking-wider uppercase border-t border-stone-800/30 pt-4">
              <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> Offline</span>
              <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> Solo Play</span>
              <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> Full Features</span>
              <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> No Save</span>
            </div>
          </div>
        </div>

        <button
          onClick={leaveGame}
          className="mt-12 mx-auto block text-stone-600 hover:text-stone-400 text-xs font-cinzel tracking-[0.2em] transition-colors pb-16 hover:underline underline-offset-4"
        >
          ← 返回登录 (BACK TO LOGIN)
        </button>

        {/* 管理员入口 - 隐藏在角落 */}
        <button
          onClick={() => setShowAdmin(true)}
          className="fixed bottom-4 right-4 w-8 h-8 bg-stone-900/20 hover:bg-stone-800 text-stone-700 hover:text-amber-500 rounded-full flex items-center justify-center transition-colors border border-stone-800/20 hover:border-amber-900/50"
          title="管理员"
        >
          <span className="text-xs">👑</span>
        </button>

        {/* 管理员面板 */}
        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      </div>
    </div>
  );
};
