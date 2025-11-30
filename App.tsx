import { useEffect, useState, useRef } from 'react';
import { useStore } from './store';
import { useSandboxStore } from './sandboxStore';
import { Lobby } from './components/Lobby';
import { RoomSelection } from './components/RoomSelection';
import { Grimoire } from './components/Grimoire';
import { Controls } from './components/Controls';
import { AudioManager } from './components/AudioManager';
import { RoleReferencePanel } from './components/RoleReferencePanel';
import { RoleReferenceSidebar } from './components/RoleReferenceSidebar';
import { FloatingVoteButton } from './components/FloatingVoteButton';
import { SCRIPTS, ROLES, Z_INDEX } from './constants';
import { PhaseIndicator } from './components/PhaseIndicator';
import { WaitingArea } from './components/WaitingArea';
import { ToastContainer, useToasts } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';
import { WelcomeAnnouncement } from './components/WelcomeAnnouncement';
import { RoleRevealModal } from './components/RoleRevealModal';

import { SandboxView } from './components/SandboxView';
import { TownSquare } from './components/TownSquare';
import { SwapRequestModal } from './components/SwapRequestModal';
import { Confetti } from './components/Confetti';

const getViewportMetrics = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  const vv = window.visualViewport;
  return {
    width: Math.round(vv?.width || window.innerWidth),
    height: Math.round(vv?.height || window.innerHeight)
  };
};

const App = () => {
  const user = useStore(state => state.user);
  const gameState = useStore(state => state.gameState);
  const sync = useStore(state => state.sync);
  const isAudioBlocked = useStore(state => state.isAudioBlocked);
  const toggleAudioPlay = useStore(state => state.toggleAudioPlay);
  const roleReferenceMode = useStore(state => state.roleReferenceMode);
  const isRolePanelOpen = useStore(state => state.isRolePanelOpen);
  const isSidebarExpanded = useStore(state => state.isSidebarExpanded);
  const openRolePanel = useStore(state => state.openRolePanel);
  const closeRolePanel = useStore(state => state.closeRolePanel);
  const toggleSidebar = useStore(state => state.toggleSidebar);

  // Sandbox mode
  const isSandboxActive = useSandboxStore(state => state.isActive);

  // Toast notifications
  const { toasts, removeToast } = useToasts();

  // Responsive Grimoire Logic
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState(() => getViewportMetrics());

  useEffect(() => {
    // Initial sync
    sync();
  }, [sync]);

  // Track actual viewport size (accounts for mobile browser UI chrome)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateViewport = () => {
      const next = getViewportMetrics();
      setViewportSize(next);
      document.documentElement.style.setProperty('--app-height', `${next.height}px`);
    };

    updateViewport();

    const handleResize = () => updateViewport();
    const handleOrientation = () => updateViewport();
    const vv = window.visualViewport;

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientation);
    vv?.addEventListener('resize', handleResize);
    vv?.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientation);
      vv?.removeEventListener('resize', handleResize);
      vv?.removeEventListener('scroll', handleResize);
    };
  }, []);

  // Separate effect for ResizeObserver
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
    return <TownSquare />;
  }

  // 1. Not Logged In -> Lobby
  if (!user) {
    return <Lobby />;
  }

  // 1.5. Sandbox Mode Active -> Sandbox View
  if (isSandboxActive) {
    return <SandboxView />;
  }

  // 2. Logged In but No Game (No Room ID or Sync failed) -> Room Selection
  if (!gameState) {
    return <RoomSelection />;
  }

  // 3. In Game -> Grimoire
  const isNight = gameState?.phase === 'NIGHT';
  const appHeight = viewportSize.height > 0 ? viewportSize.height : undefined;

  return (
    <div
      className="flex flex-col w-screen bg-stone-950 overflow-hidden relative font-serif"
      style={{
        minHeight: appHeight ? `${appHeight}px` : '100vh',
        height: appHeight ? `${appHeight}px` : '100vh'
      }}
    >
      <Confetti
        active={!!gameState?.gameOver?.winner}
        colors={gameState?.gameOver?.winner === 'GOOD'
          ? ['#3b82f6', '#fbbf24', '#60a5fa', '#f59e0b', '#ffffff']
          : ['#ef4444', '#a855f7', '#dc2626', '#7c3aed', '#000000']
        }
      />

      <WelcomeAnnouncement />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <RoleRevealModal />
      <PhaseIndicator />
      <WaitingArea />
      <AudioManager />
      <SwapRequestModal />

      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
      <div
        className={`absolute inset-0 z-0 pointer-events-none transition-all duration-[2000ms] ease-in-out ${isNight ? 'bg-blue-950/60 mix-blend-multiply backdrop-brightness-[0.4] backdrop-blur-[1px]' : 'bg-transparent backdrop-brightness-100'}`}
      ></div>
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]"></div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative min-h-0">
        <div
          className="flex-1 relative flex items-center justify-center overflow-hidden"
          style={{ minHeight: 0, minWidth: 0 }}
          ref={containerRef}
        >
          {dimensions.width > 0 && dimensions.height > 0 ? (
            <Grimoire width={dimensions.width} height={dimensions.height} readOnly={user.isObserver} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-stone-500">
              <div className="w-12 h-12 border-4 border-stone-700 border-t-amber-500 rounded-full animate-spin"></div>
              <span className="text-sm font-cinzel">正在加载魔典...</span>
            </div>
          )}

          <div className="absolute bottom-6 left-6 z-0 text-stone-500 text-xs select-none pointer-events-none transition-opacity duration-500 font-cinzel opacity-60 md:opacity-40">
            {user.isStoryteller ? 'Right Click: Manage • Scroll: Zoom (Beta)' : (user.isObserver ? 'Spectating Mode' : 'Wait for the Storyteller...')}
          </div>

          {isAudioBlocked && gameState?.audio.isPlaying && (
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
            <Controls onClose={() => setIsMobileMenuOpen(false)} />
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

      {!user.isObserver && <FloatingVoteButton />}

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 md:hidden backdrop-blur-[2px] transition-opacity duration-300"
          style={{ zIndex: Z_INDEX.sidebarBackdrop }}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {gameState && (() => {
        const scriptDef = gameState.currentScriptId === 'custom'
          ? null
          : SCRIPTS[gameState.currentScriptId];

        const currentScript = (gameState.currentScriptId === 'custom'
          ? Object.values(gameState.customRoles)
          : (scriptDef?.roles || []).map(roleId => ROLES[roleId])
        ).filter((r): r is NonNullable<typeof r> => r !== undefined);

        const playerSeat = gameState.seats.find(s => s.userId === user.id);
        const playerRoleId = playerSeat?.roleId || null;

        return (
          <>
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
          </>
        );
      })()}

      {gameState && (
        <button
          onClick={() => roleReferenceMode === 'modal' ? openRolePanel() : toggleSidebar()}
          className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-30 bg-amber-900 hover:bg-amber-800 text-amber-200 p-3 md:p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
          title="查看规则手册"
        >
          <span className="text-xl md:text-2xl">📖</span>
        </button>
      )}
    </div>
  );
};

const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;