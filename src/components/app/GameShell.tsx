import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { GameState, User } from '../../types';
import { useStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { useDeathEcho } from '../../hooks/useDeathEcho';
import { useGhostlyVision } from '../game/GhostlyVisionOverlay';
import { useUpdateNotification } from '../../hooks/useUpdateNotification';
import UpdateNotificationUI from '../ui/UpdateNotificationUI';
import { ToastContainer, useToasts } from '../ui/Toast';
import { SCRIPTS, ROLES, Z_INDEX } from '../../constants';
import {
  LoadingFallback,
  GrimoireLoadingFallback,
  ControlsLoadingFallback
} from '../ui/LoadingFallback';

// Lazy components
const Grimoire = lazy(() => import('../game/Grimoire').then(m => ({ default: m.Grimoire })));
const ControlsStoryteller = lazy(() => import('../controls/Controls').then(m => ({ default: m.ControlsStoryteller })));
const ControlsPlayer = lazy(() => import('../controls/Controls').then(m => ({ default: m.ControlsPlayer })));

const PhaseIndicator = lazy(() => import('../game/PhaseIndicator').then(m => ({ default: m.PhaseIndicator })));
const WaitingArea = lazy(() => import('../game/WaitingArea').then(m => ({ default: m.WaitingArea })));
const FloatingVoteButton = lazy(() => import('../game/FloatingVoteButton').then(m => ({ default: m.FloatingVoteButton })));
const Confetti = lazy(() => import('../game/Confetti').then(m => ({ default: m.Confetti })));
const WelcomeAnnouncement = lazy(() => import('../game/WelcomeAnnouncement').then(m => ({ default: m.WelcomeAnnouncement })));

const RoleRevealModal = lazy(() => import('../game/RoleRevealModal').then(m => ({ default: m.RoleRevealModal })));
const SwapRequestModal = lazy(() => import('../game/SwapRequestModal').then(m => ({ default: m.SwapRequestModal })));
const TruthReveal = lazy(() => import('../game/TruthReveal').then(m => ({ default: m.TruthReveal })));
const RoleReferencePanel = lazy(() => import('../controls/RoleReferencePanel').then(m => ({ default: m.RoleReferencePanel })));
const RoleReferenceSidebar = lazy(() => import('../controls/RoleReferenceSidebar').then(m => ({ default: m.RoleReferenceSidebar })));
const AfterActionReportView = lazy(() => import('../history/AfterActionReportView').then(m => ({ default: m.AfterActionReportView })));

const DeathEchoEffect = lazy(() => import('../game/DeathEchoEffect').then(m => ({ default: m.DeathEchoEffect })));
const GhostlyVisionOverlay = lazy(() => import('../game/GhostlyVisionOverlay').then(m => ({ default: m.GhostlyVisionOverlay })));
const CorruptionOverlay = lazy(() => import('../game/CorruptionOverlay').then(m => ({ default: m.CorruptionOverlay })));
const AudioManager = lazy(() => import('../controls/AudioManager').then(m => ({ default: m.AudioManager })));

const getViewportMetrics = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width ?? window.innerWidth),
    height: Math.round(vv?.height ?? window.innerHeight)
  };
};

const useGameShellUIState = () => useStore(
  useShallow(state => ({
    isAudioBlocked: state.isAudioBlocked,
    roleReferenceMode: state.roleReferenceMode,
    isRolePanelOpen: state.isRolePanelOpen,
    isSidebarExpanded: state.isSidebarExpanded,
    isTruthRevealOpen: state.isTruthRevealOpen,
    isReportOpen: state.isReportOpen,
  }))
);

const useGameShellActions = () => useStore(
  useShallow(state => ({
    toggleAudioPlay: state.toggleAudioPlay,
    openRolePanel: state.openRolePanel,
    closeRolePanel: state.closeRolePanel,
    toggleSidebar: state.toggleSidebar,
    closeTruthReveal: state.closeTruthReveal,
    closeReport: state.closeReport,
  }))
);

interface GameShellProps {
  user: User;
  gameState: GameState;
  mode: 'storyteller' | 'player';
}

export const GameShell: React.FC<GameShellProps> = ({ user, gameState, mode }) => {
  const {
    isAudioBlocked,
    roleReferenceMode,
    isRolePanelOpen,
    isSidebarExpanded,
    isTruthRevealOpen,
    isReportOpen,
  } = useGameShellUIState();
  const {
    toggleAudioPlay,
    openRolePanel,
    closeRolePanel,
    toggleSidebar,
    closeTruthReveal,
    closeReport,
  } = useGameShellActions();

  const isStoryteller = mode === 'storyteller';
  const isObserver = !!user.isObserver;

  const { toasts, removeToast } = useToasts();
  const { updateAvailable, handleRefresh, handleDismiss } = useUpdateNotification();

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewportSize] = useState(() => getViewportMetrics());

  const { deathSeatId, playerName: deathPlayerName, triggerDeathEcho, clearDeathEcho } = useDeathEcho();
  const prevDeadSeatsRef = useRef<Set<number> | null>(null);

  const currentUserSeat = gameState.seats.find(s => s.userId === user?.id);
  const isCurrentUserDead = currentUserSeat?.isDead ?? false;
  useGhostlyVision(isCurrentUserDead && !isStoryteller);

  useEffect(() => {
    if (!gameState?.seats) return;

    const currentDeadSeats = new Set(
      gameState.seats.filter(s => s.isDead).map(s => s.id)
    );

    if (prevDeadSeatsRef.current === null) {
      prevDeadSeatsRef.current = currentDeadSeats;
      return;
    }

    const prevDeadSeats = prevDeadSeatsRef.current;
    currentDeadSeats.forEach(seatId => {
      if (!prevDeadSeats.has(seatId)) {
        const seat = gameState.seats.find(s => s.id === seatId);
        if (seat) {
          triggerDeathEcho(seatId, seat.userName);
        }
      }
    });

    prevDeadSeatsRef.current = currentDeadSeats;
  }, [gameState?.seats, triggerDeathEcho]);

  useEffect(() => {
    if (!containerRef.current) return;

    const measureAndSetDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(measureAndSetDimensions);
    }, 50);

    const observer = new ResizeObserver((entries) => {
      requestAnimationFrame(() => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          if (width > 10 && height > 10) {
            setDimensions({ width: Math.floor(width), height: Math.floor(height) });
          }
        }
      });
    });

    observer.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [gameState, viewportSize]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleManualAudioStart = () => {
    toggleAudioPlay();
    setTimeout(() => toggleAudioPlay(), 100);
  };

  const appHeight = viewportSize.height > 0 ? viewportSize.height : undefined;

  const aliveCount = gameState.seats.filter(s => !s.isDead && (s.userId ?? s.isVirtual)).length;
  const totalPlayers = gameState.seats.filter(s => s.userId ?? s.isVirtual).length;
  const deadCount = totalPlayers - aliveCount;

  let corruptionStage: 0 | 1 | 2 | 3 = 0;
  if (totalPlayers > 0) {
    if (aliveCount <= 3) corruptionStage = 3;
    else if (aliveCount <= 4) corruptionStage = 2;
    else if (deadCount >= Math.ceil(totalPlayers / 3)) corruptionStage = 1;
  }

  return (
    <div
      className="flex flex-col w-screen bg-stone-950 overflow-hidden relative font-serif"
      style={{
        minHeight: appHeight ? `${String(appHeight)}px` : '100vh',
        height: appHeight ? `${String(appHeight)}px` : '100vh'
      }}
    >
      <Suspense fallback={null}>
        <Confetti
          active={!!gameState.gameOver.winner}
          colors={gameState.gameOver.winner === 'GOOD'
            ? ['#3b82f6', '#fbbf24', '#60a5fa', '#f59e0b', '#ffffff']
            : ['#ef4444', '#a855f7', '#dc2626', '#7c3aed', '#000000']
          }
        />
        {mode === 'player' && <WelcomeAnnouncement />}
        <PhaseIndicator />
        <WaitingArea />
        <AudioManager />
      </Suspense>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <UpdateNotificationUI
        isOpen={updateAvailable}
        onRefresh={handleRefresh}
        onDismiss={handleDismiss}
      />

      <Suspense fallback={null}>
        <RoleRevealModal />
        <SwapRequestModal />
        <TruthReveal isOpen={isTruthRevealOpen} onClose={closeTruthReveal} />
        <AfterActionReportView isOpen={isReportOpen} onClose={closeReport} />
      </Suspense>

      <Suspense fallback={null}>
        <DeathEchoEffect
          deathSeatId={deathSeatId}
          playerName={deathPlayerName}
          onComplete={clearDeathEcho}
        />
      </Suspense>

      <Suspense fallback={null}>
        {isCurrentUserDead && !isStoryteller && (
          <GhostlyVisionOverlay
            isActive={true}
            playerName={currentUserSeat?.userName}
          />
        )}
        <CorruptionOverlay stage={corruptionStage} />
      </Suspense>

      <div className="absolute inset-0 pointer-events-none z-0 bg-cover bg-center transition-all duration-1000"
           style={{
             backgroundImage: 'url(/img/grimoire-bg.png)',
             opacity: 1
           }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        <div
          className="flex-1 relative flex items-center justify-center overflow-hidden"
          style={{ minHeight: 0, minWidth: 0 }}
          ref={containerRef}
        >
          {dimensions.width > 0 && dimensions.height > 0 ? (
            <Suspense fallback={<GrimoireLoadingFallback />}>
              <Grimoire width={dimensions.width} height={dimensions.height} readOnly={isObserver} />
            </Suspense>
          ) : (
            <GrimoireLoadingFallback />
          )}

          <div className="absolute bottom-6 left-6 z-0 text-stone-500 text-xs select-none pointer-events-none transition-opacity duration-500 font-cinzel opacity-60 md:opacity-40">
            {isStoryteller ? 'Right Click: Manage • Scroll: Zoom (Beta)' : (isObserver ? 'Spectating Mode' : 'Wait for the Storyteller...')}
          </div>

          {isAudioBlocked && gameState.audio.isPlaying && (
            <button
              onClick={handleManualAudioStart}
              className="absolute top-6 left-6 z-50 bg-amber-600/90 hover:bg-amber-500 text-white px-4 py-2 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-2 animate-pulse font-bold text-sm"
            >
              <span>🔊</span> 启用音效 (Enable Audio)
            </button>
          )}
        </div>

        {!isObserver && (
          <div
            className={`
                fixed md:relative inset-y-0 right-0
                w-80 max-w-[85vw] md:w-80 md:flex-shrink-0
                bg-stone-950 shadow-2xl
                transform transition-transform duration-300 ease-out
                ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
            `}
            style={{ zIndex: Z_INDEX.sidebar }}
          >
            <Suspense fallback={<ControlsLoadingFallback />}>
              {isStoryteller ? (
                <ControlsStoryteller onClose={() => setIsMobileMenuOpen(false)} />
              ) : (
                <ControlsPlayer onClose={() => setIsMobileMenuOpen(false)} />
              )}
            </Suspense>
          </div>
        )}
      </div>

      {!isMobileMenuOpen && !isObserver && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 bg-red-900/90 text-stone-200 p-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-red-800 hover:bg-red-800 active:scale-90 backdrop-blur-sm transition-all"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      <Suspense fallback={null}>
        {mode === 'player' && !isObserver && <FloatingVoteButton />}
      </Suspense>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 md:hidden backdrop-blur-[2px] transition-opacity duration-300"
          style={{ zIndex: Z_INDEX.sidebarBackdrop }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {(() => {
        const scriptDef = gameState.currentScriptId === 'custom'
          ? null
          : SCRIPTS[gameState.currentScriptId];

        const currentScript = (gameState.currentScriptId === 'custom'
          ? Object.values(gameState.customRoles)
          : (scriptDef?.roles ?? []).map(roleId => ROLES[roleId])
        ).filter((r): r is NonNullable<typeof r> => r !== undefined);

        const playerSeat = gameState.seats.find(s => s.userId === user.id);
        const playerRoleId = playerSeat?.seenRoleId ?? null;

        return (
          <Suspense fallback={null}>
            {roleReferenceMode === 'modal' && (
              <RoleReferencePanel
                isOpen={isRolePanelOpen}
                onClose={closeRolePanel}
                playerRoleId={playerRoleId}
                scriptRoles={currentScript}
              />
            )}

            {roleReferenceMode === 'sidebar' && window.innerWidth >= 768 && (
              <RoleReferenceSidebar
                isExpanded={isSidebarExpanded}
                onToggle={toggleSidebar}
                playerRoleId={playerRoleId}
                scriptRoles={currentScript}
              />
            )}
          </Suspense>
        );
      })()}

      <button
        onClick={() => roleReferenceMode === 'modal' ? openRolePanel() : toggleSidebar()}
        className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-30 bg-amber-900 hover:bg-amber-800 text-amber-200 p-3 md:p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        title="查看规则手册"
      >
        <span className="text-xl md:text-2xl">📖</span>
      </button>
    </div>
  );
};
