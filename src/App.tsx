
import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useStore } from './store';
import { useSandboxStore } from './sandboxStore';

// 加载状态组件 - 立即加载
import {
  LoadingFallback,
  GrimoireLoadingFallback,
  ControlsLoadingFallback
} from './components/ui/LoadingFallback';

// 核心组件 - 立即加载 (小型、关键路径)
import { Lobby } from './components/lobby/Lobby';
import { RoomSelection } from './components/lobby/RoomSelection';
import { ToastContainer, useToasts } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// 大型组件 - 懒加载
const Grimoire = lazy(() => import('./components/game/Grimoire').then(m => ({ default: m.Grimoire })));
const TownSquare = lazy(() => import('./components/game/TownSquare').then(m => ({ default: m.TownSquare })));
const Controls = lazy(() => import('./components/controls/Controls').then(m => ({ default: m.Controls })));
const SandboxView = lazy(() => import('./components/sandbox/SandboxView').then(m => ({ default: m.SandboxView })));

// 游戏视图组件 - 懒加载
const PhaseIndicator = lazy(() => import('./components/game/PhaseIndicator').then(m => ({ default: m.PhaseIndicator })));
const WaitingArea = lazy(() => import('./components/game/WaitingArea').then(m => ({ default: m.WaitingArea })));
const FloatingVoteButton = lazy(() => import('./components/game/FloatingVoteButton').then(m => ({ default: m.FloatingVoteButton })));
const Confetti = lazy(() => import('./components/game/Confetti').then(m => ({ default: m.Confetti })));
const WelcomeAnnouncement = lazy(() => import('./components/game/WelcomeAnnouncement').then(m => ({ default: m.WelcomeAnnouncement })));

// 模态框 - 懒加载
const RoleRevealModal = lazy(() => import('./components/game/RoleRevealModal').then(m => ({ default: m.RoleRevealModal })));
const SwapRequestModal = lazy(() => import('./components/game/SwapRequestModal').then(m => ({ default: m.SwapRequestModal })));
const TruthReveal = lazy(() => import('./components/game/TruthReveal').then(m => ({ default: m.TruthReveal })));
const RoleReferencePanel = lazy(() => import('./components/controls/RoleReferencePanel').then(m => ({ default: m.RoleReferencePanel })));
const RoleReferenceSidebar = lazy(() => import('./components/controls/RoleReferenceSidebar').then(m => ({ default: m.RoleReferenceSidebar })));
const AfterActionReportView = lazy(() => import('./components/history/AfterActionReportView').then(m => ({ default: m.AfterActionReportView })));

// 视觉效果 - 懒加载
const DeathEchoEffect = lazy(() => import('./components/game/DeathEchoEffect').then(m => ({ default: m.DeathEchoEffect })));
const GhostlyVisionOverlay = lazy(() => import('./components/game/GhostlyVisionOverlay').then(m => ({ default: m.GhostlyVisionOverlay })));
const CorruptionOverlay = lazy(() => import('./components/game/CorruptionOverlay').then(m => ({ default: m.CorruptionOverlay })));
const AudioManager = lazy(() => import('./components/controls/AudioManager').then(m => ({ default: m.AudioManager })));

// Hooks 从独立文件导入 (避免混合静态/动态导入)
import { useDeathEcho } from './hooks/useDeathEcho';
import { useGhostlyVision } from './components/game/GhostlyVisionOverlay';
import { useUpdateNotification } from './hooks/useUpdateNotification';
import UpdateNotificationUI from './components/ui/UpdateNotificationUI';

// Constants
import { SCRIPTS, ROLES, Z_INDEX } from './constants';

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

const App = () => {
  const user = useStore(state => state.user);
  const gameState = useStore(state => state.gameState);

  const isAudioBlocked = useStore(state => state.isAudioBlocked);
  const toggleAudioPlay = useStore(state => state.toggleAudioPlay);
  const roleReferenceMode = useStore(state => state.roleReferenceMode);
  const isRolePanelOpen = useStore(state => state.isRolePanelOpen);
  const isSidebarExpanded = useStore(state => state.isSidebarExpanded);
  const openRolePanel = useStore(state => state.openRolePanel);
  const closeRolePanel = useStore(state => state.closeRolePanel);
  const toggleSidebar = useStore(state => state.toggleSidebar);

  // Truth Reveal & Report modals
  const isTruthRevealOpen = useStore(state => state.isTruthRevealOpen);
  const closeTruthReveal = useStore(state => state.closeTruthReveal);
  const isReportOpen = useStore(state => state.isReportOpen);
  const closeReport = useStore(state => state.closeReport);

  // Sandbox mode
  const isSandboxActive = useSandboxStore(state => state.isActive);

  // Toast notifications
  const { toasts, removeToast } = useToasts();

  // Update notifications
  const { updateAvailable, handleRefresh, handleDismiss } = useUpdateNotification();

  // Responsive Grimoire Logic
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewportSize] = useState(() => getViewportMetrics());

  // 死亡效果状态
  const { deathSeatId, playerName: deathPlayerName, triggerDeathEcho, clearDeathEcho } = useDeathEcho();
  const prevDeadSeatsRef = useRef<Set<number> | null>(null); // null 表示未初始化

  // 当前用户是否死亡（用于亡者视界）
  const currentUserSeat = gameState?.seats.find(s => s.userId === user?.id);
  const isCurrentUserDead = currentUserSeat?.isDead ?? false;
  
  // 启用亡者视界滤镜（非说书人）
  useGhostlyVision(isCurrentUserDead && !user?.isStoryteller);

  // 监听死亡状态变化，触发死亡效果
  useEffect(() => {
    if (!gameState?.seats) return;
    
    const currentDeadSeats = new Set(
      gameState.seats.filter(s => s.isDead).map(s => s.id)
    );
    
    // 首次加载时，直接记录当前死者，不触发效果
    if (prevDeadSeatsRef.current === null) {
      prevDeadSeatsRef.current = currentDeadSeats;
      return;
    }
    
    // 检测新死亡的座位
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

  const handleManualAudioStart = () => {
    toggleAudioPlay();
    setTimeout(() => toggleAudioPlay(), 100);
  };


  useEffect(() => {
    if (gameState) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return undefined;
  }, [gameState]);

  // 0. Town Square Mode (Public View)
  if (window.location.pathname === '/townsquare' || window.location.search.includes('mode=townsquare')) {
    return (
      <Suspense fallback={<LoadingFallback fullScreen message="加载广场视图..." />}>
        <TownSquare />
      </Suspense>
    );
  }

  // 1. Not Logged In -> Lobby
  if (!user) {
    return <Lobby />;
  }

  // 1.5. Sandbox Mode Active -> Sandbox View
  if (isSandboxActive) {
    return (
      <Suspense fallback={<LoadingFallback fullScreen message="加载沙盒模式..." />}>
        <SandboxView />
      </Suspense>
    );
  }

  // 2. Logged In but No Game (No Room ID or Sync failed) -> Room Selection
  if (!gameState) {
    return <RoomSelection />;
  }

  // 3. In Game -> Grimoire

  const appHeight = viewportSize.height > 0 ? viewportSize.height : undefined;

  // Corruption Logic - 腐蚀阶段计算 (根据死亡比例)
  const aliveCount = gameState.seats.filter(s => !s.isDead && (s.userId ?? s.isVirtual)).length;
  const totalPlayers = gameState.seats.filter(s => s.userId ?? s.isVirtual).length;
  const deadCount = totalPlayers - aliveCount;
  
  let corruptionStage: 0 | 1 | 2 | 3 = 0;
  if (totalPlayers > 0) {
      // Stage 1: 死亡 1/3 玩家
      // Stage 2: ≤4人存活
      // Stage 3: 决战 (≤3人)
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
      {/* 核心 UI - 使用 Suspense 包裹懒加载组件 */}
      <Suspense fallback={null}>
        <Confetti
          active={!!gameState.gameOver.winner}
          colors={gameState.gameOver.winner === 'GOOD'
            ? ['#3b82f6', '#fbbf24', '#60a5fa', '#f59e0b', '#ffffff']
            : ['#ef4444', '#a855f7', '#dc2626', '#7c3aed', '#000000']
          }
        />
        <WelcomeAnnouncement />
        <PhaseIndicator />
        <WaitingArea />
        <AudioManager />
      </Suspense>

      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Update Notification */}
      <UpdateNotificationUI
        isOpen={updateAvailable}
        onRefresh={handleRefresh}
        onDismiss={handleDismiss}
      />

      {/* 模态框 - 按需加载 */}
      <Suspense fallback={null}>
        <RoleRevealModal />
        <SwapRequestModal />
        <TruthReveal isOpen={isTruthRevealOpen} onClose={closeTruthReveal} />
        <AfterActionReportView isOpen={isReportOpen} onClose={closeReport} />
      </Suspense>

      {/* v2.0 "最后的回响" - 死亡视觉/音效反馈 */}
      <Suspense fallback={null}>
        <DeathEchoEffect 
          deathSeatId={deathSeatId} 
          playerName={deathPlayerName}
          onComplete={clearDeathEcho}
        />
      </Suspense>

      {/* v2.0 "亡者视界" - 死亡玩家视觉滤镜 */}
      <Suspense fallback={null}>
        {isCurrentUserDead && !user.isStoryteller && (
          <GhostlyVisionOverlay 
            isActive={true} 
            playerName={currentUserSeat?.userName}
          />
        )}

        {/* 腐化效果背景 - 随存活人数变化 */}
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
              <Grimoire width={dimensions.width} height={dimensions.height} readOnly={user.isObserver} />
            </Suspense>
          ) : (
            <GrimoireLoadingFallback />
          )}

          <div className="absolute bottom-6 left-6 z-0 text-stone-500 text-xs select-none pointer-events-none transition-opacity duration-500 font-cinzel opacity-60 md:opacity-40">
            {user.isStoryteller ? 'Right Click: Manage • Scroll: Zoom (Beta)' : (user.isObserver ? 'Spectating Mode' : 'Wait for the Storyteller...')}
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

        {!user.isObserver && (
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
              <Controls onClose={() => setIsMobileMenuOpen(false)} />
            </Suspense>
          </div>
        )}
      </div>

      {!isMobileMenuOpen && !user.isObserver && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 bg-red-900/90 text-stone-200 p-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-red-800 hover:bg-red-800 active:scale-90 backdrop-blur-sm transition-all"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      <Suspense fallback={null}>
        {!user.isObserver && <FloatingVoteButton />}
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

const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;