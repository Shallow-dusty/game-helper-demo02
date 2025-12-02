import React, { useRef, useMemo } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WhisperingFog - 私聊可视化效果
 * 
 * 当两个玩家之间进行私聊时，在他们之间显示神秘的雾气连线效果
 * 只有 ST 可以看到所有连线，玩家只能看到自己参与的连线
 */

interface WhisperConnection {
  id: string;
  fromSeatId: number;
  toSeatId: number;
  timestamp: number;
  // 位置由 Token 计算
}

interface WhisperingFogProps {
  tokenPositions: Map<number, { x: number; y: number }>;
  containerRect?: DOMRect;
}

export const WhisperingFog: React.FC<WhisperingFogProps> = ({
  tokenPositions,
  containerRect
}) => {
  const messages = useStore(state => state.gameState?.messages || []);
  const seats = useStore(state => state.gameState?.seats || []);
  const user = useStore(state => state.user);
  const isStoryteller = user?.isStoryteller || false;

  const svgRef = useRef<SVGSVGElement>(null);
  
  // 计算最近的私聊连接（最近 30 秒内）
  const activeConnections = useMemo(() => {
    const now = Date.now();
    const recentThreshold = 30000; // 30 秒内的私聊
    
    const connections: WhisperConnection[] = [];
    
    messages
      .filter(msg => {
        if (msg.type !== 'chat' || !msg.recipientId) return false;
        const msgTime = new Date(msg.timestamp).getTime();
        return now - msgTime < recentThreshold;
      })
      .forEach(msg => {
        const senderSeat = seats.find(s => s.userId === msg.senderId);
        const recipientSeat = seats.find(s => s.userId === msg.recipientId);
        
        if (!senderSeat || !recipientSeat) return;
        
        // 可见性检查：ST 看所有，玩家只看自己参与的
        if (!isStoryteller) {
          if (msg.senderId !== user?.id && msg.recipientId !== user?.id) {
            return;
          }
        }
        
        // 避免重复连线（同一对玩家）
        const connectionId = [senderSeat.id, recipientSeat.id].sort().join('-');
        const existing = connections.find(c => c.id === connectionId);
        
        if (!existing) {
          connections.push({
            id: connectionId,
            fromSeatId: senderSeat.id,
            toSeatId: recipientSeat.id,
            timestamp: new Date(msg.timestamp).getTime()
          });
        } else {
          // 更新时间戳为最新
          existing.timestamp = Math.max(existing.timestamp, new Date(msg.timestamp).getTime());
        }
      });
    
    return connections;
  }, [messages, seats, user, isStoryteller]);

  if (activeConnections.length === 0 || !containerRect) {
    return null;
  }

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none z-20"
      style={{
        width: containerRect.width,
        height: containerRect.height
      }}
    >
      {/* 定义雾气渐变和滤镜 */}
      <defs>
        <linearGradient id="whisperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(147, 51, 234, 0.6)" />
          <stop offset="50%" stopColor="rgba(192, 132, 252, 0.8)" />
          <stop offset="100%" stopColor="rgba(147, 51, 234, 0.6)" />
        </linearGradient>
        
        {/* 雾气模糊效果 */}
        <filter id="whisperBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 1.5 0"
          />
        </filter>
        
        {/* 发光效果 */}
        <filter id="whisperGlow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* 波纹动画渐变 */}
        <linearGradient id="whisperWave" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(192, 132, 252, 0)">
            <animate
              attributeName="offset"
              values="0;1"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="30%" stopColor="rgba(192, 132, 252, 0.7)">
            <animate
              attributeName="offset"
              values="0.3;1.3"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="rgba(147, 51, 234, 0.9)">
            <animate
              attributeName="offset"
              values="0.5;1.5"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="70%" stopColor="rgba(192, 132, 252, 0.7)">
            <animate
              attributeName="offset"
              values="0.7;1.7"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="rgba(192, 132, 252, 0)">
            <animate
              attributeName="offset"
              values="1;2"
              dur="2s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
      </defs>
      
      <AnimatePresence>
        {activeConnections.map(connection => {
          const fromPos = tokenPositions.get(connection.fromSeatId);
          const toPos = tokenPositions.get(connection.toSeatId);
          
          if (!fromPos || !toPos) return null;
          
          // 计算贝塞尔曲线控制点（弯曲的雾气路径）
          const midX = (fromPos.x + toPos.x) / 2;
          const midY = (fromPos.y + toPos.y) / 2;
          const dx = toPos.x - fromPos.x;
          const dy = toPos.y - fromPos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 控制点偏移（使曲线更弯曲）
          const offsetAmount = distance * 0.2;
          const controlX = midX - (dy / distance) * offsetAmount;
          const controlY = midY + (dx / distance) * offsetAmount;
          
          const pathD = `M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`;
          
          // 计算新鲜度（越新越亮）
          const age = Date.now() - connection.timestamp;
          const freshness = Math.max(0, 1 - age / 30000);
          
          return (
            <motion.g
              key={connection.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: freshness * 0.8 + 0.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* 底层发光 */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#whisperGradient)"
                strokeWidth={8 + freshness * 4}
                strokeLinecap="round"
                filter="url(#whisperGlow)"
                opacity={0.3 + freshness * 0.3}
              />
              
              {/* 中层雾气 */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#whisperGradient)"
                strokeWidth={4 + freshness * 2}
                strokeLinecap="round"
                filter="url(#whisperBlur)"
                opacity={0.5 + freshness * 0.3}
              />
              
              {/* 顶层波纹（动画） */}
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#whisperWave)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeDasharray="10 20"
                opacity={0.7 + freshness * 0.3}
              >
                <animate
                  attributeName="stroke-dashoffset"
                  from="0"
                  to="-30"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </motion.path>
              
              {/* 端点发光圈 */}
              <circle
                cx={fromPos.x}
                cy={fromPos.y}
                r={6}
                fill="rgba(192, 132, 252, 0.4)"
                filter="url(#whisperBlur)"
              >
                <animate
                  attributeName="r"
                  values="4;8;4"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle
                cx={toPos.x}
                cy={toPos.y}
                r={6}
                fill="rgba(192, 132, 252, 0.4)"
                filter="url(#whisperBlur)"
              >
                <animate
                  attributeName="r"
                  values="4;8;4"
                  dur="1.5s"
                  repeatCount="indefinite"
                />
              </circle>
            </motion.g>
          );
        })}
      </AnimatePresence>
    </svg>
  );
};
