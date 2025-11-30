import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Circle, Text, Group, Rect, Ring, Arc } from 'react-konva';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS, PHASE_LABELS, SCRIPTS, JINX_DEFINITIONS, STATUS_ICONS } from '../constants';
import { Seat } from '../types';
import Konva from 'konva';
import { showWarning } from './Toast';
import { StorytellerMenu } from './StorytellerMenu';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { X, Lock, Unlock, Crosshair } from 'lucide-react';

interface GrimoireProps {
  width: number;
  height: number;
  readOnly?: boolean;
  publicOnly?: boolean;
  gameState?: import('../types').GameState;
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
}

// Long press hook for mobile support ONLY
const useLongPress = (onLongPress: (e: any) => void, onClick: (e: any) => void, delay = 500, disabled = false) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const [isPressing, setIsPressing] = useState(false);

  const start = useCallback((e: any) => {
    if (disabled) return;
    // Prevent long press if multiple touches (e.g. pinch zoom)
    if (e.evt?.touches && e.evt.touches.length > 1) return;

    isLongPressRef.current = false;
    startPosRef.current = { x: e.evt?.clientX || 0, y: e.evt?.clientY || 0 };
    setIsPressing(true);

    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsPressing(false);
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay, disabled]);

  const clear = useCallback((e: any, shouldClick = false) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(false);
    if (shouldClick && !isLongPressRef.current) {
      onClick(e);
    }
  }, [onClick]);

  const move = useCallback((e: any) => {
    if (startPosRef.current && timerRef.current) {
      const dx = Math.abs((e.evt?.clientX || 0) - startPosRef.current.x);
      const dy = Math.abs((e.evt?.clientY || 0) - startPosRef.current.y);
      // Cancel long press if moved more than 10px
      if (dx > 10 || dy > 10) {
        clear(e, false);
      }
    }
  }, [clear]);

  useEffect(() => {
    if (disabled && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      setIsPressing(false);
    }
  }, [disabled]);

  return {
    handlers: {
      onTouchStart: start,
      onTouchEnd: (e: any) => clear(e, true),
      onTouchMove: move,
      // REMOVED MOUSE HANDLERS TO FIX DESKTOP DELAY
    },
    isPressing
  };
};

const SeatNode: React.FC<SeatNodeProps> = React.memo(({ seat, cx, cy, radius, angle, isST, isCurrentUser, scale, onClick, onLongPress, onContextMenu, disableInteractions = false, isSwapSource = false, publicOnly = false }) => {
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  const [isHovered, setIsHovered] = React.useState(false);

  const { handlers: longPressHandlers, isPressing } = useLongPress(onLongPress, onClick, 500, disableInteractions);

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
        easing: Konva.Easings.Linear,
      });
      tween.play();
      return () => { tween.destroy(); };
    }
    return undefined;
  }, [isPressing]);

  const displayRoleId = (isST && seat.realRoleId) ? seat.realRoleId : seat.seenRoleId;
  const showRole = !publicOnly && (isST || isCurrentUser) && displayRoleId;
  const roleDef = showRole && displayRoleId ? ROLES[displayRoleId] : null;
  const isMisled = isST && seat.realRoleId && seat.seenRoleId && seat.realRoleId !== seat.seenRoleId;
  const seenRoleDef = isMisled ? ROLES[seat.seenRoleId!] : null;
  const votingState = useStore(state => state.gameState?.voting);
  const isClockHand = votingState?.clockHandSeatId === seat.id;

  const tokenRadius = 35 * scale;
  const fontSizeName = 14 * scale;
  const fontSizeRole = 20 * scale;
  const iconSize = 16 * scale;
  const statusIconSize = 14 * scale;

  return (
    <Group
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

      {/* Seat Circle (Token Base) */}
      <Circle
        radius={tokenRadius}
        fill={seat.isDead ? '#44403c' : TEAM_COLORS[roleDef?.team || 'TOWNSFOLK']}
        stroke={isCurrentUser ? '#f59e0b' : '#292524'}
        strokeWidth={isCurrentUser ? 4 : 2}
        shadowBlur={isCurrentUser ? 15 : 5}
        shadowColor={isCurrentUser ? '#f59e0b' : 'black'}
        opacity={seat.isDead ? 0.8 : 1}
        dash={seat.isVirtual ? [5, 5] : undefined}
      />

      {/* Inner Ring for Style */}
      <Circle
        radius={tokenRadius - 4}
        stroke="#ffffff"
        strokeWidth={1}
        opacity={0.1}
        listening={false}
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
      <Text
        y={tokenRadius + 8}
        text={seat.userName}
        fontSize={fontSizeName}
        fill="#e5e5e5"
        width={tokenRadius * 3}
        offsetX={tokenRadius * 1.5}
        align="center"
        fontStyle="bold"
        fontFamily="Crimson Text"
        shadowColor="black"
        shadowBlur={2}
        shadowOpacity={0.8}
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

      {/* Status Icons */}
      {
        isST && seat.statuses.length > 0 && (
          <Group y={tokenRadius * 0.5} x={0}>
            {seat.statuses.map((status, idx) => (
              <Text
                key={status}
                x={(idx - (seat.statuses.length - 1) / 2) * 14}
                y={0}
                text={STATUS_ICONS[status]}
                fontSize={12}
                offsetX={6}
              />
            ))}
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
  const removeVirtualPlayer = useStore(state => state.removeVirtualPlayer);
  const swapSeats = useStore(state => state.swapSeats);
  const requestSeatSwap = useStore(state => state.requestSeatSwap);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, seatId: number } | null>(null);
  const [roleSelectSeat, setRoleSelectSeat] = useState<number | null>(null);
  const [swapSourceId, setSwapSourceId] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // Pinch-zoom state
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number>(0);
  const isPinching = useRef(false);
  const draggingRef = useRef(false);
  const [isGestureActive, setIsGestureActive] = useState(false);

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

  const resetZoom = useCallback(() => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
    draggingRef.current = false;
    isPinching.current = false;
    setIsGestureActive(false);
  }, []);

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
          <p>Loading Grimoire...</p>
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
    e.cancelBubble = true;

    if (seat.isVirtual && !user.isStoryteller) {
      showWarning('This seat is reserved for a virtual player.');
      return;
    }

    // Storyteller Logic
    if (user.isStoryteller) {
      if (swapSourceId !== null) {
        if (swapSourceId === seat.id) {
          setSwapSourceId(null);
          showWarning('Swap cancelled');
        } else {
          if (window.confirm(`Swap seat ${swapSourceId + 1} with ${seat.id + 1}?`)) {
            swapSeats(swapSourceId, seat.id);
            setSwapSourceId(null);
          }
        }
        return;
      }
      if (seat.userId === null) {
        joinSeat(seat.id);
      }
    } else {
      // Player Logic
      if (seat.userId === null) {
        if (joiningId !== null) return;
        setJoiningId(seat.id);
        joinSeat(seat.id).finally(() => setJoiningId(null));
        return;
      }
      if (seat.userId !== user.id) {
        if (window.confirm(`Request swap with ${seat.userName}?`)) {
          requestSeatSwap(seat.id);
        }
        return;
      }
    }
  };

  const currentScriptRoles = SCRIPTS[gameState.currentScriptId]?.roles || [];
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
          <div className="flex gap-3">
            <Button
              size="icon"
              variant="secondary"
              onClick={resetZoom}
              title="Reset View"
              className="rounded-full shadow-lg border-stone-700 bg-stone-900/80 backdrop-blur-sm"
            >
              <Crosshair className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              variant={isLocked ? "destructive" : "secondary"}
              onClick={() => setIsLocked(!isLocked)}
              title={isLocked ? "Locked" : "Unlocked"}
              className={`rounded-full shadow-lg border backdrop-blur-sm ${isLocked ? 'bg-red-900/80 border-red-700' : 'bg-stone-900/80 border-stone-700'}`}
            >
              {isLocked ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </Button>
          </div>
          {stageScale !== 1 && (
            <div className="bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md border border-stone-800">
              {Math.round(stageScale * 100)}%
            </div>
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
        onDragStart={() => { draggingRef.current = true; updateGestureState(); }}
        onDragEnd={(e) => { setStagePos({ x: e.target.x(), y: e.target.y() }); draggingRef.current = false; updateGestureState(); }}
      >
        <Layer listening={false}>
          <Circle
            x={cx}
            y={cy}
            radius={r + (40 * baseScale)}
            stroke="#ffffff"
            strokeWidth={1}
            dash={[10, 20]}
            opacity={0.1}
          />
          <Text
            x={cx - 100}
            y={cy - 10}
            width={200}
            align="center"
            text={PHASE_LABELS[gameState.phase] || gameState.phase}
            fontSize={24 * baseScale}
            fill="#666"
            fontFamily="Cinzel"
            fontStyle="italic"
            letterSpacing={2}
          />
        </Layer>

        <Layer>
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
              />
            );
          })}
        </Layer>
      </Stage>

      {/* Storyteller Menu Modal */}
      {contextMenu && user.isStoryteller && (
        <StorytellerMenu
          seat={gameState.seats.find(s => s.id === contextMenu.seatId)!}
          onClose={() => setContextMenu(null)}
          currentScriptId={gameState.currentScriptId}
          actions={{
            toggleDead,
            toggleAbilityUsed,
            toggleStatus,
            addReminder,
            removeReminder,
            removeVirtualPlayer,
            startVote,
            setRoleSelectSeat,
            setSwapSourceId
          }}
        />
      )}

      {/* Role Selector Modal */}
      {roleSelectSeat !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto border-stone-700 bg-stone-950">
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
                  onClick={() => { assignRole(roleSelectSeat, null as any); setRoleSelectSeat(null); }}
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
