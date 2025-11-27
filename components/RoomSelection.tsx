import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { showWarning } from './Toast';

export const RoomSelection = () => {
  const user = useStore(state => state.user);
  const createGame = useStore(state => state.createGame);
  const joinGame = useStore(state => state.joinGame);
  const leaveGame = useStore(state => state.leaveGame);

  const [seatCount, setSeatCount] = useState(12); // Default setup
  const [roomCode, setRoomCode] = useState('');
  const [lastRoomCode, setLastRoomCode] = useState<string | null>(null);
  const [isRejoining, setIsRejoining] = useState(false);

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
    createGame(seatCount);
  };

  const handleJoin = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (roomCode.length === 4) {
      joinGame(roomCode);
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
      {/* Background Ambience - 使用 absolute 而非 fixed */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none" style={{position: 'fixed'}}></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-stone-900/50 to-black/80 pointer-events-none" style={{position: 'fixed'}}></div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-stone-500 font-cinzel text-sm tracking-[0.3em] uppercase mb-2">Welcome, {user?.name}</h2>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-200 font-cinzel text-shadow-lg">
            选择你的命运
          </h1>
          <p className="text-stone-600 italic mt-2 font-serif">Choose your destiny...</p>
        </div>

        {/* 继续上次游戏提示 */}
        {lastRoomCode && (
          <div className="mb-8 bg-amber-950/30 border border-amber-800/50 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="text-amber-200 font-bold">检测到上次游戏</p>
                <p className="text-amber-400/70 text-sm">房间号: {lastRoomCode}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRejoin}
                disabled={isRejoining}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-amber-800 disabled:cursor-wait text-white rounded font-bold text-sm transition-colors"
              >
                {isRejoining ? '连接中...' : '继续游戏'}
              </button>
              <button
                onClick={clearLastRoom}
                disabled={isRejoining}
                className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-sm transition-colors disabled:opacity-50"
                title="清除记录"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">

          {/* CREATE ROOM CARD */}
          <div className="bg-stone-900/80 border border-stone-700 p-8 rounded shadow-2xl flex flex-col items-center text-center group hover:border-red-900/50 transition-all hover:shadow-[0_0_30px_rgba(127,29,29,0.2)]">
            <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mb-6 border border-stone-600 group-hover:scale-110 transition-transform group-hover:border-red-700 group-hover:bg-red-950">
              <span className="text-3xl">🕯️</span>
            </div>
            <h3 className="text-2xl font-bold text-stone-200 font-cinzel mb-2">创建房间</h3>
            <p className="text-sm text-stone-500 mb-8">开启一个新的仪式，召集村民与恶魔。</p>

            <div className="w-full space-y-6 mb-8">
              <div className="flex justify-between items-center text-stone-300 font-bold font-cinzel">
                <span>人数 (Players)</span>
                <span className="text-2xl text-red-500">{seatCount}</span>
              </div>
              <input
                type="range"
                min="5"
                max="20"
                value={seatCount}
                onChange={(e) => setSeatCount(parseInt(e.target.value))}
                className="w-full h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-red-700"
              />
              <div className="flex justify-between text-xs text-stone-600 font-serif">
                <span>5 (Teensy)</span>
                <span>12 (Standard)</span>
                <span>20 (Legion)</span>
              </div>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-4 bg-red-900 hover:bg-red-800 text-stone-100 font-bold rounded font-cinzel tracking-widest border border-red-950 shadow-lg transition-all active:scale-[0.98]"
            >
              开始仪式 (CREATE)
            </button>
          </div>

          {/* JOIN ROOM CARD */}
          <div className="bg-stone-900/80 border border-stone-700 p-8 rounded shadow-2xl flex flex-col items-center text-center group hover:border-blue-900/50 transition-all hover:shadow-[0_0_30px_rgba(30,58,138,0.2)]">
            <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mb-6 border border-stone-600 group-hover:scale-110 transition-transform group-hover:border-blue-700 group-hover:bg-blue-950">
              <span className="text-3xl">🗝️</span>
            </div>
            <h3 className="text-2xl font-bold text-stone-200 font-cinzel mb-2">加入房间</h3>
            <p className="text-sm text-stone-500 mb-8">输入房间号码，进入已存在的迷雾。</p>

            <form onSubmit={handleJoin} className="w-full space-y-6 mb-8 mt-auto">
              <input
                type="text"
                maxLength={4}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="例如: 8888"
                className="w-full bg-black/40 border-b-2 border-stone-600 py-4 text-center text-3xl text-stone-100 tracking-[0.5em] font-cinzel focus:border-blue-600 focus:bg-black/60 outline-none transition-all placeholder-stone-700"
              />
            </form>

            <button
              onClick={handleJoin}
              disabled={roomCode.length !== 4}
              className="w-full py-4 bg-stone-800 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-stone-800 text-stone-100 font-bold rounded font-cinzel tracking-widest border border-stone-950 shadow-lg transition-all active:scale-[0.98]"
            >
              进入房间 (JOIN)
            </button>
          </div>

        </div>

        <button
          onClick={leaveGame}
          className="mt-8 mx-auto block text-stone-600 hover:text-stone-400 text-sm font-cinzel tracking-widest transition-colors pb-16"
        >
          ← 返回登录 (Back to Login)
        </button>

      </div>
    </div>
  );
};