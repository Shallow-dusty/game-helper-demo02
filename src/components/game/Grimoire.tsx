import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../../store';
import { ROLES, STATUS_ICONS } from '../../constants';
import { Seat } from '../../types';
import { showWarning } from '../ui/Toast';
import { StorytellerMenu } from './StorytellerMenu';
import { ChainReactionModal } from './ChainReactionModal';
import { detectChainReactions, type ChainReactionEvent } from '../../lib/chainReaction';
import { useLongPress } from '../../hooks/useLongPress';
import { CandlelightOverlay } from './CandlelightOverlay';
import { DetectivePinboard } from './DetectivePinboard';
import { JudgmentZone } from './JudgmentZone';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, Activity, Mic, FileJson } from 'lucide-react';
import { Button } from '../ui/button';
import { ScriptImporter } from './ScriptImporter';

// P1 Components
import { CorruptionOverlay } from './CorruptionOverlay';
import { RoyalDecreeOverlay } from './RoyalDecreeOverlay';
import { DeadPerspective } from './DeadPerspective';
import { DawnAnimation } from './DawnAnimation';
import { BloodPactEffect } from './BloodPactEffect';
import { GameEndReveal } from './GameEndReveal';

// P2 Components
import { ConspiracyFog } from './ConspiracyFog';
import { LastEchoVisualizer } from './LastEchoVisualizer';
import { VitalSignsMonitor } from './VitalSignsMonitor';

// Assets (Placeholders until user provides them)
import lobbyBg from '../../assets/page1.jpeg'; 
import { useSoundEffect } from '../../hooks/useSoundEffect';

interface GrimoireProps {
  width: number;
  height: number;
  readOnly?: boolean;
  publicOnly?: boolean;
  gameState?: import('../../types').GameState;
  isStorytellerView?: boolean;
}

// Helper to convert polar to cartesian
const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
};

// --- Subcomponents ---

interface SeatNodeProps {
  seat: Seat;
  x: number;
  y: number;
  angle: number; // degrees
  scale: number;
  isST: boolean;
  isCurrentUser: boolean;
  onSeatClick: (e: any, seat: Seat) => void;
  onSeatLongPress: (e: any, seat: Seat) => void;
  onSeatContextMenu: (e: any, seat: Seat) => void;
  disableInteractions?: boolean;
  isSwapSource?: boolean;
  publicOnly?: boolean;
  rolesRevealed?: boolean;
  votingClockHandSeatId?: number | null;
  // P2 Props
  showVitalSigns?: boolean;
  isSpeaking?: boolean;
}

const SeatNode: React.FC<SeatNodeProps> = React.memo(({ 
  seat, x, y, angle: _angle, scale, isST, isCurrentUser, onSeatClick, onSeatLongPress, onSeatContextMenu, 
  disableInteractions, isSwapSource, publicOnly, rolesRevealed, votingClockHandSeatId,
  showVitalSigns, isSpeaking
}) => {
  // Wrap handlers to pass seat
  const handleClick = useCallback((e: any) => onSeatClick(e, seat), [onSeatClick, seat]);
  const handleLongPress = useCallback((e: any) => onSeatLongPress(e, seat), [onSeatLongPress, seat]);
  const handleContextMenu = useCallback((e: any) => onSeatContextMenu(e, seat), [onSeatContextMenu, seat]);

  const { isPressing, ...longPressHandlers } = useLongPress(handleLongPress, handleClick, { 
    delay: 500, 
    disabled: disableInteractions, 
    detectMouse: false 
  });

  const [isHovered, setIsHovered] = useState(false);

  // Visibility Logic
  const displayRoleId = isST 
    ? (seat.realRoleId || seat.seenRoleId) 
    : (isCurrentUser && rolesRevealed ? seat.seenRoleId : null);

  const showRole = !publicOnly && displayRoleId;
  const roleDef = showRole && displayRoleId ? ROLES[displayRoleId] : null;
  
  // Misled logic
  const isMisled = isST && seat.realRoleId && seat.seenRoleId && seat.realRoleId !== seat.seenRoleId;

  const isClockHand = votingClockHandSeatId === seat.id;

  // Determine Vital Status
  // CRITICAL: Only ST sees the true status (Poisoned/Drunk). Players see "ALIVE" unless dead.
  const isAbnormal = seat.statuses.includes('POISONED') || seat.statuses.includes('DRUNK');
  const vitalStatus = seat.isDead 
    ? 'DEAD' 
    : (isST && isAbnormal) 
      ? 'POISONED' 
      : 'ALIVE';

  // Styles
  const tokenSize = 70 * scale; // Diameter
  const fontSizeName = Math.max(10, 14 * scale);
  const fontSizeRole = Math.max(14, 20 * scale);
  
  // Roman Numeral
  const romanNumeral = useMemo(() => {
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
  }, [seat.id]);

  return (
    <div
      className="absolute flex flex-col items-center justify-center"
      style={{
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        width: tokenSize + 40 * scale, // Hitbox
        height: tokenSize + 100 * scale, // Increased height for P2 elements
        zIndex: 40, // Z-40 Interaction Layer
        pointerEvents: 'auto',
      }}
      {...longPressHandlers}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* P2: Last Echo Visualizer (Above Token) */}
      <div className="absolute -top-16 pointer-events-none">
         <LastEchoVisualizer isActive={!!isSpeaking} seatId={seat.id} />
      </div>

      {/* Roman Numeral (Above, slightly pushed up if speaking) */}
      <div 
        className="absolute -top-6 font-cinzel font-bold text-amber-900/80 drop-shadow-md pointer-events-none transition-all duration-300"
        style={{ fontSize: 12 * scale, opacity: isSpeaking ? 0 : 1 }}
      >
        {romanNumeral}
      </div>

      {/* Main Token Container */}
      <div className="relative" style={{ width: tokenSize, height: tokenSize }}>
        
        {/* Selection/Action Rings */}
        {isPressing && (
           <div className="absolute inset-[-8px] rounded-full border-4 border-amber-500/80 animate-spin-slow" style={{ borderTopColor: 'transparent' }} />
        )}
        {isSwapSource && (
           <div className="absolute inset-[-6px] rounded-full border-2 border-cyan-500 border-dashed animate-spin-slow" />
        )}
        {isClockHand && (
           <div className="absolute inset-[-4px] rounded-full border-4 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]" />
        )}

        {/* Avatar / Token Body */}
        <div 
          className={`w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${seat.isDead ? 'grayscale brightness-75' : ''} ${seat.isNominated ? 'animate-tremble' : ''}`}
          style={{
            background: seat.isDead 
              ? '#44403c' 
              : `radial-gradient(circle at 30% 30%, ${isCurrentUser ? '#fbbf24' : '#57534e'}, #1c1917)`,
            boxShadow: isCurrentUser ? '0 0 20px rgba(245, 158, 11, 0.4)' : '0 4px 10px rgba(0,0,0,0.5)',
            transform: seat.isDead ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          {/* Role Icon/Text */}
          {roleDef && (
            <div className="text-center z-10">
              <div 
                className="font-cinzel font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{ fontSize: fontSizeRole }}
              >
                {roleDef.name.substring(0, 2)}
              </div>
              {roleDef.icon && (
                <div className="absolute -bottom-1 -right-1 text-lg drop-shadow-md">
                  {roleDef.icon}
                </div>
              )}
            </div>
          )}

          {/* Virtual Player Icon */}
          {seat.isVirtual && (
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-xl">🤖</div>
          )}

          {/* Dead Indicator (Overlay) */}
          {seat.isDead && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
               {/* Placeholder for overlay_cracked.png */}
               <div className="w-full h-1 bg-red-600 rotate-45 absolute" />
               <div className="w-full h-1 bg-red-600 -rotate-45 absolute" />
            </div>
          )}
        </div>

        {/* Frame (Placeholder for seat_frame_iron.png) */}
        <div className="absolute inset-[-2px] rounded-full border-2 border-stone-600/50 pointer-events-none" />

        {/* Status Icons (Outer Ring) */}
        {isST && seat.statuses.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {seat.statuses.map((status, idx) => {
              const angle = (idx * 45 - 90) * (Math.PI / 180);
              const r = tokenSize / 2 + 15 * scale;
              const sx = (tokenSize / 2) + r * Math.cos(angle);
              const sy = (tokenSize / 2) + r * Math.sin(angle);
              return (
                <div 
                  key={status} 
                  className="absolute w-5 h-5 bg-black/80 rounded-full flex items-center justify-center text-xs border border-stone-600"
                  style={{ left: sx, top: sy, transform: 'translate(-50%, -50%)' }}
                >
                  {STATUS_ICONS[status]}
                </div>
              );
            })}
          </div>
        )}

        {/* Voting Hand */}
        {seat.isHandRaised && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-20 animate-bounce">
            ✋
          </div>
        )}
        
        {/* Ghost Vote */}
        {seat.isDead && (
          <div className={`absolute top-1 right-1 w-4 h-4 rounded-full border border-stone-800 shadow-sm ${seat.hasGhostVote ? 'bg-white' : 'bg-stone-700'}`}>
            {!seat.hasGhostVote && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-stone-400">×</span>}
          </div>
        )}
      </div>

      {/* Name Label */}
      <div 
        className="mt-2 px-2 py-0.5 bg-black/60 backdrop-blur-[2px] rounded text-stone-200 font-cinzel font-bold text-center shadow-md max-w-[120px] truncate"
        style={{ fontSize: fontSizeName }}
      >
        {seat.userName}
      </div>

      {/* P2: Vital Signs Monitor (Below Name) */}
      {showVitalSigns && (
         <div className="mt-1 transform scale-75 origin-top">
            <VitalSignsMonitor status={vitalStatus} />
         </div>
      )}

      {/* Hover Tooltip (Full Name) */}
      {isHovered && (
        <div className="absolute top-full mt-1 z-50 bg-black text-white text-xs px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none">
          {seat.userName}
        </div>
      )}
    </div>
  );
});

// --- Main Component ---

export const Grimoire: React.FC<GrimoireProps> = ({ width, height, readOnly = false, publicOnly = false, gameState: propsGameState, isStorytellerView: _isStorytellerView = false }) => {
  const storeGameState = useStore(state => state.gameState);
  const storeUser = useStore(state => state.user);
  const { playSound } = useSoundEffect();

  // Derived state
  const gameState = propsGameState || storeGameState;
  const user = storeUser;
  
  // Local UI State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; seatId: number } | null>(null);
  const [isLocked, setIsLocked] = useState(false); // Prevent accidental clicks
  const [swapSourceId, setSwapSourceId] = useState<number | null>(null);
  const [joiningId, setJoiningId] = useState<number | null>(null);
  
  // P1/P2/P3 UI State
  const [isCandlelightActive, setIsCandlelightActive] = useState(false);
  const [isDetectiveLayerActive, setIsDetectiveLayerActive] = useState(false);
  const [isDeadPerspectiveActive, setIsDeadPerspectiveActive] = useState(false);
  const [showConspiracyFog, setShowConspiracyFog] = useState(true);
  const [showVitalSigns, setShowVitalSigns] = useState(false);
  const [speakingSeatId, setSpeakingSeatId] = useState<number | null>(null);
  const [showScriptImporter, setShowScriptImporter] = useState(false);

  // FX State
  const [showRoyalDecree, setShowRoyalDecree] = useState(false);
  const [showDawn, setShowDawn] = useState(false);
  const [showBloodPact, setShowBloodPact] = useState(false);
  const [showGameEnd, setShowGameEnd] = useState(false);
  const [gameWinner, _setGameWinner] = useState<'GOOD' | 'EVIL'>('GOOD');

  // Chain Reaction State
  const [chainEvents, setChainEvents] = useState<ChainReactionEvent[]>([]);
  const [_pendingDeathSeatId, setPendingDeathSeatId] = useState<number | null>(null);

  // Actions
  const joinSeat = useStore(state => state.joinSeat);
  const requestSeatSwap = useStore(state => state.requestSeatSwap);
  const swapSeats = useStore(state => state.swapSeats);
  const toggleDead = useStore(state => state.toggleDead);
  const importScript = useStore(state => state.importScript);

  // Transform State (Zoom/Pan)
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // --- Handlers ---

  const handleImportScript = (data: any) => {
    importScript(JSON.stringify(data));
    setShowScriptImporter(false);
    playSound('paper_rustle');
    showWarning("Script imported successfully!");
  };

  // Seat Interaction
  const handleSeatClick = useCallback((e: any, seat: Seat) => {
    e.stopPropagation();
    if (readOnly || isLocked) return;

    playSound('token_select');

    if (seat.isVirtual && !user?.isStoryteller) {
      showWarning('该座位预留给虚拟玩家。');
      return;
    }

    // Storyteller Logic
    if (user?.isStoryteller) {
      if (swapSourceId !== null) {
        if (swapSourceId === seat.id) {
          setSwapSourceId(null);
          showWarning('交换已取消');
        } else {
          if (window.confirm(`确认交换座位 ${swapSourceId + 1} 和 ${seat.id + 1} 吗?`)) {
            swapSeats(swapSourceId, seat.id);
            setSwapSourceId(null);
            playSound('token_place');
          }
        }
        return;
      }
      if (seat.userId === null) {
        void joinSeat(seat.id);
        playSound('token_place');
      } else {
        // Open menu on click for ST (desktop)
        setContextMenu({ x: e.clientX, y: e.clientY, seatId: seat.id });
        playSound('scroll_open');
      }
    } else {
      // Player Logic
      if (seat.userId === null) {
        if (joiningId !== null) return;
        setJoiningId(seat.id);
        void joinSeat(seat.id).finally(() => setJoiningId(null));
        playSound('token_place');
        return;
      }
      if (user && seat.userId !== user.id) {
        if (window.confirm(`请求与 ${seat.userName} 交换座位?`)) {
          requestSeatSwap(seat.id);
        }
        return;
      }
    }
  }, [readOnly, isLocked, user?.isStoryteller, user?.id, swapSourceId, joiningId, playSound, joinSeat, swapSeats, requestSeatSwap]);

  const handleSeatLongPress = useCallback((_e: any, seat: Seat) => {
    if (user?.isStoryteller) {
      setContextMenu({ x: 0, y: 0, seatId: seat.id }); // Mobile menu
      playSound('scroll_open');
    }
  }, [user?.isStoryteller, playSound]);

  const handleSeatContextMenu = useCallback((e: any, seat: Seat) => {
    e.preventDefault();
    if (user?.isStoryteller) {
      setContextMenu({ x: e.clientX, y: e.clientY, seatId: seat.id });
      playSound('scroll_open');
    }
  }, [user?.isStoryteller, playSound]);

  // Chain Reaction Logic
  const handleToggleDeadWithChainCheck = useCallback((seatId: number) => {
    if (!gameState) return;
    const seat = gameState.seats[seatId];
    if (!seat) return;
    
    if (seat.isDead) {
      toggleDead(seatId);
      return;
    }
    
    const events = detectChainReactions(gameState, 'death', seatId);
    if (events.length > 0) {
      toggleDead(seatId);
      setPendingDeathSeatId(seatId);
      setChainEvents(events);
    } else {
      toggleDead(seatId);
    }
  }, [gameState, toggleDead]);

  const handleChainEventConfirm = useCallback((event: ChainReactionEvent) => {
    if (event.suggestedAction === 'mark_dead') {
      event.affectedSeatIds.forEach(id => toggleDead(id));
    } else if (event.suggestedAction === 'end_game') {
      const data = event.data as { winner: 'GOOD' | 'EVIL'; reason: string } | undefined;
      if (data) {
        useStore.getState().endGame(data.winner, data.reason);
      }
    }
    setChainEvents(prev => prev.slice(1));
    if (chainEvents.length <= 1) setPendingDeathSeatId(null);
  }, [chainEvents.length, toggleDead]);

  const handleChainEventSkip = useCallback(() => {
    setChainEvents(prev => prev.slice(1));
    if (chainEvents.length <= 1) setPendingDeathSeatId(null);
  }, [chainEvents.length]);


  // --- Touch Gesture Logic (Pinch-to-Zoom & Pan) ---
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      lastMousePos.current = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
    } else if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      if (t1 && t2) {
        isDragging.current = false; // Disable drag when pinching
        const p1 = { x: t1.clientX, y: t1.clientY };
        const p2 = { x: t2.clientX, y: t2.clientY };
        const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        lastMousePos.current = { x: dist, y: 0 }; // Store distance in x
      }
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging.current) {
      const dx = e.touches[0]!.clientX - lastMousePos.current.x;
      const dy = e.touches[0]!.clientY - lastMousePos.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
    } else if (e.touches.length === 2) {
      const t1 = e.touches ? e.touches[0] : null;
      const t2 = e.touches ? e.touches[1] : null;
      if (t1 && t2) {
        const p1 = { x: t1.clientX, y: t1.clientY };
        const p2 = { x: t2.clientX, y: t2.clientY };
        const newDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
        
        const oldDist = lastMousePos.current.x;
        const scaleFactor = newDist / oldDist;
        
        // Limit zoom speed
        const dampedScale = 1 + (scaleFactor - 1) * 0.5;
        
        setTransform(prev => {
          const newScale = Math.max(0.5, Math.min(3, prev.scale * dampedScale));
          return { ...prev, scale: newScale };
        });
        
        lastMousePos.current = { x: newDist, y: 0 };
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Mouse Wheel Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => {
      const newScale = Math.max(0.5, Math.min(3, prev.scale * scaleFactor));
      return { ...prev, scale: newScale };
    });
  }, []);

  // Mouse Drag (Pan)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only drag if middle mouse or space held (optional, for now just drag bg)
    if (e.button === 0) { // Left click
       isDragging.current = true;
       lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging.current) {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);


  // --- Render Prep ---

  if (!gameState || !user) return null;

  if (!gameState.seats || gameState.seats.length === 0) {
    return <div className="text-stone-400 text-center mt-20">正在加载魔典...</div>;
  }

  const seatCount = gameState.seats.length;
  // Dynamic layout calculation
  const minDim = Math.min(width, height);
  const baseRadius = Math.min(width, height) * 0.35;
  const scale = transform.scale * (minDim / 800); // Responsive base scale

  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-[#0c0a09] select-none touch-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* [Z-0] Environment Layer */}
      <div className="absolute inset-0 pointer-events-none">
        <img 
            src={lobbyBg} 
            alt="Table Background" 
            className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      </div>

      {/* [Z-1 to Z-7] Atmosphere Layer (Corruption) */}
      <CorruptionOverlay stage={gameState?.phase === 'NIGHT' ? 1 : 0} /> 

      {/* [Z-15] Conspiracy Fog (P2) */}
      {showConspiracyFog && (
        <ConspiracyFog width={width} height={height} intensity={0.6} />
      )}

      {/* [Z-95] Dead Perspective */}
      <DeadPerspective isActive={isDeadPerspectiveActive} />

      {/* Transform Container for the Board */}
      <div 
        className="absolute left-1/2 top-1/2 origin-center transition-transform duration-75 ease-out"
        style={{ 
          transform: `translate(-50%, -50%) translate(${transform.x}px, ${transform.y}px)` 
        }}
      >
        {/* [Z-20] Board Layer */}
        <div 
          className="relative rounded-full border-4 border-stone-800 bg-[#1c1917] shadow-2xl"
          style={{ width: baseRadius * 2.5, height: baseRadius * 2.5 }}
        >
           {/* Placeholder for clock_face_stone.png */}
           <div className="absolute inset-0 rounded-full opacity-30 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]" />
           <div className="absolute inset-0 rounded-full border border-stone-700/50" />
           
           {/* Roman Numerals (Static Decoration on Board) */}
           {[...Array(12)].map((_, i) => {
             const angle = (i * 30 - 90) * (Math.PI / 180);
             const r = baseRadius * 1.1;
             const x = (baseRadius * 1.25) + r * Math.cos(angle);
             const y = (baseRadius * 1.25) + r * Math.sin(angle);
             const romans = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
             return (
               <div 
                 key={i}
                 className="absolute font-cinzel text-stone-600 font-bold pointer-events-none"
                 style={{ left: x, top: y, transform: 'translate(-50%, -50%)', fontSize: 24 * scale }}
               >
                 {romans[i]}
               </div>
             );
           })}

           {/* Judgment Zone in Center */}
           <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <JudgmentZone width={baseRadius} height={baseRadius} />
           </div>
        </div>

        {/* [Z-40] Interaction Layer (Seats) */}
        {gameState.seats.map((seat, i) => {
          const angleDeg = (i * (360 / seatCount)) - 90;
          const pos = polarToCartesian(0, 0, baseRadius, angleDeg); 
          
          return (
            <SeatNode
              key={seat.id}
              seat={seat}
              x={pos.x} 
              y={pos.y}
              angle={angleDeg}
              scale={scale}
              isST={user.isStoryteller}
              isCurrentUser={user.id === seat.userId}
              onSeatClick={handleSeatClick}
              onSeatLongPress={handleSeatLongPress}
              onSeatContextMenu={handleSeatContextMenu}
              disableInteractions={readOnly || isLocked}
              isSwapSource={swapSourceId === seat.id}
              publicOnly={publicOnly}
              rolesRevealed={gameState.phase === 'GAME_OVER'} 
              votingClockHandSeatId={gameState.voting?.clockHandSeatId}
              // P2 Props
              showVitalSigns={showVitalSigns}
              isSpeaking={speakingSeatId === seat.id}
            />
          );
        })}
      </div>

      {/* [Z-80] Detective Layer (Manual) */}
      {isDetectiveLayerActive && (
        <div className="absolute inset-0 z-80 pointer-events-auto">
            <DetectivePinboard 
                width={width} 
                height={height} 
                enabled={true}
                roomId={gameState.roomId} 
            />
        </div>
      )}

      {/* [Z-90] Candlelight Layer */}
      <AnimatePresence>
        {isCandlelightActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[90] pointer-events-none"
          >
            <CandlelightOverlay 
               width={width} 
               height={height} 
               isActive={true} 
               isStoryteller={user.isStoryteller}
               gameState={gameState}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* [Z-150+] P1 Special Effects */}
      <RoyalDecreeOverlay 
          isOpen={showRoyalDecree} 
          onClose={() => setShowRoyalDecree(false)} 
          message="The King has declared that all executions are suspended for today!"
      />
      
      <DawnAnimation 
          isActive={showDawn} 
          onComplete={() => setShowDawn(false)} 
      />
      
      <BloodPactEffect 
          isActive={showBloodPact} 
          onComplete={() => setShowBloodPact(false)} 
      />
      
      <GameEndReveal 
          isOpen={showGameEnd} 
          gameState={gameState!} 
          winner={gameWinner} 
          onRestart={() => setShowGameEnd(false)} 
      />

      {/* [Z-200] UI Layer */}
      <div className="absolute top-0 left-0 right-0 z-[100] p-4 flex justify-between items-start pointer-events-none">
        {/* Top Left: Room Info */}
        <div className="pointer-events-auto bg-black/50 backdrop-blur px-4 py-2 rounded border border-stone-700">
           <h1 className="text-stone-200 font-cinzel font-bold">Room: {gameState.roomId}</h1>
        </div>

        {/* Top Right: Tools */}
        <div className="pointer-events-auto flex flex-col gap-2 items-end">
           <div className="flex gap-2">
                {user.isStoryteller && (
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsCandlelightActive(!isCandlelightActive)}
                    className={isCandlelightActive ? "bg-amber-900/50 border-amber-500 text-amber-200" : "bg-black/50 border-stone-700 text-stone-400"}
                >
                    {isCandlelightActive ? "🕯️ 熄灭烛光" : "🕯️ 烛光守夜"}
                </Button>
                )}
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsDetectiveLayerActive(!isDetectiveLayerActive)}
                    className={isDetectiveLayerActive ? "bg-red-900/50 border-red-500 text-red-200" : "bg-black/50 border-stone-700 text-stone-400"}
                >
                    {isDetectiveLayerActive ? "🕵️ 退出侦探" : "🕵️ 侦探模式"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setIsLocked(!isLocked)} className="bg-black/50 border-stone-700 text-stone-400">
                {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </Button>
           </div>
           
           {/* Debug/Demo Controls for P1 & P2 */}
           {user.isStoryteller && (
             <div className="bg-black/80 p-2 rounded flex flex-col gap-1 border border-stone-800">
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">FX Debug</span>
                <Button size="sm" variant="ghost" className="h-6 text-xs justify-start text-stone-400 hover:text-amber-400" onClick={() => setShowRoyalDecree(true)}>📜 Royal Decree</Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs justify-start text-stone-400 hover:text-amber-400" onClick={() => setShowDawn(true)}>☀️ Dawn</Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs justify-start text-stone-400 hover:text-red-400" onClick={() => setShowBloodPact(true)}>🩸 Blood Pact</Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs justify-start text-stone-400 hover:text-blue-400" onClick={() => setShowGameEnd(true)}>🏆 Game End</Button>
                <Button size="sm" variant="ghost" className="h-6 text-xs justify-start text-stone-400 hover:text-cyan-400" onClick={() => setIsDeadPerspectiveActive(!isDeadPerspectiveActive)}>👻 Dead View</Button>
                
                <div className="h-px bg-stone-800 my-1" />
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">P2 Interaction</span>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className={`h-6 text-xs justify-start ${showConspiracyFog ? 'text-stone-200' : 'text-stone-500'}`} 
                    onClick={() => setShowConspiracyFog(!showConspiracyFog)}
                >
                    🌫️ Fog
                </Button>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className={`h-6 text-xs justify-start ${showVitalSigns ? 'text-green-400' : 'text-stone-500'}`} 
                    onClick={() => setShowVitalSigns(!showVitalSigns)}
                >
                    <Activity className="w-3 h-3 mr-1" /> Vital Signs
                </Button>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className={`h-6 text-xs justify-start ${speakingSeatId !== null ? 'text-cyan-400' : 'text-stone-500'}`} 
                    onClick={() => setSpeakingSeatId(speakingSeatId === null ? 0 : null)}
                >
                    <Mic className="w-3 h-3 mr-1" /> Test Mic (Seat 1)
                </Button>

                <div className="h-px bg-stone-800 my-1" />
                <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider mb-1">P3 Automation</span>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 text-xs justify-start text-stone-400 hover:text-amber-400" 
                    onClick={() => setShowScriptImporter(true)}
                >
                    <FileJson className="w-3 h-3 mr-1" /> Import Script
                </Button>
             </div>
           )}
        </div>
      </div>

      {/* Modals */}
      {showScriptImporter && (
        <ScriptImporter 
          onImport={handleImportScript} 
          onCancel={() => setShowScriptImporter(false)} 
        />
      )}

      {contextMenu && (
        <StorytellerMenu
          seat={gameState.seats.find(s => s.id === contextMenu.seatId)!}
          onClose={() => setContextMenu(null)}
          actions={{
              toggleDead: (id) => handleToggleDeadWithChainCheck(id),
              toggleAbilityUsed: (_id) => {}, // Impl needed if used in menu
              toggleStatus: (_id, _status) => {}, // Impl needed
              addReminder: (_id, _text) => {}, // Impl needed
              removeReminder: (_id) => {}, // Impl needed
              removeVirtualPlayer: (_id) => {}, // Impl needed
              startVote: (_id) => {}, // Impl needed
              setRoleSelectSeat: (_id) => {}, // Impl needed
              setSwapSourceId: (_id) => {}, // Impl needed
              forceLeaveSeat: (_id) => {} // Impl needed
          }}
          currentScriptId="tb"
        />
      )}

      <ChainReactionModal
        isOpen={chainEvents.length > 0}
        events={chainEvents}
        onConfirm={handleChainEventConfirm}
        onSkip={handleChainEventSkip}
        onClose={() => setChainEvents([])}
      />
    </div>
  );
};

export default Grimoire;
