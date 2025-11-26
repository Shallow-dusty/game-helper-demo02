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

  // Responsive Grimoire Logic
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Initial sync
    sync();

    // Resize Observer for precise container measurement
    if (!containerRef.current) return;

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
  }, [sync, user]);

  const handleManualAudioStart = () => {
    // Just toggling it (or re-triggering it) usually helps unlock the audio context
    // The user interaction event here is key.
    toggleAudioPlay();
    // Force a retry effectively by toggling off and on again if needed, 
    // but usually just interacting with the page unlocks the AudioContext for the existing elements.
    setTimeout(() => toggleAudioPlay(), 100);
  };

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

      {/* Phase Indicator */}
      <PhaseIndicator />

      {/* Waiting Area Overlay */}
      <WaitingArea />

      {/* Audio Manager */}
      <AudioManager />

      {/* --- Atmosphere Overlays --- */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
      <div
        className={`absolute inset-0 z-10 pointer-events-none transition-all duration-[2000ms] ease-in-out ${isNight ? 'bg-blue-950/60 mix-blend-multiply backdrop-brightness-[0.4] backdrop-blur-[1px]' : 'bg-transparent backdrop-brightness-100'}`}
      ></div>
      <div className="absolute inset-0 z-20 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]"></div>

      {/* Main Game Area (Grimoire) */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 min-w-0 overflow-hidden z-0" ref={containerRef}>
        {dimensions.width > 0 && dimensions.height > 0 && (
          <Grimoire width={dimensions.width} height={dimensions.height} />
        )}

        {/* Floating Helper Text */}
        <div className="absolute bottom-6 left-6 z-0 text-stone-500 text-xs select-none pointer-events-none transition-opacity duration-500 font-cinzel opacity-60 md:opacity-40">
          {user.isStoryteller ? 'Right Click: Manage • Scroll: Zoom (Beta)' : 'Wait for the Storyteller...'}
        </div>

        {/* Mobile Menu Toggle */}
        {!isMobileMenuOpen && (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden absolute bottom-6 right-6 z-30 bg-red-900/90 text-stone-200 p-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-red-800 hover:bg-red-800 active:scale-90 backdrop-blur-sm transition-all"
          >
            <span className="text-xl">☰</span>
          </button>
        )}

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
          className="fixed bottom-6 left-6 z-30 bg-amber-900 hover:bg-amber-800 text-amber-200 p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
          title="查看规则手册"
        >
          <span className="text-2xl">📖</span>
        </button>
      )}
    </div>
  );
};

export default App;