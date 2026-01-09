import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Circle, Text, Group, Rect, Ring, Arc, RegularPolygon } from 'react-konva';
import { useStore } from '../../store';
import { ROLES, TEAM_COLORS, PHASE_LABELS, SCRIPTS, JINX_DEFINITIONS, STATUS_ICONS } from '../../constants';
import { Seat } from '../../types';
import Konva from 'konva';
import { showWarning } from '../ui/Toast';
import { StorytellerMenu } from './StorytellerMenu';
import { ChainReactionModal } from './ChainReactionModal';
import { detectChainReactions, type ChainReactionEvent } from '../../lib/chainReaction';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Lock, Unlock } from 'lucide-react';
import { useLongPress } from '../../hooks/useLongPress';
import { CandlelightOverlay } from './CandlelightOverlay';

interface GrimoireProps {
  width: number;
  height: number;
  readOnly?: boolean;
  publicOnly?: boolean;
  gameState?: import('../../types').GameState;
  isStorytellerView?: boolean;
}

// 计算两个触摸点之间的距离
const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

// 计算两个触摸点的中心点
const getCenter = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
};

interface SeatNodeProps {
  seat: Seat;
  cx: number;
  cy: number;
  radius: number;
  angle: number;
  isST: boolean;
  isCurrentUser: boolean;
  scale: number;
  onClick: (e: any) => void;
  onLongPress: (e: any) => void;
  onContextMenu: (e: any) => void;
  disableInteractions?: boolean;
  isSwapSource?: boolean;
  publicOnly?: boolean;
  setupPhase?: string; // New prop to check phase
  rolesRevealed?: boolean; // 从父组件传入，避免子组件订阅整个store
  votingClockHandSeatId?: number | null; // 从父组件传入
}



const SeatNode: React.FC<SeatNodeProps> = React.memo(({ seat, cx, cy, radius, angle, isST, isCurrentUser, scale, onClick, onLongPress, onContextMenu, disableInteractions = false, isSwapSource = false, publicOnly = false, setupPhase, rolesRevealed = false, votingClockHandSeatId }) => {
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  const [isHovered, setIsHovered] = React.useState(false);

  const { isPressing, ...longPressHandlers } = useLongPress(onLongPress, onClick, { delay: 500, disabled: disableInteractions, detectMouse: false });

  // Animation Ref for the progress ring
  const progressRingRef = useRef<Konva.Arc>(null);

  useEffect(() => {
    const node = progressRingRef.current;
    if (isPressing && node) {
      node.angle(0);
      node.opacity(1);
      const tween = new Konva.Tween({
        node: node,
        duration: 0.5,
        angle: 360,
        easing: (t, b, c, d) => Konva.Easings.Linear(t, b, c, d),
      });
      tween.play();
      return () => { tween.destroy(); };
    }
    return undefined;
  }, [isPressing]);

  // Visibility Logic: (现在使用 props 而不是 store)
  // 1. Storyteller: Always see real role (if exists), otherwise seen role
  // 2. Current User: Only see if roles are revealed AND it's their seat
  const displayRoleId = isST 
    ? (seat.realRoleId || seat.seenRoleId) 
    : (isCurrentUser && rolesRevealed ? seat.seenRoleId : null);

  const showRole = !publicOnly && displayRoleId;
  const roleDef = showRole && displayRoleId ? ROLES[displayRoleId] : null;
  
  // Misled logic (ST only)
  const isMisled = isST && seat.realRoleId && seat.seenRoleId && seat.realRoleId !== seat.seenRoleId;
  const seenRoleDef = isMisled ? ROLES[seat.seenRoleId!] : null;
  const isClockHand = votingClockHandSeatId === seat.id;

  const tokenRadius = 35 * scale;
  const fontSizeName = Math.max(10, 14 * scale); // Prevent too small
  const fontSizeRole = Math.max(14, 20 * scale);
  const iconSize = Math.max(12, 16 * scale);
  const statusIconSize = Math.max(12, 14 * scale);

  // Animation Ref for the group (breathing/trembling)
  const groupRef = useRef<Konva.Group>(null);
  const breathTweenRef = useRef<Konva.Tween | null>(null);

  // Breathing Animation with Page Visibility support
  useEffect(() => {
    if (seat.isDead || isSwapSource) return;
    const node = groupRef.current;
    if (!node) return;

    // Random start time to avoid sync
    const delay = Math.random() * 2;
    
    // 创建呼吸动画 (0.98 -> 1.02 -> 0.98)
    const createBreathTween = () => {
      // 先设置初始缩放为0.98
      node.scaleX(0.98);
      node.scaleY(0.98);
      
      const tween = new Konva.Tween({
        node: node,
        duration: 2 + Math.random(),
        scaleX: 1.02,
        scaleY: 1.02,
        yoyo: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method
        easing: Konva.Easings.EaseInOut,
      });
      return tween;
    };
    
    breathTweenRef.current = createBreathTween();
    const timer = setTimeout(() => breathTweenRef.current?.play(), delay * 1000);
    
    // Page Visibility 暂停/恢复动画
    const handleVisibilityChange = () => {
      if (document.hidden) {
        breathTweenRef.current?.pause();
      } else {
        breathTweenRef.current?.play();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => { 
      breathTweenRef.current?.destroy(); 
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [seat.isDead, isSwapSource]);

  // Trembling Animation (Nomination)
  useEffect(() => {
    if (!seat.isNominated) return;
    const node = groupRef.current;
    if (!node) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const amp = 2 * scale;
      node.offsetX(Math.sin(frame.time * 0.1) * amp);
      node.offsetY(Math.cos(frame.time * 0.1) * amp);
    }, node.getLayer());

    anim.start();
    return () => { 
        anim.stop(); 
        node.offsetX(0); 
        node.offsetY(0); 
    };
  }, [seat.isNominated, scale]);

  // Death FX - 死亡粒子特效
  const prevIsDeadRef = useRef(seat.isDead);
  useEffect(() => {
    // 只在从存活变为死亡时触发粒子效果
    if (seat.isDead && !prevIsDeadRef.current) {
      const layer = groupRef.current?.getLayer();
      if (!layer) return;

      // Create particles
      for (let i = 0; i < 20; i++) {
        const particle = new Konva.Circle({
          x: x,
          y: y,
          radius: Math.random() * 3 + 1,
          fill: '#ef4444',
          opacity: 1,
        });
        layer.add(particle);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 50 + 20;

        new Konva.Tween({
          node: particle,
          duration: 1,
          x: x + Math.cos(angle) * speed,
          y: y + Math.sin(angle) * speed,
          opacity: 0,
          onFinish: () => particle.destroy(),
        }).play();
      }
    }
    prevIsDeadRef.current = seat.isDead;
  }, [seat.isDead, x, y]);

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      {...longPressHandlers} // Only Touch Events
      onClick={onClick} // Direct Click for Desktop
      onContextMenu={onContextMenu} // Right Click for Desktop
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Long Press Progress Ring */}
      {isPressing && (
        <Arc
          ref={progressRingRef}
          innerRadius={tokenRadius + 8}
          outerRadius={tokenRadius + 12}
          angle={0}
          fill="#f59e0b"
          opacity={0.8}
          listening={false}
        />
      )}

      {/* Clock Hand Indicator */}
      {isClockHand && (
        <Ring innerRadius={tokenRadius + 3} outerRadius={tokenRadius + 9} fill="#fbbf24" listening={false} />
      )}

      {/* Swap Source Indicator */}
      {isSwapSource && (
        <Ring
          innerRadius={tokenRadius + 5}
          outerRadius={tokenRadius + 8}
          stroke="#06b6d4"
          strokeWidth={2}
          dash={[10, 5]}
          listening={false}
        />
      )}

      {/* Seat Token (Gothic Stone Style) */}
      <RegularPolygon
        sides={6}
        radius={tokenRadius}
        fillRadialGradientStartPoint={{ x: -tokenRadius / 3, y: -tokenRadius / 3 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={tokenRadius}
        fillRadialGradientColorStops={[
          0, seat.isDead ? '#44403c' : (isCurrentUser ? '#fbbf24' : '#57534e'), // Highlight
          0.6, seat.isDead ? '#1c1917' : (TEAM_COLORS[roleDef?.team || 'TOWNSFOLK'] || '#292524'), // Midtone
          1, '#0c0a09' // Shadow
        ]}
        stroke={isCurrentUser ? '#f59e0b' : '#78350f'}
        strokeWidth={isCurrentUser ? 3 : 2}
        shadowBlur={isCurrentUser ? 15 : 10}
        shadowColor={isCurrentUser ? '#f59e0b' : '#000'}
        shadowOpacity={0.8}
        opacity={seat.isDead ? 0.9 : 1}
        dash={seat.isVirtual ? [5, 5] : undefined}
        rotation={30}
      />

      {/* Inner Border for Detail */}
      <RegularPolygon
        sides={6}
        radius={tokenRadius - 5}
        stroke="#a8a29e"
        strokeWidth={1}
        opacity={0.3}
        listening={false}
        rotation={30}
      />

      {/* Roman Numeral Seat ID */}
      <Text
        text={(() => {
            const num = seat.id + 1;
            const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
            let result = '';
            let n = num;
            for (const [val, roman] of map) {
                while (n >= val) {
                    result += roman;
                    n -= val;
                }
            }
            return result;
        })()}
        y={-tokenRadius - 15}
        fontSize={12 * scale}
        fill="#78350f"
        fontFamily="Cinzel"
        fontStyle="bold"
        align="center"
        width={tokenRadius * 2}
        offsetX={tokenRadius}
        listening={false}
        shadowColor="#000"
        shadowBlur={2}
      />

      {/* Dead Indicator (X) */}
      {
        seat.isDead && (
          <Group>
            <Rect x={-tokenRadius / 1.5} y={-3} width={tokenRadius * 1.3} height={6} fill="#dc2626" rotation={45} cornerRadius={2} />
            <Rect x={-tokenRadius / 1.5} y={-3} width={tokenRadius * 1.3} height={6} fill="#dc2626" rotation={-45} cornerRadius={2} />
          </Group>
        )
      }

      {/* Name */}
      {/* Name */}
      <Text
        y={tokenRadius + 12}
        text={seat.userName}
        fontSize={fontSizeName}
        fill="#e7e5e4"
        width={tokenRadius * 3}
        offsetX={tokenRadius * 1.5}
        align="center"
        fontStyle="bold"
        fontFamily="Cinzel"
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={1}
        ellipsis={true}
        wrap="none"
      />

      {/* Role Info */}
      {
        roleDef && (
          <Group>
            <Text
              y={-fontSizeRole / 3}
              text={roleDef.name.substring(0, 2)}
              fontSize={fontSizeRole}
              fontStyle="bold"
              fontFamily="Cinzel"
              fill={seat.hasUsedAbility ? '#777' : '#fff'}
              width={tokenRadius * 2}
              offsetX={tokenRadius}
              align="center"
              listening={false}
            />
            {seat.hasUsedAbility && (
              <Text
                x={tokenRadius * 0.3}
                y={-tokenRadius * 0.7}
                text="🚫"
                fontSize={statusIconSize}
                listening={false}
              />
            )}
            {roleDef.icon && (
              <Text
                x={-tokenRadius * 0.7}
                y={-tokenRadius * 0.7}
                text={roleDef.icon}
                fontSize={iconSize}
                listening={false}
              />
            )}
            {isMisled && seenRoleDef && (
              <Group x={tokenRadius * 0.5} y={-tokenRadius * 0.8}>
                <Circle radius={9 * scale} fill="#000" stroke="red" strokeWidth={1} />
                <Text
                  text={seenRoleDef.name.substring(0, 1)}
                  fontSize={10 * scale}
                  fill="red"
                  x={-5 * scale}
                  y={-5 * scale}
                  fontStyle="bold"
                  listening={false}
                />
              </Group>
            )}
          </Group>
        )
      }

      {/* Status Icons - Outer Ring Layout */}
      {
        isST && seat.statuses.length > 0 && (
          <Group>
            {seat.statuses.map((status, idx) => {
              const total = seat.statuses.length;
              const step = Math.PI / 4; // 45 degrees
              const startAngle = -Math.PI / 2 - ((total - 1) * step) / 2;
              const angle = startAngle + idx * step;
              const iconRadius = tokenRadius + 15 * scale;
              
              return (
                <Group 
                  key={status}
                  x={iconRadius * Math.cos(angle)}
                  y={iconRadius * Math.sin(angle)}
                >
                  <Circle radius={8 * scale} fill="rgba(0,0,0,0.7)" />
                  <Text
                    text={STATUS_ICONS[status]}
                    fontSize={statusIconSize}
                    offsetX={statusIconSize / 2}
                    offsetY={statusIconSize / 2}
                  />
                </Group>
              );
            })}
          </Group>
        )
      }

      {/* Voting Hand */}
      {
        seat.isHandRaised && (
          <Group y={-tokenRadius - 10} x={tokenRadius / 2}>
            <Circle radius={10 * scale} fill="#fbbf24" shadowBlur={5} />
            <Text text="✋" x={-7 * scale} y={-7 * scale} fontSize={14 * scale} />
          </Group>
        )
      }

      {/* Ghost Vote Token */}
      {
        seat.isDead && (
          <Group x={tokenRadius * 0.7} y={tokenRadius * 0.7}>
            <Circle
              radius={8 * scale}
              fill={seat.hasGhostVote ? "#ffffff" : "#444444"}
              stroke={seat.hasGhostVote ? "#ffffff" : "#222"}
              strokeWidth={1}
              shadowBlur={seat.hasGhostVote ? 8 : 0}
              shadowColor="white"
            />
            {!seat.hasGhostVote && (
              <Text text="×" fontSize={10 * scale} x={-3 * scale} y={-5 * scale} fill="#888" />
            )}
          </Group>
        )
      }

      {/* Virtual Player Indicator */}
      {
        seat.isVirtual && (
          <Text
            x={-tokenRadius * 0.8}
            y={tokenRadius * 0.5}
            text="🤖"
            fontSize={16 * scale}
            listening={false}
          />
        )
      }

      {/* Ready Indicator (Only in Setup Phase) */}
      {
        seat.isReady && setupPhase !== 'STARTED' && (
          <Group x={tokenRadius * 0.7} y={-tokenRadius * 0.7}>
            <Circle radius={10 * scale} fill="#22c55e" stroke="#fff" strokeWidth={1} shadowBlur={5} shadowColor="#22c55e" />
            <Text text="✓" x={-5 * scale} y={-5 * scale} fontSize={12 * scale} fill="#fff" fontStyle="bold" />
          </Group>
        )
      }

      {/* Tooltip for Name (on hover) */}
      {
        isHovered && (
          <Group y={tokenRadius + 25}>
            <Rect
              x={-((seat.userName.length * fontSizeName) / 1.5)}
              width={(seat.userName.length * fontSizeName) / 0.7}
              height={fontSizeName + 10}
              fill="#000000"
              opacity={0.9}
              cornerRadius={4}
              shadowColor="black"
              shadowBlur={4}
            />
            <Text
              text={seat.userName}
              x={-((seat.userName.length * fontSizeName) / 1.5)}
              width={(seat.userName.length * fontSizeName) / 0.7}
              padding={5}
              align="center"
              fontSize={fontSizeName}
              fill="#ffffff"
              fontFamily="sans-serif"
            />
          </Group>
        )
      }

      {/* Reminders (ST Only) */}
      {
        isST && seat.reminders.length > 0 && (
          <Group y={-tokenRadius} x={-tokenRadius}>
            {seat.reminders.map((rem, i) => (
              <Group key={rem.id} y={i * -16 * scale}>
                {rem.icon ? (
                  <Text
                    text={rem.icon}
                    fontSize={14 * scale}
                    shadowColor="black"
                    shadowBlur={2}
                  />
                ) : (
                  <Rect width={10 * scale} height={10 * scale} fill="yellow" cornerRadius={2} stroke="black" strokeWidth={1} />
                )}
              </Group>
            ))}
          </Group>
        )
      }
    </Group >
  );
});

export const Grimoire: React.FC<GrimoireProps> = ({ width, height, readOnly = false, publicOnly = false, gameState: propsGameState, isStorytellerView = false }) => {
  const storeGameState = useStore(state => state.gameState);
  const storeUser = useStore(state => state.user);

  const gameState = propsGameState || storeGameState;

  const user = propsGameState ? {
    id: 'spectator',
    name: 'Spectator',
    isStoryteller: isStorytellerView,
    roomId: propsGameState.roomId,
    isObserver: true
  } : storeUser;

  const joinSeat = useStore(state => state.joinSeat);
  const toggleDead = useStore(state => state.toggleDead);
  const toggleAbilityUsed = useStore(state => state.toggleAbilityUsed);
  const toggleStatus = useStore(state => state.toggleStatus);
  const startVote = useStore(state => state.startVote);
  const assignRole = useStore(state => state.assignRole);
  const addReminder = useStore(state => state.addReminder);
  const removeReminder = useStore(state => state.removeReminder);
  const forceLeaveSeat = useStore(state => state.forceLeaveSeat);
  const removeVirtualPlayer = useStore(state => state.removeVirtualPlayer);
  const swapSeats = useStore(state => state.swapSeats);
  const requestSeatSwap = useStore(state => state.requestSeatSwap);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, seatId: number } | null>(null);
  const [roleSelectSeat, setRoleSelectSeat] = useState<number | null>(null);
  const [swapSourceId, setSwapSourceId] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  
  // 连锁结算状态
  const [chainEvents, setChainEvents] = useState<ChainReactionEvent[]>([]);
  const [_pendingDeathSeatId, setPendingDeathSeatId] = useState<number | null>(null);

  // Pinch-zoom state
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number>(0);
  const lastGestureTime = useRef<number>(0); // Timestamp of last drag/zoom end
  const isPinching = useRef(false);
  const draggingRef = useRef(false);
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const updateGestureState = useCallback(() => {
    setIsGestureActive(isPinching.current || draggingRef.current);
  }, []);

  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch = e.evt.touches;
    if (touch.length === 2 && touch[0] && touch[1]) {
      isPinching.current = true;
      updateGestureState();
      e.evt.preventDefault();
      const p1 = { x: touch[0].clientX, y: touch[0].clientY };
      const p2 = { x: touch[1].clientX, y: touch[1].clientY };
      lastCenter.current = getCenter(p1, p2);
      lastDist.current = getDistance(p1, p2);
    }
  }, [updateGestureState]);

  const handleTouchMove = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch = e.evt.touches;
    const stage = stageRef.current;
    if (touch.length === 2 && stage && lastCenter.current && touch[0] && touch[1]) {
      e.evt.preventDefault();
      const p1 = { x: touch[0].clientX, y: touch[0].clientY };
      const p2 = { x: touch[1].clientX, y: touch[1].clientY };
      const newCenter = getCenter(p1, p2);
      const newDist = getDistance(p1, p2);
      if (lastDist.current === 0) {
        lastDist.current = newDist;
        return;
      }
      const scaleBy = newDist / lastDist.current;
      const oldScale = stageScale;
      let newScale = oldScale * scaleBy;
      newScale = Math.max(0.5, Math.min(3, newScale));
      const mousePointTo = {
        x: (newCenter.x - stagePos.x) / oldScale,
        y: (newCenter.y - stagePos.y) / oldScale,
      };
      const newPos = {
        x: newCenter.x - mousePointTo.x * newScale + (newCenter.x - lastCenter.current.x),
        y: newCenter.y - mousePointTo.y * newScale + (newCenter.y - lastCenter.current.y),
      };
      setStageScale(newScale);
      setStagePos(newPos);
      lastDist.current = newDist;
      lastCenter.current = newCenter;
    }
  }, [stageScale, stagePos]);

  const handleTouchEnd = useCallback(() => {
    lastCenter.current = null;
    lastDist.current = 0;
    isPinching.current = false;
    lastGestureTime.current = Date.now(); // Record gesture end time
    updateGestureState();
  }, [updateGestureState]);

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const scaleBy = 1.1;
    const oldScale = stageScale;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    let newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.5, Math.min(3, newScale));
    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };
    setStageScale(newScale);
    setStagePos(newPos);
  }, [stageScale, stagePos]);



  // Handle long press (Mobile) OR Right Click (Desktop)
  const handleMenuTrigger = useCallback((seat: Seat) => {
    if (readOnly || isLocked || isGestureActive) return;
    if (!user?.isStoryteller) return;
    setContextMenu({ x: 0, y: 0, seatId: seat.id }); // Coordinates don't matter for modal
  }, [isLocked, isGestureActive, user?.isStoryteller, readOnly]);

  if (!gameState || !user) return null;

  if (!gameState.seats || !Array.isArray(gameState.seats) || gameState.seats.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-stone-400">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p>正在加载魔典...</p>
        </div>
      </div>
    );
  }

  const safeWidth = Math.max(width, 100);
  const safeHeight = Math.max(height, 100);
  const cx = safeWidth / 2;
  const cy = safeHeight / 2;
  const minDim = Math.min(safeWidth, safeHeight);
  const baseScale = Math.max(0.35, Math.min(1.2, minDim / 700));
  const seatCount = gameState.seats.length;
  const marginFactor = seatCount > 10 ? 80 : 60;
  const margin = marginFactor * baseScale;
  const r = Math.max((minDim / 2) - margin, minDim * 0.3);

  const handleSeatClick = (e: any, seat: Seat) => {
    if (readOnly || isLocked || isGestureActive) return;
    // Prevent accidental clicks after dragging/zooming
    if (Date.now() - lastGestureTime.current < 200) return;

    e.cancelBubble = true;

    if (seat.isVirtual && !user.isStoryteller) {
      showWarning('该座位预留给虚拟玩家。');
      return;
    }

    // Storyteller Logic
    if (user.isStoryteller) {
      if (swapSourceId !== null) {
        if (swapSourceId === seat.id) {
          setSwapSourceId(null);
          showWarning('交换已取消');
        } else {
          if (window.confirm(`确认交换座位 ${swapSourceId + 1} 和 ${seat.id + 1} 吗?`)) {
            swapSeats(swapSourceId, seat.id);
            setSwapSourceId(null);
          }
        }
        return;
      }
      if (seat.userId === null) {
        void joinSeat(seat.id);
      }
    } else {
      // Player Logic
      if (seat.userId === null) {
        if (joiningId !== null) return;
        setJoiningId(seat.id);
        void joinSeat(seat.id).finally(() => setJoiningId(null));
        return;
      }
      if (seat.userId !== user.id) {
        if (window.confirm(`请求与 ${seat.userName} 交换座位?`)) {
          requestSeatSwap(seat.id);
        }
        return;
      }
    }
  };

  const currentScriptRoles = SCRIPTS[gameState.currentScriptId]?.roles || [];
  
  // 连锁检测处理函数
  const handleToggleDeadWithChainCheck = useCallback((seatId: number) => {
    if (!gameState) return;
    
    const seat = gameState.seats[seatId];
    if (!seat) return;
    
    // 如果是复活操作，直接执行
    if (seat.isDead) {
      toggleDead(seatId);
      return;
    }
    
    // 检测连锁反应
    const events = detectChainReactions(gameState, 'death', seatId);
    
    if (events.length > 0) {
      // 有连锁事件，先执行死亡，然后显示确认
      toggleDead(seatId);
      setPendingDeathSeatId(seatId);
      setChainEvents(events);
    } else {
      // 没有连锁事件，直接执行
      toggleDead(seatId);
    }
  }, [gameState, toggleDead]);
  
  const handleChainEventConfirm = useCallback((event: ChainReactionEvent) => {
    // 根据事件类型执行相应操作
    if (event.suggestedAction === 'mark_dead') {
      event.affectedSeatIds.forEach(id => toggleDead(id));
    } else if (event.suggestedAction === 'end_game') {
      const data = event.data as { winner: 'GOOD' | 'EVIL'; reason: string } | undefined;
      if (data) {
        useStore.getState().endGame(data.winner, data.reason);
      }
    }
    
    // 移除已处理的事件
    setChainEvents(prev => prev.slice(1));
    
    // 如果没有更多事件，清理状态
    if (chainEvents.length <= 1) {
      setPendingDeathSeatId(null);
    }
  }, [chainEvents.length, toggleDead]);
  
  const handleChainEventSkip = useCallback((_event: ChainReactionEvent) => {
    // 跳过当前事件
    setChainEvents(prev => prev.slice(1));
    
    if (chainEvents.length <= 1) {
      setPendingDeathSeatId(null);
    }
  }, [chainEvents.length]);
  
  const handleChainModalClose = useCallback(() => {
    setChainEvents([]);
    setPendingDeathSeatId(null);
  }, []);

  const activeJinxes = React.useMemo(() => {
    if (!user.isStoryteller) return [];
    const activeRoleIds = new Set(gameState.seats.map(s => s.realRoleId || s.roleId).filter(Boolean));
    return JINX_DEFINITIONS.filter(jinx =>
      activeRoleIds.has(jinx.role1) && activeRoleIds.has(jinx.role2)
    );
  }, [gameState.seats, user.isStoryteller]);

  const rolesByTeam: Record<string, any[]> = { TOWNSFOLK: [], OUTSIDER: [], MINION: [], DEMON: [] };
  currentScriptRoles.forEach(roleId => {
    const role = ROLES[roleId];
    if (role?.team && role.team in rolesByTeam) {
      (rolesByTeam[role.team]!).push(role);
    }
  });

  const renderRoleSection = (team: string, title: string, roles: any[]) => (
    <div className="mb-6" key={team}>
      <h4 className="text-sm font-bold uppercase tracking-widest mb-3 border-b border-stone-700 pb-2 font-cinzel flex items-center gap-2" style={{ color: TEAM_COLORS[team as keyof typeof TEAM_COLORS] }}>
        <span>{team === 'DEMON' ? '👿' : team === 'MINION' ? '🧪' : team === 'OUTSIDER' ? '⚡' : '⚜️'}</span>
        {title}
        <span className="text-stone-600 text-xs ml-auto font-serif normal-case">({roles.length})</span>
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => { assignRole(roleSelectSeat!, role.id); setRoleSelectSeat(null); }}
            className="p-2 rounded border border-stone-800 bg-stone-950 hover:bg-stone-800 text-xs text-center transition-all flex flex-col items-center justify-center gap-2 h-24 md:h-28 group active:scale-95 relative overflow-hidden"
            style={{ borderColor: TEAM_COLORS[role.team as keyof typeof TEAM_COLORS] + '40' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-black/40 z-10" style={{ borderColor: TEAM_COLORS[role.team as keyof typeof TEAM_COLORS] }}>
              <span className="text-xl md:text-2xl">
                {role.team === 'DEMON' ? '👿' : role.team === 'MINION' ? '🧪' : role.team === 'OUTSIDER' ? '⚡' : '⚜️'}
              </span>
            </div>
            <span className="block font-bold text-stone-300 leading-tight scale-95 md:scale-100 z-10 px-1">{role.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="relative w-full h-full"
      style={{ touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => { setContextMenu(null); }}
    >
      {!readOnly && !publicOnly && (
        <div className="absolute top-4 right-4 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-auto">
            {/* Scroll Toggle for Edit Mode */}
            <div 
              className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95"
              onClick={() => setIsLocked(!isLocked)}
              title={isLocked ? "点击切换到编辑模式" : "点击切换到浏览模式"}
            >
              {/* Scroll Body */}
              <div className={`
                h-12 px-10 flex items-center justify-center
                bg-[#f4e4bc] border-y-4 border-[#8b4513]
                shadow-[0_5px_15px_rgba(0,0,0,0.5)]
                transition-all duration-300
                ${!isLocked ? 'brightness-110 sepia-[.3]' : 'brightness-75 grayscale-[0.5]'}
              `}>
                <span className="text-[#4a3728] font-cinzel font-bold text-sm tracking-widest whitespace-nowrap select-none">
                  {isLocked ? "浏览模式 (VIEW)" : "编辑模式 (EDIT)"}
                </span>
              </div>

              {/* Scroll Ends (Left) */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-16 bg-[#e6d2a0] rounded-full border-r-4 border-[#654321] shadow-[-2px_0_5px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-[radial-gradient(circle,transparent_60%,#654321_100%)]" />
                <div className="absolute w-4 h-4 bg-[#8b4513] rounded-full shadow-inner" />
              </div>

              {/* Scroll Ends (Right) */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-16 bg-[#e6d2a0] rounded-full border-l-4 border-[#654321] shadow-[2px_0_5px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-[radial-gradient(circle,transparent_60%,#654321_100%)]" />
                <div className="absolute w-4 h-4 bg-[#8b4513] rounded-full shadow-inner" />
              </div>

              {/* Status Indicator Icon */}
              <div className={`
                absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-md z-10
                transition-colors duration-300
                ${isLocked ? 'bg-stone-800 border-stone-600 text-stone-400' : 'bg-amber-600 border-amber-400 text-white'}
              `}>
                {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
              </div>
            </div>

          {stageScale !== 1 && (
            <div className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md border border-stone-800">
              {Math.round(stageScale * 100)}%
            </div>
          )}

          {user.isStoryteller && (
            <button
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-md transition-all
                ${isPrivacyMode ? 'bg-stone-800 border-stone-600 text-stone-400' : 'bg-stone-900 border-amber-900/50 text-amber-500'}
              `}
              title={isPrivacyMode ? "关闭防窥模式" : "开启防窥模式"}
            >
              <span className="text-xl">🕯️</span>
            </button>
          )}
        </div>
      )}

      {activeJinxes.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 pointer-events-none w-full max-w-lg px-4">
          {activeJinxes.map(jinx => (
            <div key={jinx.id} className="bg-amber-900/80 backdrop-blur-sm border border-amber-600/50 text-amber-100 px-4 py-2 rounded shadow-lg text-xs md:text-sm text-center animate-in slide-in-from-top-4 fade-in duration-500">
              {jinx.description}
            </div>
          ))}
        </div>
      )}

      <Stage
        ref={stageRef}
        width={safeWidth}
        height={safeHeight}
        listening={!isLocked}
        scaleX={stageScale}
        scaleY={stageScale}
        x={stagePos.x}
        y={stagePos.y}
        draggable={!isLocked && stageScale > 1}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseMove={(e) => {
          const stage = e.target.getStage();
          if (stage) {
            const pointer = stage.getPointerPosition();
            if (pointer) {
              setCursorPos({ 
                x: (pointer.x - stagePos.x) / stageScale, 
                y: (pointer.y - stagePos.y) / stageScale 
              });
            }
          }
        }}
        onDragStart={() => { draggingRef.current = true; updateGestureState(); }}
        onDragEnd={(e) => {
          setStagePos({ x: e.target.x(), y: e.target.y() });
          draggingRef.current = false;
          lastGestureTime.current = Date.now(); // Record drag end time
          updateGestureState();
        }}
      >
        <Layer listening={false}>
          {/* Clock Face Background */}
          <Circle
            x={cx}
            y={cy}
            radius={r * 0.8}
            fillRadialGradientStartPoint={{ x: 0, y: 0 }}
            fillRadialGradientStartRadius={0}
            fillRadialGradientEndPoint={{ x: 0, y: 0 }}
            fillRadialGradientEndRadius={r * 0.8}
            fillRadialGradientColorStops={[0, 'rgba(66, 0, 0, 0.2)', 0.8, 'rgba(30, 0, 0, 0.6)', 1, 'rgba(0, 0, 0, 0)']}
            opacity={0.8}
          />
          
          {/* Decorative Clock Ticks */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i / 12) * 360;
            const isMain = i % 3 === 0;
            return (
              <Group key={i} x={cx} y={cy} rotation={angle}>
                <Rect
                  x={r * 0.65}
                  y={isMain ? -3 * baseScale : -1 * baseScale}
                  width={isMain ? 20 * baseScale : 10 * baseScale}
                  height={isMain ? 6 * baseScale : 2 * baseScale}
                  fill={isMain ? '#7f1d1d' : '#57534e'}
                  cornerRadius={2}
                />
              </Group>
            );
          })}

          <Circle
            x={cx}
            y={cy}
            radius={r + (40 * baseScale)}
            stroke="#ffffff"
            strokeWidth={1}
            dash={[10, 20]}
            opacity={0.1}
          />
          
          {/* Phase Text */}
          <Text
            x={cx - 100}
            y={cy - 50 * baseScale} // Moved up slightly
            width={200}
            align="center"
            text={PHASE_LABELS[gameState.phase] || gameState.phase}
            fontSize={24 * baseScale}
            fill="#a8a29e"
            fontFamily="Cinzel"
            fontStyle="italic"
            letterSpacing={2}
            shadowColor="black"
            shadowBlur={5}
          />
        </Layer>

        <Layer>
          {/* Clock Hand (Voting Indicator) */}
          {(() => {
             const votingState = gameState.voting;
             const targetSeatId = votingState?.clockHandSeatId;
             
             if (targetSeatId !== undefined && targetSeatId !== null) {
               const seatIndex = gameState.seats.findIndex(s => s.id === targetSeatId);
               if (seatIndex !== -1) {
                 // Calculate angle: (index / total) * 360 - 90 (to match -PI/2 start)
                 const angle = (seatIndex / gameState.seats.length) * 360; 
                 // Note: SeatNode uses -PI/2 offset (top start). 
                 // Konva rotation 0 is right (3 o'clock). 
                 // SeatNode angle 0 (index 0) is -90 degrees (12 o'clock).
                 // So we need to rotate by angle - 90.
                 const rotation = angle - 90;

                 return (
                   <Group x={cx} y={cy} rotation={rotation}>
                     {/* Hand Shaft */}
                     <Rect
                       x={0}
                       y={-4 * baseScale}
                       width={r - 40 * baseScale} // Reach towards seat
                       height={8 * baseScale}
                       fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                       fillLinearGradientEndPoint={{ x: r, y: 0 }}
                       fillLinearGradientColorStops={[0, '#450a0a', 0.5, '#b91c1c', 1, '#ef4444']}
                       shadowColor="#000"
                       shadowBlur={10}
                       cornerRadius={4}
                     />
                     {/* Hand Tip */}
                     <RegularPolygon
                       x={r - 40 * baseScale}
                       y={0}
                       sides={3}
                       radius={15 * baseScale}
                       rotation={90}
                       fill="#f59e0b"
                       shadowColor="#f59e0b"
                       shadowBlur={10}
                     />
                     {/* Center Cap */}
                     <Circle
                       radius={12 * baseScale}
                       fill="#7f1d1d"
                       stroke="#f59e0b"
                       strokeWidth={2}
                       shadowBlur={5}
                     />
                     <Circle
                       radius={4 * baseScale}
                       fill="#f59e0b"
                     />
                   </Group>
                 );
               }
             }
             return null;
          })()}
          {gameState.seats.map((seat, i) => {
            const angle = (i / gameState.seats.length) * 2 * Math.PI - Math.PI / 2;
            return (
              <SeatNode
                key={seat.id}
                seat={seat}
                cx={cx}
                cy={cy}
                radius={r}
                angle={angle}
                isST={user.isStoryteller}
                isCurrentUser={seat.userId === user.id}
                scale={baseScale}
                onClick={(e: any) => handleSeatClick(e, seat)}
                onLongPress={() => handleMenuTrigger(seat)} // Mobile Long Press
                onContextMenu={(e: any) => { e.evt.preventDefault(); handleMenuTrigger(seat); }} // Desktop Right Click
                disableInteractions={readOnly || isLocked || isGestureActive}
                isSwapSource={swapSourceId === seat.id}
                publicOnly={publicOnly}
                setupPhase={gameState.setupPhase}
              />
            );
          })}
        </Layer>
        {/* Candlelight Layer (Night Mode) */}
        {(gameState.phase === 'NIGHT' || (user.isStoryteller && isPrivacyMode)) && (
           <Layer>
             <Group>
               {/* Dark Overlay */}
               <Rect
                 x={-1000}
                 y={-1000}
                 width={safeWidth + 2000}
                 height={safeHeight + 2000}
                 fill="#000000"
                 opacity={0.95}
                 listening={false}
               />
               
               {/* Spotlight (Eraser) */}
               <Circle
                 x={cursorPos.x}
                 y={cursorPos.y}
                 radius={150 / stageScale}
                 fill="white"
                 globalCompositeOperation="destination-out"
                 shadowBlur={50}
                 shadowColor="white"
                 listening={false}
               />
               
               {/* Candle Flame Effect (Optional Visual) */}
               <Circle
                 x={cursorPos.x}
                 y={cursorPos.y}
                 radius={150 / stageScale}
                 fillRadialGradientStartPoint={{ x: 0, y: 0 }}
                 fillRadialGradientStartRadius={0}
                 fillRadialGradientEndPoint={{ x: 0, y: 0 }}
                 fillRadialGradientEndRadius={150 / stageScale}
                 fillRadialGradientColorStops={[0, 'rgba(255, 160, 0, 0.1)', 1, 'rgba(0,0,0,0)']}
                 globalCompositeOperation="source-over"
                 listening={false}
               />
             </Group>
           </Layer>
        )}
      </Stage>

      {/* v2.0 烛光守夜模式遮罩 - 仅在夜晚且启用时显示，说书人端不显示 (作为反馈模式，仅主动开启时生效) */}
      {gameState.candlelightEnabled && gameState.phase === 'NIGHT' && !readOnly && !user.isStoryteller && (
        <CandlelightOverlay 
          width={width} 
          height={height} 
          isActive={true}
          deadSeatPositions={gameState.seats
            .filter(s => s.isDead)
            .map((seat) => {
              // 需要找到原始索引来计算角度
              const originalIndex = gameState.seats.findIndex(s => s.id === seat.id);
              const angle = (originalIndex / gameState.seats.length) * 2 * Math.PI - Math.PI / 2;
              return {
                id: seat.id,
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle)
              };
            })
          }
        />
      )}

      {/* Storyteller Menu Modal */}
      {contextMenu && user.isStoryteller && (
        <StorytellerMenu
          seat={gameState.seats.find(s => s.id === contextMenu.seatId)!}
          onClose={() => setContextMenu(null)}
          currentScriptId={gameState.currentScriptId}
          actions={{
            toggleDead: handleToggleDeadWithChainCheck,
            toggleAbilityUsed,
            toggleStatus,
            addReminder,
            removeReminder,
            removeVirtualPlayer,
            startVote,
            setRoleSelectSeat,
            setSwapSourceId,
            forceLeaveSeat
          }}
        />
      )}
      
      {/* 连锁结算确认模态框 */}
      <ChainReactionModal
        isOpen={chainEvents.length > 0}
        events={chainEvents}
        onConfirm={handleChainEventConfirm}
        onSkip={handleChainEventSkip}
        onClose={handleChainModalClose}
      />

      {/* Role Selector Modal */}
      {roleSelectSeat !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto border-stone-800 glass-panel text-stone-100">
            <CardHeader className="flex flex-row items-center justify-between border-b border-stone-800 pb-4">
              <CardTitle className="text-2xl text-stone-200 font-cinzel tracking-widest flex items-center gap-2">
                <span className="text-red-800">✦</span>
                Assign Role ({SCRIPTS[gameState.currentScriptId]?.name || 'Unknown Script'})
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setRoleSelectSeat(null)}>
                <X className="w-6 h-6" />
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {renderRoleSection('TOWNSFOLK', 'Townsfolk', rolesByTeam.TOWNSFOLK || [])}
                {renderRoleSection('OUTSIDER', 'Outsider', rolesByTeam.OUTSIDER || [])}
                {renderRoleSection('MINION', 'Minion', rolesByTeam.MINION || [])}
                {renderRoleSection('DEMON', 'Demon', rolesByTeam.DEMON || [])}
              </div>
              <div className="mt-8 flex justify-end gap-4">
                <Button
                  variant="ghost"
                  onClick={() => { assignRole(roleSelectSeat, null); setRoleSelectSeat(null); }}
                  className="text-stone-500 hover:text-red-400"
                >
                  CLEAR ROLE
                </Button>
                <Button variant="secondary" onClick={() => setRoleSelectSeat(null)}>
                  CANCEL
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};




