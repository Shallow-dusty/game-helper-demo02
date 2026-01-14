import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { ROLES, TEAM_COLORS } from '../../constants';
import type { Seat } from '../../types';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { Confetti } from './Confetti';
import { useTranslation } from 'react-i18next';

interface TruthRevealProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 终局"真相揭示" (The Truth Unveiled)
 * 
 * 游戏结束时的戏剧性高潮：
 * - 数字故障/噪点特效
 * - 所有"虚假"状态破碎，露出真实 Token
 * - 中毒/醉酒标记高亮闪烁
 */
export const TruthReveal: React.FC<TruthRevealProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const gameState = useStore(state => state.gameState);
  const seats = gameState?.seats || [];
  const gameOver = gameState?.gameOver;
  
  const { playSound, preloadSounds } = useSoundEffect();
  
  const [phase, setPhase] = useState<'glitch' | 'reveal' | 'complete'>('glitch');
  const [revealedSeats, setRevealedSeats] = useState<Set<number>>(new Set());
  
  // 预加载音效
  useEffect(() => {
    preloadSounds(['clock_chime', 'death_toll', 'success']);
  }, [preloadSounds]);
  
  // 动画序列
  useEffect(() => {
    if (!isOpen) {
      setPhase('glitch');
      setRevealedSeats(new Set());
      return;
    }
    
    // 开始故障效果
    playSound('clock_chime');
    
    // 1秒后开始揭示
    const revealTimer = setTimeout(() => {
      setPhase('reveal');
      
      // 逐个揭示座位
      seats.forEach((seat, index) => {
        setTimeout(() => {
          setRevealedSeats(prev => new Set([...prev, seat.id]));
          if (seat.realRoleId !== seat.seenRoleId) {
            playSound('death_toll');
          }
        }, index * 200);
      });
    }, 1500);
    
    // 全部揭示后进入完成状态
    const completeTimer = setTimeout(() => {
      setPhase('complete');
      playSound('success');
    }, 1500 + seats.length * 200 + 500);
    
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(completeTimer);
    };
  }, [isOpen, seats, playSound]);
  
  // 查找被误导的座位（表里不一）
  const getMisledSeats = useCallback((): Seat[] => {
    return seats.filter(s => s.realRoleId && s.seenRoleId && s.realRoleId !== s.seenRoleId);
  }, [seats]);
  
  // 查找有状态的座位
  const getTaintedSeats = useCallback((): Seat[] => {
    return seats.filter(s => s.statuses.includes('POISONED') || s.statuses.includes('DRUNK'));
  }, [seats]);
  
  if (!isOpen || !gameOver) return null;
  
  const winner = gameOver.winner;
  const misledSeats = getMisledSeats();
  const taintedSeats = getTaintedSeats();
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] flex items-center justify-center"
        onClick={phase === 'complete' ? onClose : undefined}
      >
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-black/90" />
        
        {/* 噪点效果 */}
        {phase === 'glitch' && (
          <div className="noise-overlay opacity-20" />
        )}
        
        {/* 彩带效果 */}
        {phase === 'complete' && winner === 'GOOD' && (
          <Confetti active={true} />
        )}
        
        {/* 主内容 */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 w-full max-w-4xl mx-4"
        >
          {/* 标题 */}
          <motion.div
            className={`text-center mb-8 ${phase === 'glitch' ? 'glitch-effect' : ''}`}
            data-text={winner === 'GOOD' ? t('game.truthReveal.goodWin') : t('game.truthReveal.evilWin')}
          >
            <h1 className={`
              font-cinzel text-4xl md:text-6xl font-bold tracking-wider
              ${winner === 'GOOD' ? 'text-amber-400' : 'text-red-500'}
              ${phase === 'glitch' ? 'animate-pulse' : ''}
            `}>
              {winner === 'GOOD' ? t('game.truthReveal.goodWinFull') : t('game.truthReveal.evilWinFull')}
            </h1>
            <p className="text-stone-400 mt-2 text-lg">{gameOver.reason}</p>
          </motion.div>
          
          {/* 真相揭示面板 */}
          {phase !== 'glitch' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel rounded-xl p-6"
            >
              <h2 className="font-cinzel text-xl text-amber-400 mb-4 text-center">
                {t('game.truthReveal.title')}
              </h2>
              
              {/* 座位网格 */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {seats.map((seat) => {
                  const isRevealed = revealedSeats.has(seat.id);
                  const isMisled = seat.realRoleId !== seat.seenRoleId;
                  const isTainted = seat.statuses.includes('POISONED') || seat.statuses.includes('DRUNK');
                  const realRole = seat.realRoleId ? ROLES[seat.realRoleId] : null;
                  const seenRole = seat.seenRoleId ? ROLES[seat.seenRoleId] : null;
                  const displayRole = isRevealed ? realRole : seenRole;
                  const teamColor = displayRole ? TEAM_COLORS[displayRole.team] : '#44403c';
                  
                  return (
                    <motion.div
                      key={seat.id}
                      initial={{ opacity: 0, rotateY: 0 }}
                      animate={{ 
                        opacity: 1, 
                        rotateY: isRevealed && isMisled ? 180 : 0,
                      }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                      className={`
                        relative p-3 rounded-lg border
                        ${seat.isDead ? 'bg-stone-900/50 border-stone-700' : 'bg-stone-800/50 border-stone-600'}
                        ${isTainted && isRevealed ? 'animate-pulse ring-2 ring-purple-500/50' : ''}
                      `}
                      style={{ perspective: '1000px' }}
                    >
                      {/* 破碎效果（误导揭示时） */}
                      {isRevealed && isMisled && (
                        <motion.div
                          initial={{ opacity: 1 }}
                          animate={{ opacity: 0 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                          className="absolute inset-0 flex items-center justify-center"
                        >
                          <div className="text-4xl animate-ping">💥</div>
                        </motion.div>
                      )}
                      
                      {/* 座位号 */}
                      <div className="text-xs text-stone-500 mb-1">
                        #{seat.id + 1}
                      </div>
                      
                      {/* 玩家名 */}
                      <div className={`font-bold ${seat.isDead ? 'text-stone-500 line-through' : 'text-stone-200'}`}>
                        {seat.userName}
                      </div>
                      
                      {/* 角色信息 */}
                      <div 
                        className="mt-2 px-2 py-1 rounded text-sm font-cinzel text-center"
                        style={{ backgroundColor: `${teamColor}33`, color: teamColor }}
                      >
                        {displayRole?.name || t('history.unknownRole')}
                        {displayRole?.icon && <span className="ml-1">{displayRole.icon}</span>}
                      </div>
                      
                      {/* 误导标记 */}
                      {isRevealed && isMisled && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-2 -right-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-full"
                        >
                          {t('game.truthReveal.disguised')}
                        </motion.div>
                      )}
                      
                      {/* 状态标记 */}
                      {isTainted && isRevealed && (
                        <div className="flex gap-1 mt-2 justify-center">
                          {seat.statuses.includes('POISONED') && (
                            <span className="text-xs bg-green-900/50 text-green-400 px-2 py-0.5 rounded animate-pulse">
                              {t('game.truthReveal.poisoned')}
                            </span>
                          )}
                          {seat.statuses.includes('DRUNK') && (
                            <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded animate-pulse">
                              {t('game.truthReveal.drunk')}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* 死亡标记 */}
                      {seat.isDead && (
                        <div className="absolute top-1 right-1 text-red-500">☠️</div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
              
              {/* 统计信息 */}
              {phase === 'complete' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 pt-4 border-t border-stone-700 grid grid-cols-3 gap-4 text-center"
                >
                  <div>
                    <div className="text-2xl font-bold text-amber-400">
                      {misledSeats.length}
                    </div>
                    <div className="text-xs text-stone-500">{t('game.truthReveal.disguisedCount')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-400">
                      {taintedSeats.length}
                    </div>
                    <div className="text-xs text-stone-500">{t('game.truthReveal.affectedCount')}</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">
                      {seats.filter(s => s.isDead).length}
                    </div>
                    <div className="text-xs text-stone-500">{t('game.truthReveal.deathCount')}</div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
          
          {/* 关闭提示 */}
          {phase === 'complete' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-center text-stone-500 mt-6"
            >
              {t('game.truthReveal.clickToClose')}
            </motion.p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TruthReveal;
