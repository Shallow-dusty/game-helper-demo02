import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { useSandboxStore } from '../../sandboxStore';
import { AdminPanel } from '../controls/AdminPanel';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { BackgroundEffects } from '../ui/BackgroundEffects';
import { motion } from 'framer-motion';
import { Flame, Key, RotateCcw, X, FlaskConical, Crown } from 'lucide-react';

export const RoomSelection = () => {
  const { t } = useTranslation();
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
  const [joinError, setJoinError] = useState('');
  const [isJoining, setIsJoining] = useState(false);

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
    
    // 清除之前的错误
    setJoinError('');

    if (roomCode.length !== 4) {
      setJoinError(t('lobby.enterRoomCode4'));
      return;
    }
    
    // 防止连续点击
    if (isJoining) return;
    
    setIsJoining(true);
    void joinGame(roomCode).catch(() => {
      // joinGame内部已经处理了错误，但我们仍然重置状态
      setIsJoining(false);
    });
    // 注意：如果加入失败，用户还在这个页面，需要重置状态
    // 使用setTimeout确保错误Toast有时间显示
    setTimeout(() => {
      setIsJoining(false);
    }, 1000);
  };

  const handleRejoin = () => {
    if (lastRoomCode && !isRejoining) {
      setIsRejoining(true);
      void joinGame(lastRoomCode).finally(() => {
        // 如果还在这个页面，说明加入失败了
        setIsRejoining(false);
      });
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
          <h2 className="text-stone-500 font-cinzel text-sm tracking-[0.3em] uppercase mb-3">{t('lobby.welcome')}, {user?.name}</h2>
          <h1 className="text-5xl md:text-6xl font-bold text-stone-200 font-cinzel text-shadow-glow mb-4">
            {t('lobby.chooseDestiny')}
          </h1>
          <p className="text-stone-600 italic font-serif text-lg">{t('lobby.townWaiting')}</p>
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
                    <p className="text-amber-200 font-bold font-cinzel text-lg">{t('lobby.resumeGame')}</p>
                    <p className="text-amber-400/60 text-sm font-mono tracking-wider">{t('lobby.roomCode')}: {lastRoomCode}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleRejoin()}
                    disabled={isRejoining}
                    variant="gold"
                    className="font-bold tracking-wider"
                  >
                    {isRejoining ? t('lobby.connecting') : t('lobby.resume')}
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

              <CardHeader className="items-center text-center pb-6 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-stone-900 to-black rounded-full flex items-center justify-center mb-6 border border-stone-700 group-hover:scale-110 transition-transform duration-500 group-hover:border-red-800 group-hover:bg-red-950/30 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative">
                  <div className="absolute inset-0 bg-red-900/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Flame className="w-12 h-12 text-stone-500 group-hover:text-red-500 transition-colors duration-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.6)] relative z-10" />
                </div>
                <CardTitle className="text-3xl text-stone-200 font-cinzel tracking-wide group-hover:text-red-400 transition-colors">{t('lobby.createRoomTitle')}</CardTitle>
                <CardDescription className="font-serif italic text-stone-500">{t('lobby.startRitual')}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 relative z-10">
                <div className="bg-stone-950/30 p-6 rounded-lg border border-stone-800/50 space-y-4 group-hover:border-red-900/30 transition-colors">
                  <div className="flex justify-between items-center text-stone-300 font-bold font-cinzel">
                    <span className="text-sm tracking-wider">{t('lobby.playerCount')}</span>
                    <span className="text-3xl text-red-600 font-black drop-shadow-sm">{seatCount}</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="20"
                    value={seatCount}
                    onChange={(e) => setSeatCount(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-red-800 hover:accent-red-700 transition-colors"
                  />
                  <div className="flex justify-between text-[10px] text-stone-600 font-cinzel tracking-widest uppercase">
                    <span>{t('lobby.small')} (5)</span>
                    <span>{t('lobby.standard')} (12)</span>
                    <span>{t('lobby.large')} (20)</span>
                  </div>
                </div>

                <Button
                  onClick={handleCreate}
                  className="w-full h-14 text-lg font-cinzel tracking-[0.2em] bg-gradient-to-r from-red-950 to-red-900 hover:from-red-900 hover:to-red-800 border-red-900/50 shadow-lg group/btn relative overflow-hidden transition-all hover:shadow-red-900/20"
                >
                  <span className="relative z-10">{t('lobby.createRitualBtn')}</span>
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

              <CardHeader className="items-center text-center pb-6 relative z-10">
                <div className="w-24 h-24 bg-gradient-to-br from-stone-900 to-black rounded-full flex items-center justify-center mb-6 border border-stone-700 group-hover:scale-110 transition-transform duration-500 group-hover:border-blue-800 group-hover:bg-blue-950/30 shadow-[0_0_20px_rgba(0,0,0,0.5)] relative">
                  <div className="absolute inset-0 bg-blue-900/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <Key className="w-12 h-12 text-stone-500 group-hover:text-blue-500 transition-colors duration-500 drop-shadow-[0_0_8px_rgba(37,99,235,0.6)] relative z-10" />
                </div>
                <CardTitle className="text-3xl text-stone-200 font-cinzel tracking-wide group-hover:text-blue-400 transition-colors">{t('lobby.joinRoomTitle')}</CardTitle>
                <CardDescription className="font-serif italic text-stone-500">{t('lobby.enterCode')}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 relative z-10">
                <form onSubmit={handleJoin} className="space-y-8">
                  <div className="relative group/input">
                    <input
                      type="text"
                      maxLength={4}
                      value={roomCode}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRoomCode(val);
                        // 清除错误消息
                        if (joinError) setJoinError('');
                        // Auto-submit when 4 digits are entered
                        if (val.length === 4 && !isJoining) {
                          handleJoin();
                        }
                      }}
                      placeholder="8888"
                      className={`w-full bg-stone-900/50 border rounded-lg px-6 py-4 text-4xl text-center font-cinzel tracking-[0.5em] text-stone-100 placeholder:text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-900/50 focus:border-blue-700 transition-all group-hover/input:border-stone-600 ${roomCode.length === 4 ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'border-stone-700'}`}
                    />
                    <div className="absolute inset-0 rounded-lg bg-blue-500/5 opacity-0 group-hover/input:opacity-100 pointer-events-none transition-opacity" />
                  </div>

                  <Button
                    type="submit"
                    disabled={roomCode.length !== 4 || isJoining}
                    className={`w-full h-14 text-lg font-cinzel tracking-[0.2em] shadow-lg group/btn relative overflow-hidden transition-all duration-300 ${roomCode.length === 4 && !isJoining ? 'bg-blue-600 hover:bg-blue-500 border-blue-400 shadow-blue-900/50 scale-[1.02]' : 'bg-gradient-to-r from-blue-950 to-blue-900 hover:from-blue-900 hover:to-blue-800 border-blue-900/50'}`}
                  >
                    <span className="relative z-10">
                      {isJoining ? t('lobby.connecting') : roomCode.length === 4 ? t('lobby.enterNow') : t('lobby.enterTown')}
                    </span>
                    <div className="absolute inset-0 bg-blue-600/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                  </Button>
                  
                  {/* 错误消息显示 */}
                  {joinError && (
                    <div className="mt-3 p-3 bg-red-950/30 border border-red-800/50 rounded-lg text-center">
                      <p className="text-red-400 text-sm font-cinzel">{joinError}</p>
                    </div>
                  )}
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
                  <span className="text-stone-400 font-cinzel tracking-wider">{t('lobby.moreOptions')}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-stone-600">
                  {showSandboxOptions ? t('lobby.collapse') : t('lobby.expand')}
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
                      <span className="flex items-center gap-2 text-stone-300 font-bold"><Crown className="w-4 h-4" /> {t('lobby.sandboxMode')}</span>
                      <span className="text-[10px] text-stone-500">{t('lobby.singleSimulation')}</span>
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => { /* Offline logic placeholder */ }}
                      disabled
                      title="离线模式暂不可用，此功能正在开发中"
                      className="h-auto py-4 flex flex-col gap-2 bg-stone-900/30 border-stone-800 opacity-50 cursor-not-allowed"
                    >
                      <span className="flex items-center gap-2 text-stone-400 font-bold"><RotateCcw className="w-4 h-4" /> {t('lobby.offlineMode')}</span>
                      <span className="text-[10px] text-stone-600">{t('lobby.comingSoon')}</span>
                    </Button>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-4 text-[10px] text-stone-600 font-cinzel tracking-wider uppercase border-t border-stone-800/30 pt-4">
                    <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> {t('lobby.offlineAvailable')}</span>
                    <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> {t('lobby.singlePlayer')}</span>
                    <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> {t('lobby.fullFeatures')}</span>
                    <span className="flex items-center gap-1"><span className="text-emerald-700">✓</span> {t('lobby.noSave')}</span>
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
          ← {t('lobby.backToLogin')}
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




