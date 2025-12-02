import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { useSoundEffect } from '../../hooks/useSoundEffect';

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
  const gameState = useStore(state => state.gameState);
  const voting = gameState?.voting;
  const seats = gameState?.seats || [];
  
  const { playSound, playClockTick, preloadSounds } = useSoundEffect();
  
  // 预加载音效
  useEffect(() => {
    preloadSounds(['clock_tick', 'clock_tock', 'clock_chime', 'clock_alarm', 'gavel']);
  }, [preloadSounds]);
  
  // 当前票数
  const voteCount = voting?.votes.length || 0;
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
      {/* 钟面容器 */}
      <div className={`
        relative w-64 h-64 mx-auto
        rounded-full
        bg-gradient-to-b from-stone-900 to-stone-950
        border-4 border-amber-900/50
        shadow-[0_0_30px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(0,0,0,0.5)]
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
        
        {/* 钟面刻度 */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 200 200">
          {/* 外圈装饰 */}
          <circle cx="100" cy="100" r="95" fill="none" stroke="#78350f" strokeWidth="2" opacity="0.5" />
          <circle cx="100" cy="100" r="85" fill="none" stroke="#92400e" strokeWidth="1" opacity="0.3" />
          
          {/* 刻度线 */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 - 90) * (Math.PI / 180);
            const x1 = 100 + 75 * Math.cos(angle);
            const y1 = 100 + 75 * Math.sin(angle);
            const x2 = 100 + 85 * Math.cos(angle);
            const y2 = 100 + 85 * Math.sin(angle);
            const isMainTick = i % 3 === 0;
            
            return (
              <line
                key={i}
                x1={x1} y1={y1}
                x2={x2} y2={y2}
                stroke={isMainTick ? '#c0a060' : '#78350f'}
                strokeWidth={isMainTick ? 3 : 1}
                strokeLinecap="round"
              />
            );
          })}
          
          {/* 12点位置的处决标记 */}
          <g transform="translate(100, 25)">
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
              fontSize="8"
              fontFamily="Cinzel"
            >
              {requiredVotes}
            </text>
          </g>
          
          {/* 6点位置起始标记 */}
          <text
            x="100"
            y="185"
            textAnchor="middle"
            fill="#78350f"
            fontSize="10"
            fontFamily="Cinzel"
          >
            0
          </text>
          
          {/* 当前票数显示 */}
          <text
            x="100"
            y="130"
            textAnchor="middle"
            fill={isDanger ? '#ef4444' : '#c0a060'}
            fontSize="36"
            fontFamily="Cinzel"
            fontWeight="bold"
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
        
        {/* 时针 */}
        <motion.div
          className="absolute left-1/2 bottom-1/2 origin-bottom"
          style={{ 
            width: 6, 
            height: 70,
            marginLeft: -3,
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
            w-full h-full rounded-t-full
            bg-gradient-to-t from-amber-700 via-amber-500 to-amber-300
            shadow-[0_0_10px_rgba(245,158,11,0.5)]
            ${isExecutable ? 'bg-gradient-to-t from-red-700 via-red-500 to-red-300' : ''}
          `} />
          
          {/* 时针装饰尖头 */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 
                          border-l-[6px] border-r-[6px] border-b-[12px] 
                          border-l-transparent border-r-transparent border-b-amber-300" />
        </motion.div>
        
        {/* 中心装饰 */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 
                        w-6 h-6 rounded-full 
                        bg-gradient-to-br from-amber-400 to-amber-700
                        border-2 border-amber-300
                        shadow-[0_0_15px_rgba(245,158,11,0.6)]" />
      </div>
      
      {/* 被提名者信息 */}
      {nominee && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <p className="text-amber-400/60 text-xs font-cinzel uppercase tracking-widest">
            被提名者
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
              ⚠️ 可处决
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
                {voter?.userName || `座位${seatId + 1}`}
              </motion.span>
            );
          })}
        </motion.div>
      )}
    </motion.div>
  );
};

export default DoomsdayClock;
