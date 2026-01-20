import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { useSoundEffect } from '../../hooks/useSoundEffect';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

interface DoomsdayClockProps {
  className?: string;
}

/**
 * 命运时钟投票仪 (Doomsday Clock)
 * 
 * 复古机械钟面组件，用于具象化投票压力：
 * - 时针代表当前票数
 * - 12点位置标记"处决所需票数"
 * - 每增一票，时针伴随机械咬合声跳动
 * - 票数≥半数时，钟面泛红光，背景音加入急促滴答声
 */
export const DoomsdayClock: React.FC<DoomsdayClockProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  const { voting, seats } = useStore(
    useShallow(state => ({
      voting: state.gameState?.voting,
      seats: state.gameState?.seats ?? [],
    }))
  );
  
  const { playSound, playClockTick, preloadSounds } = useSoundEffect();
  
  // 预加载音效
  useEffect(() => {
    preloadSounds(['clock_tick', 'clock_tock', 'clock_chime', 'clock_alarm', 'gavel']);
  }, [preloadSounds]);
  
  // 当前票数
  const voteCount = voting?.votes.length ?? 0;
  // 存活玩家数（用于计算处决所需票数）
  const aliveCount = seats.filter(s => !s.isDead).length;
  // 处决所需票数（向上取整的一半）
  const requiredVotes = Math.ceil(aliveCount / 2);
  // 票数百分比
  const votePercentage = requiredVotes > 0 ? voteCount / requiredVotes : 0;
  // 是否达到危险区域（≥50%）
  const isDanger = votePercentage >= 0.5;
  // 是否已达成处决
  const isExecutable = voteCount >= requiredVotes;
  
  // 上一次票数，用于检测变化
  const prevVoteCountRef = useRef(voteCount);
  
  // 时针角度（0票=6点, 满票=12点）
  // 从 -90度（6点位置）到 90度（12点位置）
  const needleAngle = -90 + (votePercentage * 180);
  
  // 监听票数变化播放音效
  useEffect(() => {
    if (voteCount > prevVoteCountRef.current) {
      // 新增投票
      playClockTick();
      
      // 达到处决票数时播放警报
      if (voteCount === requiredVotes) {
        setTimeout(() => playSound('clock_alarm'), 300);
      }
    }
    prevVoteCountRef.current = voteCount;
  }, [voteCount, requiredVotes, playClockTick, playSound]);
  
  // 危险状态下的滴答声
  const tickIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (isDanger && voting?.isOpen && !isExecutable) {
      // 急促滴答声
      tickIntervalRef.current = setInterval(() => {
        playClockTick();
      }, 800);
    }
    
    return () => {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
      }
    };
  }, [isDanger, voting?.isOpen, isExecutable, playClockTick]);
  
  // 被提名者信息
  const nominee = (voting?.nomineeSeatId !== null && voting?.nomineeSeatId !== undefined) 
    ? seats[voting.nomineeSeatId] 
    : null;
  
  if (!voting?.isOpen) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={`relative ${className}`}
    >
      {/* 钟面容器 - Placeholder for Image Asset */}
      <div className={`
        relative w-64 h-64 mx-auto
        rounded-full
        bg-stone-900
        border-4 border-amber-900/50
        shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(0,0,0,0.8)]
        ${isDanger ? 'animate-pulse' : ''}
      `}>
        {/* 危险状态红光 */}
        <AnimatePresence>
          {isDanger && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-red-900/30 pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        {/* 钟面刻度 (CSS Placeholder) */}
        <div className="absolute inset-0 rounded-full border-[10px] border-stone-800 box-border"></div>
        <div className="absolute inset-2 rounded-full border-[2px] border-amber-700/30 box-border"></div>
        
        {/* Roman Numerals */}
        {Array.from({ length: 12 }).map((_, i) => {
            const angle = i * 30;
            const roman = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'][i];
            return (
                <div 
                    key={i}
                    className="absolute w-8 h-8 text-center"
                    style={{
                        top: '50%',
                        left: '50%',
                        transform: `translate(-50%, -50%) rotate(${String(angle)}deg) translate(0, -90px) rotate(-${String(angle)}deg)`,
                    }}
                >
                    <span className="text-amber-700/80 font-serif font-bold text-sm tracking-widest" style={{ textShadow: '0 1px 2px black' }}>
                        {roman}
                    </span>
                </div>
            );
        })}

        {/* Center Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-amber-900/20"></div>

        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
          {/* 12点位置的处决标记 */}
          <g transform="translate(100, 45)">
            <text
              textAnchor="middle"
              fill="#dc2626"
              fontSize="14"
              fontFamily="Cinzel"
              fontWeight="bold"
            >
              ☠
            </text>
            <text
              y="15"
              textAnchor="middle"
              fill="#ef4444"
              fontSize="10"
              fontFamily="Cinzel"
            >
              {requiredVotes}
            </text>
          </g>
          
          {/* 当前票数显示 */}
          <text
            x="100"
            y="130"
            textAnchor="middle"
            fill={isDanger ? '#ef4444' : '#c0a060'}
            fontSize="36"
            fontFamily="Cinzel"
            fontWeight="bold"
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.8))' }}
          >
            {voteCount}
          </text>
          <text
            x="100"
            y="145"
            textAnchor="middle"
            fill="#78350f"
            fontSize="10"
            fontFamily="Cinzel"
          >
            / {requiredVotes}
          </text>
        </svg>
        
        {/* 时针 (Placeholder Style) */}
        <motion.div
          className="absolute left-1/2 bottom-1/2 origin-bottom"
          style={{ 
            width: 8, 
            height: 70,
            marginLeft: -4,
          }}
          animate={{ rotate: needleAngle }}
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 20,
            mass: 2
          }}
        >
          {/* 时针本体 */}
          <div className={`
            w-full h-full
            bg-gradient-to-t from-stone-800 via-stone-600 to-stone-400
            border border-stone-900
            shadow-[0_0_5px_rgba(0,0,0,0.8)]
            relative
          `}>
             <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 
                          border-l-[8px] border-r-[8px] border-b-[16px] 
                          border-l-transparent border-r-transparent border-b-stone-400" />
          </div>
        </motion.div>
        
        {/* 中心装饰 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-4 h-4 rounded-full 
                        bg-stone-900
                        border-2 border-stone-500
                        shadow-[0_0_5px_black]" />
      </div>
      
      {/* 被提名者信息 */}
      {nominee && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <p className="text-amber-400/60 text-xs font-cinzel uppercase tracking-widest">
            {t('game.doomsdayClock.nominee')}
          </p>
          <p className={`
            text-lg font-cinzel font-bold mt-1
            ${isExecutable ? 'text-red-400' : 'text-amber-200'}
          `}>
            {nominee.userName}
          </p>
          {isExecutable && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="text-red-500 text-sm font-bold mt-2"
            >
              {t('game.doomsdayClock.executable')}
            </motion.p>
          )}
        </motion.div>
      )}
      
      {/* 投票者列表 */}
      {voting.votes.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex flex-wrap justify-center gap-2"
        >
          {voting.votes.map(seatId => {
            const voter = seats[seatId];
            return (
              <motion.span
                key={seatId}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-1 rounded bg-amber-900/30 border border-amber-700/30 
                           text-xs text-amber-300"
              >
                {voter?.userName ?? `${t('seat.empty')} ${String(seatId + 1)}`}
              </motion.span>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DoomsdayClock;
