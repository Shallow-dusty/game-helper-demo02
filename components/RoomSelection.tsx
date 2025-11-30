import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useSandboxStore } from '../sandboxStore';
import { showWarning } from './Toast';
import { AdminPanel } from './AdminPanel';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { BackgroundEffects } from './ui/BackgroundEffects';
import { motion } from 'framer-motion';
import { Flame, Key, RotateCcw, X, FlaskConical, ArrowRight, Crown } from 'lucide-react';

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
    <div className="min-h-screen w-full relative overflow-y-auto overflow-x-hidden bg-stone-950">
      <BackgroundEffects />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-12">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-stone-500 font-cinzel text-sm tracking-[0.3em] uppercase mb-3">Welcome, {user?.name}</h2>
          <h1 className="text-5xl md:text-6xl font-bold text-stone-200 font-cinzel text-shadow-glow mb-4">
            Choose Your Destiny
          </h1>
          <p className="text-stone-600 italic font-serif text-lg">The town awaits your decision...</p>
        </motion.div>

        {/* Resume Game Alert */}
        {lastRoomCode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 max-w-2xl mx-auto"
          >
            <Card className="border-amber-900/30 bg-amber-950/10 backdrop-blur-md">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-900/20 rounded-full flex items-center justify-center border border-amber-700/50 animate-pulse">
                    <RotateCcw className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-amber-200 font-bold font-cinzel text-lg">Resume Previous Game</p>
                    <p className="text-amber-400/60 text-sm font-mono tracking-wider">ROOM: {lastRoomCode}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => void handleRejoin()}
                    disabled={isRejoining}
                    variant="gold"
                    className="font-bold tracking-wider"
                  >
                    {isRejoining ? 'CONNECTING...' : 'RESUME'}
                  </Button>
                  <Button
                    onClick={clearLastRoom}
                    disabled={isRejoining}
                    variant="ghost"
                    size="icon"
                    className="text-stone-500 hover:text-stone-300"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">

          {/* CREATE ROOM CARD */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full border-stone-800 bg-stone-950/50 hover:border-red-900/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(127,29,29,0.15)] group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-red-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="items-center text-center pb-2 relative z-10">
                <div className="w-20 h-20 bg-stone-900/80 rounded-full flex items-center justify-center mb-4 border border-stone-700 group-hover:scale-110 transition-transform duration-500 group-hover:border-red-800 group-hover:bg-red-950/30 shadow-xl">
                  <Flame className="w-10 h-10 text-red-700 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]" />
                </div>
                <CardTitle className="text-3xl text-stone-200">Create Room</CardTitle>
                <CardDescription>Start a new ritual and summon the townsfolk.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 relative z-10">
                <div className="bg-stone-950/30 p-6 rounded-lg border border-stone-800/50 space-y-4">
                  <div className="flex justify-between items-center text-stone-300 font-bold font-cinzel">
                    <span className="text-sm tracking-wider">PLAYERS</span>
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

                <Button
                  onClick={handleCreate}
                  className="w-full h-14 text-lg font-cinzel tracking-[0.2em] bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 border-red-900/50 shadow-lg group/btn relative overflow-hidden"
                >
                  <span className="relative z-10">CREATE RITUAL</span>
                  <div className="absolute inset-0 bg-red-600/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* JOIN ROOM CARD */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full border-stone-800 bg-stone-950/50 hover:border-blue-900/50 transition-all duration-500 hover:shadow-[0_0_40px_rgba(30,58,138,0.15)] group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <CardHeader className="items-center text-center pb-2 relative z-10">
                <div className="w-20 h-20 bg-stone-900/80 rounded-full flex items-center justify-center mb-4 border border-stone-700 group-hover:scale-110 transition-transform duration-500 group-hover:border-blue-800 group-hover:bg-blue-950/30 shadow-xl">
                  <Key className="w-10 h-10 text-blue-700 drop-shadow-[0_0_5px_rgba(37,99,235,0.5)]" />
                </div>
                <CardTitle className="text-3xl text-stone-200">Join Room</CardTitle>
                <CardDescription>Enter the code to join an existing town.</CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 relative z-10 flex flex-col justify-end h-[calc(100%-180px)]">
                <form onSubmit={handleJoin} className="space-y-8">
                  <div className="relative group/input">
                    <input
                      type="text"
                      maxLength={4}
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value)}
                      placeholder="8888"
                      className="w-full bg-stone-950/50 border-b-2 border-stone-700 py-6 text-center text-4xl text-stone-100 tracking-[0.5em] font-cinzel focus:border-blue-700 focus:bg-stone-900/80 outline-none transition-all placeholder-stone-800"
                    />
                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-700 scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-500" />
                  </div>

                  <Button
                    onClick={handleJoin}
                    disabled={roomCode.length !== 4}
                    className="w-full h-14 text-lg font-cinzel tracking-[0.2em] bg-gradient-to-r from-stone-900 to-stone-800 hover:from-blue-950 hover:to-blue-900 border-stone-700 hover:border-blue-800 shadow-lg"
                  >
                    ENTER ROOM
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* SANDBOX MODE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 border-t border-stone-800/50 pt-12"
        >
          <div className="text-center mb-8">
            <h2 className="text-lg text-stone-500 font-cinzel tracking-widest uppercase opacity-70">Or Try...</h2>
          </div>

          <Card className="max-w-3xl mx-auto border-stone-800 bg-stone-950/30 hover:border-emerald-900/50 transition-all hover:shadow-[0_0_30px_rgba(6,78,59,0.15)] group">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-16 h-16 bg-stone-900 rounded-full flex items-center justify-center border border-stone-700 group-hover:scale-110 transition-transform group-hover:border-emerald-700 group-hover:bg-emerald-950/30 shrink-0 shadow-lg">
                  <FlaskConical className="w-8 h-8 text-emerald-700" />
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-stone-200 font-cinzel mb-2 group-hover:text-emerald-400 transition-colors">Sandbox Mode</h3>
                  <p className="text-sm text-stone-500 leading-relaxed">
                    Local practice mode. No internet required. Perfect for learning roles or testing scripts.
                  </p>
                </div>

                <div className="shrink-0 w-full md:w-auto">
                  {showSandboxOptions ? (
                    <div className="flex flex-col md:flex-row items-center gap-3 animate-fade-in">
                      <select
                        value={seatCount}
                        onChange={(e) => setSeatCount(parseInt(e.target.value))}
                        className="bg-stone-950 border border-stone-700 text-stone-200 px-4 py-2 rounded text-sm focus:outline-none focus:border-emerald-600 w-full md:w-auto font-cinzel h-10"
                      >
                        {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                          <option key={n} value={n}>{n} Players</option>
                        ))}
                      </select>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Button
                          onClick={() => startSandbox(seatCount)}
                          className="flex-1 md:flex-none bg-emerald-900 hover:bg-emerald-800 border-emerald-950"
                        >
                          START
                        </Button>
                        <Button
                          onClick={() => setShowSandboxOptions(false)}
                          variant="ghost"
                          size="icon"
                          className="border border-stone-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setShowSandboxOptions(true)}
                      variant="outline"
                      className="w-full md:w-auto border-stone-700 hover:border-emerald-800 hover:text-emerald-200 hover:bg-emerald-950/50"
                    >
                      Enter Sandbox <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 text-[10px] text-stone-600 font-cinzel tracking-wider uppercase border-t border-stone-800/30 pt-4">
                <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> Offline</span>
                <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> Solo Play</span>
                <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> Full Features</span>
                <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> No Save</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <Button
          variant="ghost"
          onClick={leaveGame}
          className="mt-12 mx-auto flex text-stone-600 hover:text-stone-400 text-xs font-cinzel tracking-[0.2em] hover:bg-transparent hover:underline underline-offset-4"
        >
          ← BACK TO LOGIN
        </Button>

        {/* Admin Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowAdmin(true)}
          className="fixed bottom-4 right-4 rounded-full bg-stone-900/20 hover:bg-stone-800 text-stone-700 hover:text-amber-500 border border-stone-800/20 hover:border-amber-900/50"
        >
          <Crown className="w-4 h-4" />
        </Button>

        {/* Admin Panel */}
        {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      </div>
    </div>
  );
};
