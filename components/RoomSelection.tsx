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
          <h2 className="text-stone-500 font-cinzel text-sm tracking-[0.3em] uppercase mb-3">欢迎, {user?.name}</h2>
          <h1 className="text-5xl md:text-6xl font-bold text-stone-200 font-cinzel text-shadow-glow mb-4">
            选择你的命运
          </h1>
          <p className="text-stone-600 italic font-serif text-lg">小镇正在等待你的抉择...</p>
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
                    <p className="text-amber-200 font-bold font-cinzel text-lg">恢复上一局游戏</p>
                    <p className="text-amber-400/60 text-sm font-mono tracking-wider">房间号: {lastRoomCode}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => void handleRejoin()}
                    disabled={isRejoining}
                    variant="gold"
                    className="font-bold tracking-wider"
                  >
                    {isRejoining ? '连接中...' : '恢复'}
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
                <CardTitle className="text-3xl text-stone-200">创建房间</CardTitle>
                <CardDescription>开始一场新的仪式，召唤镇民。</CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 relative z-10">
                <div className="bg-stone-950/30 p-6 rounded-lg border border-stone-800/50 space-y-4">
                  <div className="flex justify-between items-center text-stone-300 font-bold font-cinzel">
                    <span className="text-sm tracking-wider">玩家人数</span>
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
                    <span>小型 (5)</span>
                    <span>标准 (12)</span>
                    <span>大型 (20)</span>
                  </div>
                </div>

                <Button
                  onClick={handleCreate}
                  className="w-full h-14 text-lg font-cinzel tracking-[0.2em] bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 border-red-900/50 shadow-lg group/btn relative overflow-hidden"
                >
                  <span className="relative z-10">创建仪式</span>
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
                <CardTitle className="text-3xl text-stone-200">加入房间</CardTitle>
                <CardDescription>输入代码加入现有的城镇。</CardDescription>
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
                      className="w-full bg-stone-900/50 border border-stone-700 rounded-lg px-6 py-4 text-4xl text-center font-cinzel tracking-[0.5em] text-stone-100 placeholder:text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-900/50 focus:border-blue-700 transition-all"
                    />
                    <div className="absolute inset-0 rounded-lg bg-blue-500/5 opacity-0 group-hover/input:opacity-100 pointer-events-none transition-opacity" />
                  </div>

                  <Button
                    type="submit"
                    disabled={roomCode.length !== 4}
                    className="w-full h-14 text-lg font-cinzel tracking-[0.2em] bg-gradient-to-r from-blue-950 to-blue-900 hover:from-blue-900 hover:to-blue-800 border-blue-900/50 shadow-lg group/btn relative overflow-hidden"
                  >
                    <span className="relative z-10">进入城镇</span>
                    <div className="absolute inset-0 bg-blue-600/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

        </div>

        {/* Sandbox & Offline Options */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-16 max-w-2xl mx-auto"
        >
          <Card className="border-stone-900 bg-stone-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowSandboxOptions(!showSandboxOptions)}>
                <div className="flex items-center gap-3">
                  <FlaskConical className="w-5 h-5 text-stone-500" />
                  <span className="text-stone-400 font-cinzel tracking-wider">更多选项 (沙盒 & 离线)</span>
                </div>
                <Button variant="ghost" size="sm" className="text-stone-600">
                  {showSandboxOptions ? '收起' : '展开'}
                </Button>
              </div>

              {showSandboxOptions && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="overflow-hidden"
                >
                  <div className="pt-6 grid grid-cols-2 gap-4">
                    <Button
                      variant="secondary"
                      onClick={() => startSandbox(12)}
                      className="h-auto py-4 flex flex-col gap-2 bg-stone-900/50 border-stone-800 hover:border-stone-600"
                    >
                      <span className="flex items-center gap-2 text-stone-300 font-bold"><Crown className="w-4 h-4" /> 沙盒模式</span>
                      <span className="text-[10px] text-stone-500">单人模拟 • 自由测试</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { /* Offline logic placeholder */ }}
                      disabled
                      className="h-auto py-4 flex flex-col gap-2 bg-stone-900/30 border-stone-800 opacity-50 cursor-not-allowed"
                    >
                      <span className="flex items-center gap-2 text-stone-400 font-bold"><RotateCcw className="w-4 h-4" /> 离线模式</span>
                      <span className="text-[10px] text-stone-600">即将推出</span>
                    </Button>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 text-[10px] text-stone-600 font-cinzel tracking-wider uppercase border-t border-stone-800/30 pt-4">
                    <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> 离线可用</span>
                    <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> 单人游玩</span>
                    <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> 完整功能</span>
                    <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> 无需存档</span>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Button
          variant="ghost"
          onClick={leaveGame}
          className="mt-12 mx-auto flex text-stone-600 hover:text-stone-400 text-xs font-cinzel tracking-[0.2em] hover:bg-transparent hover:underline underline-offset-4"
        >
          ← 返回登录
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
