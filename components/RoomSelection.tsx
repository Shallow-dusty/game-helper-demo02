import React, { useState } from 'react';
import { useStore } from '../store';
import { showWarning } from './Toast';

export const RoomSelection = () => {
  const user = useStore(state => state.user);
  const createGame = useStore(state => state.createGame);
  const joinGame = useStore(state => state.joinGame);
  const leaveGame = useStore(state => state.leaveGame);

  const [seatCount, setSeatCount] = useState(12); // Default setup
  const [roomCode, setRoomCode] = useState('');

  const handleCreate = () => {
    createGame(seatCount);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomCode.length === 4) {
      joinGame(roomCode);
    } else {
      showWarning("请输入4位房间号");
    }
  };

  return (
    <div className="min-h-screen w-full bg-stone-950 font-serif relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-b from-black/80 via-stone-900/50 to-black/80 pointer-events-none"></div>

      {/* Scrollable Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl">

        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-stone-500 font-cinzel text-sm tracking-[0.3em] uppercase mb-2">Welcome, {user?.name}</h2>
          <h1 className="text-4xl md:text-5xl font-bold text-stone-200 font-cinzel text-shadow-lg">
            选择你的命运
          </h1>
          <p className="text-stone-600 italic mt-2 font-serif">Choose your destiny...</p>
        </div>

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
          className="mt-12 mx-auto block text-stone-600 hover:text-stone-400 text-sm font-cinzel tracking-widest transition-colors pb-8"
        >
          ← 返回登录 (Back to Login)
        </button>

      </div>
      </div>
    </div>
  );
};