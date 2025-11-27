import React, { useEffect, useState, useRef } from 'react';
import { useStore } from './store';
import { Lobby } from './components/Lobby';
import { RoomSelection } from './components/RoomSelection';
import { Grimoire } from './components/Grimoire';
import { Controls } from './components/Controls';
import { AudioManager } from './components/AudioManager';
import { RoleReferencePanel } from './components/RoleReferencePanel';
import { RoleReferenceSidebar } from './components/RoleReferenceSidebar';
import { SCRIPTS, ROLES } from './constants';
import { PhaseIndicator } from './components/PhaseIndicator';
import { WaitingArea } from './components/WaitingArea';
import { NotificationSystem } from './components/NotificationSystem';
import { ToastContainer, useToasts } from './components/Toast';
import { ErrorBoundary } from './components/ErrorBoundary';

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
  
  // Toast notifications
  const { toasts, removeToast } = useToasts();

  // Responsive Grimoire Logic
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial sync
    sync();
  }, [sync]);

  // Separate effect for ResizeObserver - 确保在 DOM 更新后正确测量
  useEffect(() => {
    if (!containerRef.current) return;

    // 立即测量一次，确保初始尺寸正确
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      setDimensions({ width: rect.width, height: rect.height });
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height
        });
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [gameState]); // 当 gameState 变化时重新设置 observer

  const handleManualAudioStart = () => {
    // Just toggling it (or re-triggering it) usually helps unlock the audio context
    // The user interaction event here is key.
    toggleAudioPlay();
    // Force a retry effectively by toggling off and on again if needed, 
    // but usually just interacting with the page unlocks the AudioContext for the existing elements.
    setTimeout(() => toggleAudioPlay(), 100);
  };

  // 游戏内阻止 body 滚动 - 必须在条件返回之前调用
  useEffect(() => {
    if (gameState) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [gameState]);

  // 1. Not Logged In -> Lobby
  if (!user) {
    return <Lobby />;
  }

  // 2. Logged In but No Game (No Room ID or Sync failed) -> Room Selection
  if (!gameState) {
    return <RoomSelection />;
  }

  // 3. In Game -> Grimoire
  const isNight = gameState?.phase === 'NIGHT';

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-screen bg-stone-950 overflow-y-auto md:overflow-hidden relative font-serif pt-16">

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Phase Indicator */}
      <PhaseIndicator />

      {/* Waiting Area Overlay */}
      <WaitingArea />

      {/* Audio Manager */}
      <AudioManager />

      {/* --- Atmosphere Overlays --- */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
      <div
        className={`absolute inset-0 z-0 pointer-events-none transition-all duration-[2000ms] ease-in-out ${isNight ? 'bg-blue-950/60 mix-blend-multiply backdrop-brightness-[0.4] backdrop-blur-[1px]' : 'bg-transparent backdrop-brightness-100'}`}
      ></div>
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]"></div>

      {/* Main Game Area (Grimoire) */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 min-w-0 overflow-hidden z-10" ref={containerRef}>
        {dimensions.width > 0 && dimensions.height > 0 ? (
          <Grimoire width={dimensions.width} height={dimensions.height} />
        ) : (
          /* Loading state - 移动端创建房间后的临时加载状态 */
          <div className="flex flex-col items-center justify-center gap-4 text-stone-500">
            <div className="w-12 h-12 border-4 border-stone-700 border-t-amber-500 rounded-full animate-spin"></div>
            <span className="text-sm font-cinzel">正在加载魔典...</span>
          </div>
        )}

        {/* Floating Helper Text */}
        <div className="absolute bottom-6 left-6 z-0 text-stone-500 text-xs select-none pointer-events-none transition-opacity duration-500 font-cinzel opacity-60 md:opacity-40">
          {user.isStoryteller ? 'Right Click: Manage • Scroll: Zoom (Beta)' : 'Wait for the Storyteller...'}
        </div>

        {/* Mobile Menu Toggle - 移到容器外部确保始终可见 */}
        {/* Audio Unblock Button (Only shows if browser blocked autoplay) */}
        {isAudioBlocked && gameState?.audio.isPlaying && (
          <button
            onClick={handleManualAudioStart}
            className="absolute top-6 left-6 z-50 bg-amber-600/90 hover:bg-amber-500 text-white px-4 py-2 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.5)] flex items-center gap-2 animate-pulse font-bold text-sm"
          >
            <span>🔊</span> 启用音效 (Enable Audio)
          </button>
        )}
      </div>
      
      {/* Mobile Menu Toggle - 移到主容器外部，确保在加载时也可见 */}
      {!isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 bg-red-900/90 text-stone-200 p-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-red-800 hover:bg-red-800 active:scale-90 backdrop-blur-sm transition-all"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      {/* Sidebar Controls */}
      <div
        className={`
            fixed md:relative inset-y-0 right-0 z-40
            w-80 max-w-[85vw] md:w-80 md:flex-shrink-0
            bg-stone-950 shadow-2xl
            transform transition-transform duration-300 ease-out
            ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
        `}
      >
        <Controls onClose={() => setIsMobileMenuOpen(false)} />
      </div>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Role Reference Components */}
      {gameState && (() => {
        const scriptDef = gameState.currentScriptId === 'custom'
          ? null
          : SCRIPTS[gameState.currentScriptId];

        const currentScript = gameState.currentScriptId === 'custom'
          ? Object.values(gameState.customRoles)
          : (scriptDef?.roles || []).map(roleId => ROLES[roleId]).filter(Boolean);

        const playerSeat = gameState.seats.find(s => s.userId === user.id);
        const playerRoleId = playerSeat?.roleId || null;

        return (
          <>
            {/* Modal Mode */}
            {roleReferenceMode === 'modal' && (
              <RoleReferencePanel
                isOpen={isRolePanelOpen}
                onClose={closeRolePanel}
                playerRoleId={playerRoleId}
                scriptRoles={currentScript}
              />
            )}

            {/* Sidebar Mode (Desktop only) */}
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

      {/* Role Handbook Button (Floating Action Button) */}
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

// 包装 ErrorBoundary 的导出
const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;