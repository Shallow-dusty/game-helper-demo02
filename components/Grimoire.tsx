
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Stage, Layer, Circle, Text, Group, Rect, Ring } from 'react-konva';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS, PHASE_LABELS, SCRIPTS, STATUS_OPTIONS, STATUS_ICONS, PRESET_REMINDERS, Z_INDEX } from '../constants';
import { Seat, SeatStatus } from '../types';
import Konva from 'konva';
import { showWarning } from './Toast';

interface GrimoireProps {
  width: number;
  height: number;
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

// ...existing code...
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
  disableInteractions?: boolean;
}

// Long press hook for mobile support
const useLongPress = (onLongPress: (e: any) => void, onClick: (e: any) => void, delay = 500, disabled = false) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback((e: any) => {
    if (disabled) return;
    // Prevent long press if multiple touches (e.g. pinch zoom)
    if (e.evt?.touches && e.evt.touches.length > 1) return;

    isLongPressRef.current = false;
    startPosRef.current = { x: e.evt?.clientX || 0, y: e.evt?.clientY || 0 };
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay, disabled]);

  const clear = useCallback((e: any, shouldClick = false) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
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
    }
  }, [disabled]);

  return {
    onTouchStart: start,
    onTouchEnd: (e: any) => clear(e, true),
    onTouchMove: move,
    onMouseDown: start,
    onMouseUp: (e: any) => clear(e, true),
    onMouseLeave: (e: any) => clear(e, false),
  };
};

const SeatNode: React.FC<SeatNodeProps> = React.memo(({ seat, cx, cy, radius, angle, isST, isCurrentUser, scale, onClick, onLongPress, disableInteractions = false }) => {
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  const [isHovered, setIsHovered] = React.useState(false);

  const longPressHandlers = useLongPress(onLongPress, onClick, 500, disableInteractions);

  // --- PRIVACY LOGIC ---
  // Determine which role ID to display
  // For ST: Use realRoleId if available (true role), otherwise roleId
  // For Player: roleId is already filtered to be seenRoleId by the store
  const displayRoleId = (isST && seat.realRoleId) ? seat.realRoleId : seat.seenRoleId;

  // Only show Role if: User is Storyteller, OR User is this Seat
  const showRole = (isST || isCurrentUser) && displayRoleId;
  const roleDef = showRole && displayRoleId ? ROLES[displayRoleId] : null;

  // Check for Drunk/Lunatic/Marionette state (ST Only)
  // If realRoleId exists and differs from roleId (which stores the "seen" role for compatibility), it's a state
  const isMisled = isST && seat.realRoleId && seat.seenRoleId && seat.realRoleId !== seat.seenRoleId;
  const seenRoleDef = isMisled ? ROLES[seat.seenRoleId!] : null;

  // Voting Highlighting
  const votingState = useStore(state => state.gameState?.voting);
  const isClockHand = votingState?.clockHandSeatId === seat.id;

  // Dimensions based on scale
  const tokenRadius = 35 * scale;
  const fontSizeName = 14 * scale;
  const fontSizeRole = 20 * scale;
  const iconSize = 16 * scale;
  const statusIconSize = 14 * scale;

  return (
    <Group
      x={x}
      y={y}
      {...longPressHandlers}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={(e) => { setIsHovered(false); longPressHandlers.onMouseLeave(e); }}
    >
      {/* Clock Hand Indicator */}
      {isClockHand && (
        <Ring innerRadius={tokenRadius + 3} outerRadius={tokenRadius + 9} fill="#fbbf24" listening={false} />
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
      {seat.isDead && (
        <Group>
          <Rect x={-tokenRadius / 1.5} y={-3} width={tokenRadius * 1.3} height={6} fill="#dc2626" rotation={45} cornerRadius={2} />
          <Rect x={-tokenRadius / 1.5} y={-3} width={tokenRadius * 1.3} height={6} fill="#dc2626" rotation={-45} cornerRadius={2} />
        </Group>
      )}

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

      {/* Role Info (Hidden for others) */}
      {roleDef && (
        <Group>
          {/* Role Name Abbreviation */}
          <Text
            y={-fontSizeRole / 3}
            text={roleDef.name.substring(0, 2)}
            fontSize={fontSizeRole}
            fontStyle="bold"
            fontFamily="Cinzel"
            fill={seat.hasUsedAbility ? '#777' : '#fff'} // Dim if ability used
            width={tokenRadius * 2}
            offsetX={tokenRadius}
            align="center"
            listening={false}
          />

          {/* Ability Used Status (Top Right) */}
          {seat.hasUsedAbility && (
            <Text
              x={tokenRadius * 0.3}
              y={-tokenRadius * 0.7}
              text="🚫"
              fontSize={statusIconSize}
              listening={false}
            />
          )}

          {/* Role Icon/Passive Indicator (Top Left) */}
          {roleDef.icon && (
            <Text
              x={-tokenRadius * 0.7}
              y={-tokenRadius * 0.7}
              text={roleDef.icon}
              fontSize={iconSize}
              listening={false}
            />
          )}

          {/* Misled Indicator (ST Only) - Show what the player thinks they are */}
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
      )}

      {/* Status Icons (ST Only) */}
      {isST && seat.statuses.length > 0 && (
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
      )}

      {/* Voting Hand */}
      {seat.isHandRaised && (
        <Group y={-tokenRadius - 10} x={tokenRadius / 2}>
          <Circle radius={10 * scale} fill="#fbbf24" shadowBlur={5} />
          <Text text="✋" x={-7 * scale} y={-7 * scale} fontSize={14 * scale} />
        </Group>
      )}

      {/* Ghost Vote Token */}
      {seat.isDead && (
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
      )}

      {/* Virtual Player Indicator */}
      {seat.isVirtual && (
        <Text
          x={-tokenRadius * 0.8}
          y={tokenRadius * 0.5}
          text="🤖"
          fontSize={16 * scale}
          listening={false}
        />
      )}

      {/* Tooltip for Name (on hover) */}
      {isHovered && (
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
      )}

      {/* Reminders (ST Only) */}
      {isST && seat.reminders.length > 0 && (
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
      )}
    </Group>
  );
});

export const Grimoire: React.FC<GrimoireProps> = ({ width, height }) => {
  const gameState = useStore(state => state.gameState);
  const user = useStore(state => state.user);
  const joinSeat = useStore(state => state.joinSeat);
  const toggleDead = useStore(state => state.toggleDead);
  const toggleAbilityUsed = useStore(state => state.toggleAbilityUsed);
  const toggleStatus = useStore(state => state.toggleStatus);
  const startVote = useStore(state => state.startVote);
  const assignRole = useStore(state => state.assignRole);
  const addReminder = useStore(state => state.addReminder);
  const removeReminder = useStore(state => state.removeReminder);
  const removeVirtualPlayer = useStore(state => state.removeVirtualPlayer);

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, seatId: number } | null>(null);
  const [roleSelectSeat, setRoleSelectSeat] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false); // Mobile Lock State

  // Pinch-zoom 状态
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

  // 处理多指触摸开始
  const handleTouchStart = useCallback((e: Konva.KonvaEventObject<TouchEvent>) => {
    const touch = e.evt.touches;
    if (touch.length === 2 && touch[0] && touch[1]) {
      // 双指触摸 - 开始缩放
      isPinching.current = true;
      updateGestureState();
      e.evt.preventDefault();

      const p1 = { x: touch[0].clientX, y: touch[0].clientY };
      const p2 = { x: touch[1].clientX, y: touch[1].clientY };

      lastCenter.current = getCenter(p1, p2);
      lastDist.current = getDistance(p1, p2);
    }
  }, [updateGestureState]);

  // 处理多指触摸移动
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

      // 计算缩放比例
      const scaleBy = newDist / lastDist.current;
      const oldScale = stageScale;
      let newScale = oldScale * scaleBy;

      // 限制缩放范围
      newScale = Math.max(0.5, Math.min(3, newScale));

      // 计算新的位置，使缩放以双指中心为基准
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

  // 处理触摸结束
  const handleTouchEnd = useCallback(() => {
    lastCenter.current = null;
    lastDist.current = 0;
    isPinching.current = false;
    updateGestureState();
  }, [updateGestureState]);

  // 处理鼠标滚轮缩放（桌面端）
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

    // 限制缩放范围
    newScale = Math.max(0.5, Math.min(3, newScale));

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    setStageScale(newScale);
    setStagePos(newPos);
  }, [stageScale, stagePos]);

  // 重置缩放
  const resetZoom = useCallback(() => {
    setStageScale(1);
    setStagePos({ x: 0, y: 0 });
    draggingRef.current = false;
    isPinching.current = false;
    setIsGestureActive(false);
  }, []);

  // Handle long press for mobile (opens context menu for ST)
  const handleLongPress = useCallback((e: any, seat: Seat) => {
    if (isLocked || isGestureActive) return;
    if (!user?.isStoryteller) return;

    e.cancelBubble = true;

    // Get touch position for mobile
    const clientX = e.evt?.touches?.[0]?.clientX || e.evt?.clientX || window.innerWidth / 2;
    const clientY = e.evt?.touches?.[0]?.clientY || e.evt?.clientY || window.innerHeight / 2;

    const menuWidth = 240;
    const menuHeight = 480;

    let x = clientX;
    let y = clientY;

    // 防止overflow
    if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 20;
    if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 20;
    if (y < 20) y = 20;
    if (x < 20) x = 20;

    setContextMenu({ x, y, seatId: seat.id });
  }, [isLocked, isGestureActive, user?.isStoryteller]);

  // 早期返回必须在所有 hooks 之后
  if (!gameState || !user) return null;

  // 检查 seats 数组是否有效
  if (!gameState.seats || !Array.isArray(gameState.seats) || gameState.seats.length === 0) {
    console.warn('Grimoire: seats 数组无效', gameState.seats);
    return (
      <div className="w-full h-full flex items-center justify-center text-stone-400">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>正在加载座位数据...</p>
          <p className="text-xs text-stone-500 mt-2">如果一直显示此消息，请刷新页面</p>
        </div>
      </div>
    );
  }

  // 调试：打印传入的尺寸
  console.log('[Grimoire] Rendering with dimensions:', { width, height });

  // 安全检查：确保宽高有效
  const safeWidth = Math.max(width, 100);
  const safeHeight = Math.max(height, 100);

  const cx = safeWidth / 2;
  const cy = safeHeight / 2;
  const minDim = Math.min(safeWidth, safeHeight);

  // 优化移动端缩放逻辑：基于屏幕大小动态调整
  const baseScale = Math.max(0.35, Math.min(1.2, minDim / 700));

  // 动态计算半径，确保留出足够空间给名字和状态图标
  // 移动端需要更多边距，因为 Token 和文字会更拥挤
  const seatCount = gameState.seats.length;
  const marginFactor = seatCount > 10 ? 80 : 60; // 玩家多时增加边距
  const margin = marginFactor * baseScale;
  const r = Math.max((minDim / 2) - margin, minDim * 0.3); // 确保最小半径

  const requestSeatSwap = useStore(state => state.requestSeatSwap);

  const handleSeatClick = (e: any, seat: Seat) => {
    if (isLocked || isGestureActive) return; // Double check logic
    e.cancelBubble = true;

    if (seat.isVirtual && !user.isStoryteller) {
      showWarning('该座位为虚拟玩家占位，请等待说书人安排。');
      return;
    }

    // Right click for ST context menu (desktop)
    if (e.evt?.button === 2 && user.isStoryteller) {
      const menuWidth = 240;
      const menuHeight = 480; // 增加高度估计以包含子菜单和标记列表

      let x = e.evt.clientX;
      let y = e.evt.clientY;

      // 防止overflow - 增加安全间距
      if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 20;
      if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 20;

      // 确保菜单不会超出顶部
      if (y < 20) y = 20;

      setContextMenu({
        x,
        y,
        seatId: seat.id
      });
      return;
    }

    // Player Logic
    if (!user.isStoryteller) {
      // Case 1: Empty seat -> Join
      if (seat.userId === null) {
        joinSeat(seat.id);
        return;
      }

      // Case 2: Occupied seat -> Request Swap (if not self)
      if (seat.userId !== user.id) {
        // Confirm dialog using browser native confirm for simplicity, or better, a custom modal.
        // Since we don't have a generic confirm modal handy, we'll use window.confirm for now
        // or just trigger the request and let the store handle warnings.
        // Let's use a simple confirm.
        if (window.confirm(`是否向 ${seat.userName} 发起换座申请？`)) {
          requestSeatSwap(seat.id);
        }
        return;
      }
    }

    // Storyteller Logic for left click (optional, currently does nothing special for occupied seats)
    if (user.isStoryteller && seat.userId === null) {
      joinSeat(seat.id);
    }
  };

  // Filter roles based on selected script
  const currentScriptRoles = SCRIPTS[gameState.currentScriptId]?.roles || [];

  const rolesByTeam: Record<string, any[]> = {
    TOWNSFOLK: [],
    OUTSIDER: [],
    MINION: [],
    DEMON: []
  };

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
      {/* Mobile Lock Button & Zoom Controls */}
      <div className="absolute top-4 right-4 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-auto">
        <div className="flex gap-3">
          {/* Auto Fit Button */}
          <button
            onClick={resetZoom}
            className="w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full shadow-lg bg-stone-800/90 text-stone-400 hover:bg-stone-700 transition-colors backdrop-blur-sm border border-stone-700"
            title="适配屏幕 (Fit Screen)"
          >
            ⛶
          </button>
          <button
            onClick={() => setIsLocked(!isLocked)}
            className={`w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full shadow-lg transition-colors backdrop-blur-sm border ${isLocked ? 'bg-red-900/90 border-red-700 text-white' : 'bg-stone-800/90 border-stone-700 text-stone-400 hover:bg-stone-700'}`}
            title={isLocked ? "解锁交互 (Unlock)" : "锁定交互 (Lock)"}
          >
            {isLocked ? '🔒' : '🔓'}
          </button>
        </div>
        {/* Zoom indicator */}
        {stageScale !== 1 && (
          <div className="text-xs font-bold text-amber-400 bg-black/60 px-2 py-1 rounded backdrop-blur-sm border border-stone-800">
            {Math.round(stageScale * 100)}%
          </div>
        )}
        {user.isStoryteller && !isLocked && stageScale === 1 && (
          <div className="text-[10px] text-stone-400 bg-black/60 px-3 py-1.5 rounded-full text-right hidden sm:block backdrop-blur-sm border border-stone-800">
            💡 长按玩家打开菜单 / 双指缩放
          </div>
        )}
      </div>

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
        onDragStart={() => {
          draggingRef.current = true;
          updateGestureState();
        }}
        onDragEnd={(e) => {
          setStagePos({ x: e.target.x(), y: e.target.y() });
          draggingRef.current = false;
          updateGestureState();
        }}
      >
        {/* Decoration Layer - No event listening for better performance */}
        <Layer listening={false}>
          {/* Center Circle / Decor */}
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

        {/* Interactive Layer - Seats and player interactions */}
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
                onLongPress={(e: any) => handleLongPress(e, seat)}
                disableInteractions={isLocked || isGestureActive}
              />
            );
          })}
        </Layer>
      </Stage>

      {/* ST Context Menu (Now a Modal) */}
      {contextMenu && user.isStoryteller && (() => {
        const selectedSeat = gameState.seats.find(s => s.id === contextMenu.seatId);
        if (!selectedSeat) return null;

        const selectedRole = selectedSeat.seenRoleId ? ROLES[selectedSeat.seenRoleId] : null;
        const roleTeamIcon = selectedRole?.team === 'DEMON' ? '👿' : selectedRole?.team === 'MINION' ? '🧪' : '⚜️';

        return (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ zIndex: Z_INDEX.modal }}
            onClick={() => setContextMenu(null)}
          >
            <div
              className="bg-stone-900 border border-stone-600 rounded-lg shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-stone-950 p-4 border-b border-stone-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700 text-xl">
                    {selectedSeat.seenRoleId ? roleTeamIcon : '👤'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-stone-200 font-cinzel">
                      {selectedSeat.userName}
                    </h3>
                    <p className="text-xs text-stone-500">
                      座位 {contextMenu.seatId + 1} • {selectedRole?.name || '未分配角色'}
                    </p>
                  </div>
                </div>
                <button onClick={() => setContextMenu(null)} className="text-stone-500 hover:text-stone-300 p-2">✕</button>
              </div>

              {/* Actions Grid */}
              <div className="p-4 grid grid-cols-2 gap-3">
                {/* Alive/Dead Toggle */}
                <button
                  onClick={() => { toggleDead(contextMenu.seatId); setContextMenu(null); }}
                  className={`p-3 rounded border flex items-center gap-3 transition-colors ${selectedSeat.isDead ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}
                >
                  <span className="text-2xl">{selectedSeat.isDead ? '💀' : '❤️'}</span>
                  <div className="text-left">
                    <div className="font-bold text-sm">切换存活</div>
                    <div className="text-[10px] opacity-70">{selectedSeat.isDead ? '当前: 死亡' : '当前: 存活'}</div>
                  </div>
                </button>

                {/* Ability Used Toggle */}
                <button
                  onClick={() => { toggleAbilityUsed(contextMenu.seatId); setContextMenu(null); }}
                  className={`p-3 rounded border flex items-center gap-3 transition-colors ${selectedSeat.hasUsedAbility ? 'bg-stone-950 border-stone-800 text-stone-500' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}
                >
                  <span className="text-2xl">🚫</span>
                  <div className="text-left">
                    <div className="font-bold text-sm">技能耗尽</div>
                    <div className="text-[10px] opacity-70">{selectedSeat.hasUsedAbility ? '已使用' : '未使用'}</div>
                  </div>
                </button>

                {/* Assign Role */}
                <button
                  onClick={() => { setRoleSelectSeat(contextMenu.seatId); setContextMenu(null); }}
                  className="p-3 rounded border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center gap-3 transition-colors"
                >
                  <span className="text-2xl">🎭</span>
                  <div className="text-left">
                    <div className="font-bold text-sm">分配角色</div>
                    <div className="text-[10px] opacity-70">更改玩家角色</div>
                  </div>
                </button>

                {/* Nominate */}
                <button
                  onClick={() => { startVote(contextMenu.seatId); setContextMenu(null); }}
                  className="p-3 rounded border border-stone-700 bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center gap-3 transition-colors"
                >
                  <span className="text-2xl">⚖️</span>
                  <div className="text-left">
                    <div className="font-bold text-sm">发起提名</div>
                    <div className="text-[10px] opacity-70">开始投票流程</div>
                  </div>
                </button>

                {/* Remove Virtual Player - Only shown for virtual seats */}
                {selectedSeat.isVirtual && (
                  <button
                    onClick={() => { removeVirtualPlayer(contextMenu.seatId); setContextMenu(null); }}
                    className="p-3 rounded border border-red-800/50 bg-red-950/30 hover:bg-red-900/50 text-red-300 flex items-center gap-3 transition-colors col-span-2"
                  >
                    <span className="text-2xl">🗑️</span>
                    <div className="text-left">
                      <div className="font-bold text-sm">删除虚拟玩家</div>
                      <div className="text-[10px] opacity-70">将此座位恢复为空座位</div>
                    </div>
                  </button>
                )}
              </div>

              {/* Status Section */}
              <div className="px-4 pb-4">
                <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">状态 (Status)</h4>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.filter(status => {
                    // Filter logic: TB script doesn't have Madness
                    if (gameState.currentScriptId === 'tb' && status.id === 'MADNESS') return false;
                    return true;
                  }).map(status => {
                    const hasStatus = selectedSeat.statuses.includes(status.id as SeatStatus);
                    return (
                      <button
                        key={status.id}
                        onClick={() => toggleStatus(contextMenu.seatId, status.id as SeatStatus)}
                        className={`px-3 py-1.5 rounded-full text-xs border flex items-center gap-1.5 transition-all ${hasStatus ? 'bg-amber-900/50 border-amber-600 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]' : 'bg-stone-950 border-stone-800 text-stone-500 hover:border-stone-600'}`}
                      >
                        <span>{status.icon}</span>
                        <span>{status.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reminders Section */}
              <div className="px-4 pb-4 border-t border-stone-800 pt-4">
                <h4 className="text-xs font-bold text-stone-500 uppercase mb-2">标记 (Reminders)</h4>

                {/* Existing Reminders */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedSeat.reminders.map(rem => (
                    <button
                      key={rem.id}
                      onClick={() => removeReminder(rem.id)}
                      className="px-2 py-1 rounded bg-stone-800 border border-stone-600 text-xs text-stone-300 hover:bg-red-900/30 hover:border-red-800 hover:text-red-300 flex items-center gap-1 transition-colors group"
                      title="点击删除"
                    >
                      <span>{rem.icon || '🔸'}</span>
                      <span>{rem.text}</span>
                      <span className="hidden group-hover:inline ml-1">×</span>
                    </button>
                  ))}
                  {selectedSeat.reminders.length === 0 && (
                    <span className="text-xs text-stone-600 italic">无标记</span>
                  )}
                </div>

                {/* Add Reminder Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {PRESET_REMINDERS.map(preset => (
                    <button
                      key={preset.text}
                      onClick={() => {
                        if (preset.text === '自定义') {
                          const text = prompt("输入标记内容:");
                          if (text) addReminder(contextMenu.seatId, text, preset.icon, preset.color);
                        } else {
                          addReminder(contextMenu.seatId, preset.text, preset.icon, preset.color);
                        }
                      }}
                      className="p-2 rounded bg-stone-950 border border-stone-800 hover:bg-stone-800 text-center transition-colors flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-lg">{preset.icon}</span>
                      <span className="text-[10px] text-stone-400">{preset.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Role Selector Modal */}
      {roleSelectSeat !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-950 border border-stone-700 p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
              <h3 className="text-2xl text-stone-200 font-cinzel tracking-widest">
                <span className="text-red-800 mr-2">✦</span>
                分配角色 ({SCRIPTS[gameState.currentScriptId]?.name || '未选择剧本'})
              </h3>
              <button onClick={() => setRoleSelectSeat(null)} className="text-stone-500 hover:text-stone-200 text-2xl">×</button>
            </div>

            <div className="space-y-6">
              {renderRoleSection('TOWNSFOLK', '村民', rolesByTeam.TOWNSFOLK || [])}
              {renderRoleSection('OUTSIDER', '外来者', rolesByTeam.OUTSIDER || [])}
              {renderRoleSection('MINION', '爪牙', rolesByTeam.MINION || [])}
              {renderRoleSection('DEMON', '恶魔', rolesByTeam.DEMON || [])}
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => { assignRole(roleSelectSeat, null as any); setRoleSelectSeat(null); }} className="px-6 py-2 text-stone-500 hover:text-red-400 text-xs uppercase tracking-widest transition-colors">
                清除角色
              </button>
              <button onClick={() => setRoleSelectSeat(null)} className="px-8 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-cinzel text-sm transition-colors">
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
