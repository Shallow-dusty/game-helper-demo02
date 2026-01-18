/**
 * Grimoire - 游戏主要交互界面
 *
 * 血染钟楼魔典的核心视觉界面
 * 显示圆形座位布局、实时角色信息、游戏状态
 * 支持说书人编辑、玩家交互、触摸缩放
 */

import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Circle, Text, Group, Rect, RegularPolygon } from 'react-konva';
import { useStore } from '../../store';
import { PHASE_LABELS, JINX_DEFINITIONS } from '../../constants';
import { Seat } from '../../types';
import Konva from 'konva';
import { showWarning } from '../ui/Toast';
import { StorytellerMenu } from './StorytellerMenu';
import { ChainReactionModal } from './ChainReactionModal';
import { detectChainReactions, type ChainReactionEvent } from '../../lib/chainReaction';
import { Lock, Unlock } from 'lucide-react';
import { CandlelightOverlay } from './CandlelightOverlay';
import SeatNode from './SeatNode';
import RoleSelectorModal from './RoleSelectorModal';
import { useGrimoireState, useGameActions, useUser } from '../../hooks/useGameStateSelectors';
import { useTranslation } from 'react-i18next';

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

export const Grimoire: React.FC<GrimoireProps> = ({
  width,
  height,
  readOnly = false,
  publicOnly = false,
  gameState: propsGameState,
  isStorytellerView = false
}) => {
  const { t } = useTranslation();

  // 使用优化的选择器 - 只订阅需要的属性
  const grimoireState = useGrimoireState();
  const storeUser = useUser();
  const gameActions = useGameActions();

  // 合并 props 和 store 状态
  const gameState = useMemo(() => {
    if (propsGameState) return propsGameState;
    if (!grimoireState.seats) return null;
    return {
      seats: grimoireState.seats,
      phase: grimoireState.phase,
      voting: grimoireState.voting,
      setupPhase: grimoireState.setupPhase,
      rolesRevealed: grimoireState.rolesRevealed,
      candlelightEnabled: grimoireState.candlelightEnabled,
      currentScriptId: grimoireState.currentScriptId,
    };
  }, [propsGameState, grimoireState]);

  const user = propsGameState
    ? {
        id: 'spectator',
        name: 'Spectator',
        isStoryteller: isStorytellerView,
        roomId: propsGameState.roomId,
        isObserver: true
      }
    : storeUser;

  // Store actions - 使用优化的选择器
  const {
    joinSeat,
    toggleDead,
    toggleAbilityUsed,
    toggleStatus,
    startVote,
    assignRole,
    addReminder,
    removeReminder,
    forceLeaveSeat,
    removeVirtualPlayer,
    swapSeats,
    requestSeatSwap,
  } = gameActions;

  // Component state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; seatId: number } | null>(null);
  const [roleSelectSeat, setRoleSelectSeat] = useState<number | null>(null);
  const [swapSourceId, setSwapSourceId] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  const [chainEvents, setChainEvents] = useState<ChainReactionEvent[]>([]);
  const [_pendingDeathSeatId, setPendingDeathSeatId] = useState<number | null>(null);

  // Canvas state
  const stageRef = useRef<Konva.Stage>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });
  const lastCenter = useRef<{ x: number; y: number } | null>(null);
  const lastDist = useRef<number>(0);
  const lastGestureTime = useRef<number>(0);
  const isPinching = useRef(false);
  const draggingRef = useRef(false);
  const [isGestureActive, setIsGestureActive] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  const updateGestureState = useCallback(() => {
    setIsGestureActive(isPinching.current || draggingRef.current);
  }, []);

  // Touch gesture handlers
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

  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
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
    },
    [stageScale, stagePos]
  );

  const handleTouchEnd = useCallback(() => {
    lastCenter.current = null;
    lastDist.current = 0;
    isPinching.current = false;
    lastGestureTime.current = Date.now();
    updateGestureState();
  }, [updateGestureState]);

  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
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
    },
    [stageScale, stagePos]
  );

  // Menu trigger handler
  const handleMenuTrigger = useCallback(
    (seat: Seat) => {
      if (readOnly || isLocked || isGestureActive) return;
      if (!user?.isStoryteller) return;
      setContextMenu({ x: 0, y: 0, seatId: seat.id });
    },
    [isLocked, isGestureActive, user?.isStoryteller, readOnly]
  );

  // Seat click handler
  const handleSeatClick = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>, seat: Seat) => {
    if (readOnly || isLocked || isGestureActive) return;
    if (Date.now() - lastGestureTime.current < 200) return;

    e.cancelBubble = true;

    if (seat.isVirtual && user && !user.isStoryteller) {
      showWarning(t('game.grimoire.reservedForVirtual'));
      return;
    }

    // Storyteller logic
    if (user?.isStoryteller) {
      if (swapSourceId !== null) {
        if (swapSourceId === seat.id) {
          setSwapSourceId(null);
          showWarning(t('game.grimoire.swapCancelled'));
        } else {
          if (window.confirm(t('game.grimoire.confirmSwap', { from: String(swapSourceId + 1), to: String(seat.id + 1) }))) {
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
      // Player logic
      if (seat.userId === null) {
        if (joiningId !== null) return;
        setJoiningId(seat.id);
        void joinSeat(seat.id).finally(() => setJoiningId(null));
        return;
      }
      if (user && seat.userId !== user.id) {
        if (window.confirm(t('game.grimoire.confirmSwapPlayer', { player: seat.userName }))) {
          requestSeatSwap(seat.id);
        }
        return;
      }
    }
  };

  // Chain reaction handlers
  const handleToggleDeadWithChainCheck = useCallback(
    (seatId: number) => {
      if (!gameState) return;

      const seat = gameState.seats[seatId];
      if (!seat) return;

      if (seat.isDead) {
        toggleDead(seatId);
        return;
      }

      const events = detectChainReactions(gameState as import('../../types').GameState, 'death', seatId);

      if (events.length > 0) {
        toggleDead(seatId);
        setPendingDeathSeatId(seatId);
        setChainEvents(events);
      } else {
        toggleDead(seatId);
      }
    },
    [gameState, toggleDead]
  );

  const handleChainEventConfirm = useCallback(
    (event: ChainReactionEvent) => {
      if (event.suggestedAction === 'mark_dead') {
        event.affectedSeatIds.forEach(id => toggleDead(id));
      } else if (event.suggestedAction === 'end_game') {
        const data = event.data as { winner: 'GOOD' | 'EVIL'; reason: string } | undefined;
        if (data) {
          useStore.getState().endGame(data.winner, data.reason);
        }
      }

      setChainEvents(prev => prev.slice(1));

      if (chainEvents.length <= 1) {
        setPendingDeathSeatId(null);
      }
    },
    [chainEvents.length, toggleDead]
  );

  const handleChainEventSkip = useCallback(
    (_event: ChainReactionEvent) => {
      setChainEvents(prev => prev.slice(1));

      if (chainEvents.length <= 1) {
        setPendingDeathSeatId(null);
      }
    },
    [chainEvents.length]
  );

  const handleChainModalClose = useCallback(() => {
    setChainEvents([]);
    setPendingDeathSeatId(null);
  }, []);

  // Calculate active jinxes
  const activeJinxes = React.useMemo(() => {
    if (!user?.isStoryteller || !gameState?.seats) return [];
    const activeRoleIds = new Set(gameState.seats.map(s => s.realRoleId ?? s.seenRoleId).filter(Boolean));
    return JINX_DEFINITIONS.filter(
      jinx => activeRoleIds.has(jinx.role1) && activeRoleIds.has(jinx.role2)
    );
  }, [gameState?.seats, user?.isStoryteller]);

  // Validate state
  if (!gameState || !user) return null;

  if (gameState.seats.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-stone-400">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">⏳</div>
          <p>{t('game.grimoire.loadingGrimoire')}</p>
        </div>
      </div>
    );
  }

  // Canvas calculations
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

  return (
    <div
      className="relative w-full h-full"
      style={{ touchAction: 'none' }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => {
        setContextMenu(null);
      }}
    >
      {/* Controls */}
      {!readOnly && !publicOnly && (
        <div className="absolute top-4 right-4 md:right-8 z-40 flex flex-col items-end gap-3 pointer-events-auto">
          {/* Lock/Unlock Toggle */}
          <div
            className="relative group cursor-pointer transition-transform hover:scale-105 active:scale-95"
            onClick={() => setIsLocked(!isLocked)}
            title={isLocked ? t('game.grimoire.clickToEdit') : t('game.grimoire.clickToView')}
          >
            <div
              className={`
                h-12 px-10 flex items-center justify-center
                bg-[#f4e4bc] border-y-4 border-[#8b4513]
                shadow-[0_5px_15px_rgba(0,0,0,0.5)]
                transition-all duration-300
                ${!isLocked ? 'brightness-110 sepia-[.3]' : 'brightness-75 grayscale-[0.5]'}
              `}
            >
              <span className="text-[#4a3728] font-cinzel font-bold text-sm tracking-widest whitespace-nowrap select-none">
                {isLocked ? t('game.grimoire.viewMode') : t('game.grimoire.editMode')}
              </span>
            </div>

            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-16 bg-[#e6d2a0] rounded-full border-r-4 border-[#654321] shadow-[-2px_0_5px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-[radial-gradient(circle,transparent_60%,#654321_100%)]" />
              <div className="absolute w-4 h-4 bg-[#8b4513] rounded-full shadow-inner" />
            </div>

            <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-16 bg-[#e6d2a0] rounded-full border-l-4 border-[#654321] shadow-[2px_0_5px_rgba(0,0,0,0.3)] flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-[radial-gradient(circle,transparent_60%,#654321_100%)]" />
              <div className="absolute w-4 h-4 bg-[#8b4513] rounded-full shadow-inner" />
            </div>

            <div
              className={`
                absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center border-2 shadow-md z-10
                transition-colors duration-300
                ${isLocked ? 'bg-stone-800 border-stone-600 text-stone-400' : 'bg-amber-600 border-amber-400 text-white'}
              `}
            >
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
                ${
                  isPrivacyMode
                    ? 'bg-stone-800 border-stone-600 text-stone-400'
                    : 'bg-stone-900 border-amber-900/50 text-amber-500'
                }
              `}
              title={isPrivacyMode ? t('game.grimoire.disablePrivacy') : t('game.grimoire.enablePrivacy')}
            >
              <span className="text-xl">🕯️</span>
            </button>
          )}
        </div>
      )}

      {/* Jinx Notifications */}
      {activeJinxes.length > 0 && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 pointer-events-none w-full max-w-lg px-4">
          {activeJinxes.map(jinx => (
            <div
              key={jinx.id}
              className="bg-amber-900/80 backdrop-blur-sm border border-amber-600/50 text-amber-100 px-4 py-2 rounded shadow-lg text-xs md:text-sm text-center animate-in slide-in-from-top-4 fade-in duration-500"
            >
              {jinx.description}
            </div>
          ))}
        </div>
      )}

      {/* Konva Stage */}
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
        onDragStart={() => {
          draggingRef.current = true;
          updateGestureState();
        }}
        onDragEnd={(e) => {
          setStagePos({ x: e.target.x(), y: e.target.y() });
          draggingRef.current = false;
          lastGestureTime.current = Date.now();
          updateGestureState();
        }}
      >
        {/* Background Layer */}
        <Layer listening={false}>
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
            radius={r + 40 * baseScale}
            stroke="#ffffff"
            strokeWidth={1}
            dash={[10, 20]}
            opacity={0.1}
          />

          {/* Phase Label */}
          <Text
            x={cx - 100}
            y={cy - 50 * baseScale}
            width={200}
            align="center"
            text={gameState.phase ? (PHASE_LABELS[gameState.phase] ?? gameState.phase) : ''}
            fontSize={24 * baseScale}
            fill="#a8a29e"
            fontFamily="Cinzel"
            fontStyle="italic"
            letterSpacing={2}
            shadowColor="black"
            shadowBlur={5}
          />
        </Layer>

        {/* Seats Layer */}
        <Layer>
          {/* Voting Clock Hand */}
          {(() => {
            const votingState = gameState.voting;
            const targetSeatId = votingState?.clockHandSeatId;

            if (targetSeatId !== undefined && targetSeatId !== null) {
              const seatIndex = gameState.seats.findIndex(s => s.id === targetSeatId);
              if (seatIndex !== -1) {
                const angle = (seatIndex / gameState.seats.length) * 360;
                const rotation = angle - 90;

                return (
                  <Group x={cx} y={cy} rotation={rotation}>
                    <Rect
                      x={0}
                      y={-4 * baseScale}
                      width={r - 40 * baseScale}
                      height={8 * baseScale}
                      fillLinearGradientStartPoint={{ x: 0, y: 0 }}
                      fillLinearGradientEndPoint={{ x: r, y: 0 }}
                      fillLinearGradientColorStops={[0, '#450a0a', 0.5, '#b91c1c', 1, '#ef4444']}
                      shadowColor="#000"
                      shadowBlur={10}
                      cornerRadius={4}
                    />
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
                    <Circle
                      radius={12 * baseScale}
                      fill="#7f1d1d"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      shadowBlur={5}
                    />
                    <Circle radius={4 * baseScale} fill="#f59e0b" />
                  </Group>
                );
              }
            }
            return null;
          })()}

          {/* Seat Nodes */}
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
                onClick={(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => handleSeatClick(e, seat)}
                onLongPress={() => handleMenuTrigger(seat)}
                onContextMenu={(e: Konva.KonvaEventObject<PointerEvent>) => {
                  e.evt.preventDefault();
                  handleMenuTrigger(seat);
                }}
                disableInteractions={readOnly || isLocked || isGestureActive}
                isSwapSource={swapSourceId === seat.id}
                publicOnly={publicOnly}
                setupPhase={gameState.setupPhase}
                rolesRevealed={gameState.rolesRevealed}
                votingClockHandSeatId={gameState.voting?.clockHandSeatId}
              />
            );
          })}
        </Layer>

        {/* Candlelight Layer */}
        {(gameState.phase === 'NIGHT' || (user.isStoryteller && isPrivacyMode)) && (
          <Layer>
            <Group>
              <Rect
                x={-1000}
                y={-1000}
                width={safeWidth + 2000}
                height={safeHeight + 2000}
                fill="#000000"
                opacity={0.95}
                listening={false}
              />

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

      {/* Candlelight Overlay */}
      {gameState.candlelightEnabled && gameState.phase === 'NIGHT' && !readOnly && !user.isStoryteller && (
        <CandlelightOverlay
          width={width}
          height={height}
          isActive={true}
          deadSeatPositions={gameState.seats
            .filter(s => s.isDead)
            .map((seat) => {
              const originalIndex = gameState.seats.findIndex(s => s.id === seat.id);
              const angle = (originalIndex / gameState.seats.length) * 2 * Math.PI - Math.PI / 2;
              return {
                id: seat.id,
                x: cx + r * Math.cos(angle),
                y: cy + r * Math.sin(angle)
              };
            })}
        />
      )}

      {/* Storyteller Menu */}
      {contextMenu && user.isStoryteller && (() => {
        const seat = gameState.seats.find(s => s.id === contextMenu.seatId);
        if (!seat) return null;
        return (
          <StorytellerMenu
            seat={seat}
            onClose={() => setContextMenu(null)}
            currentScriptId={gameState.currentScriptId ?? 'tb'}
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
        );
      })()}

      {/* Chain Reaction Modal */}
      <ChainReactionModal
        isOpen={chainEvents.length > 0}
        events={chainEvents}
        onConfirm={handleChainEventConfirm}
        onSkip={handleChainEventSkip}
        onClose={handleChainModalClose}
      />

      {/* Role Selector Modal */}
      <RoleSelectorModal
        seatId={roleSelectSeat}
        currentScriptId={gameState.currentScriptId ?? 'tb'}
        onAssignRole={assignRole}
        onClose={() => setRoleSelectSeat(null)}
      />
    </div>
  );
};
