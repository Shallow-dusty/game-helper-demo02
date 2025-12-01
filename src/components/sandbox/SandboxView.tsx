import React, { useState, useRef, useEffect } from 'react';
import { useSandboxStore } from '../../sandboxStore';
import { ToastContainer, useToasts } from '../ui/Toast';
import { RoleReferencePanel } from '../controls/RoleReferencePanel';
import { SCRIPTS, ROLES } from '../../constants';
import { RoleDef } from '../../types';

/**
 * 沙盒模式视图
 * 使用沙盒 store，完全离线运行
 */
export const SandboxView: React.FC = () => {
  const gameState = useSandboxStore(state => state.gameState);
  const exitSandbox = useSandboxStore(state => state.exitSandbox);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRolePanelOpen, setIsRolePanelOpen] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  
  const { toasts, removeToast } = useToasts();

  // Track viewport
  useEffect(() => {
    const updateViewport = () => {
      const vv = window.visualViewport;
      setViewportSize({
        width: Math.round(vv?.width || window.innerWidth),
        height: Math.round(vv?.height || window.innerHeight)
      });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener('resize', updateViewport);
    
    return () => {
      window.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener('resize', updateViewport);
    };
  }, []);

  // Measure container
  useEffect(() => {
    if (!containerRef.current) return;

    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        setDimensions({ width: Math.floor(rect.width), height: Math.floor(rect.height) });
      }
    };

    const timeoutId = setTimeout(() => requestAnimationFrame(measure), 50);

    const observer = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    observer.observe(containerRef.current);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [gameState, viewportSize]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-screen bg-stone-950 text-stone-400">
        <p>沙盒模式未初始化</p>
      </div>
    );
  }

  const isNight = gameState.phase === 'NIGHT';
  const appHeight = viewportSize.height > 0 ? viewportSize.height : undefined;

  // Get script roles for reference panel
  const scriptDef = gameState.currentScriptId === 'custom'
    ? null
    : SCRIPTS[gameState.currentScriptId];
  const currentScript: RoleDef[] = gameState.currentScriptId === 'custom'
    ? Object.values(gameState.customRoles || {})
    : (scriptDef?.roles || []).map(roleId => ROLES[roleId]).filter((r): r is RoleDef => !!r);

  return (
    <div
      className="flex flex-col w-screen bg-stone-950 overflow-hidden relative font-serif"
      style={{
        minHeight: appHeight ? `${appHeight}px` : '100vh',
        height: appHeight ? `${appHeight}px` : '100vh'
      }}
    >
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Sandbox Mode Banner */}
      <div className="bg-emerald-900/80 border-b border-emerald-700 px-4 py-2 flex items-center justify-between z-50">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧪</span>
          <span className="text-emerald-200 font-bold font-cinzel">沙盒模式</span>
          <span className="text-emerald-400/70 text-sm hidden sm:inline">本地练习 • 数据不保存</span>
        </div>
        <button
          onClick={exitSandbox}
          className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 text-sm rounded border border-emerald-600 transition-colors"
        >
          退出沙盒
        </button>
      </div>

      {/* Phase Indicator - Custom for sandbox */}
      <SandboxPhaseIndicator />

      {/* Atmosphere Overlays */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] z-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')]"></div>
      <div
        className={`absolute inset-0 z-0 pointer-events-none transition-all duration-[2000ms] ease-in-out ${isNight ? 'bg-blue-950/60 mix-blend-multiply backdrop-brightness-[0.4] backdrop-blur-[1px]' : 'bg-transparent backdrop-brightness-100'}`}
      ></div>
      <div className="absolute inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.7)_100%)]"></div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10 min-h-0">
        
        {/* Grimoire Area */}
        <div 
          className="flex-1 relative flex items-center justify-center overflow-hidden"
          style={{ minHeight: 0, minWidth: 0 }}
          ref={containerRef}
        >
          {dimensions.width > 0 && dimensions.height > 0 ? (
            <SandboxGrimoire width={dimensions.width} height={dimensions.height} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-stone-500">
              <div className="w-12 h-12 border-4 border-stone-700 border-t-emerald-500 rounded-full animate-spin"></div>
              <span className="text-sm font-cinzel">正在加载沙盒...</span>
            </div>
          )}

          {/* Helper Text */}
          <div className="absolute bottom-6 left-6 z-0 text-stone-500 text-xs select-none pointer-events-none font-cinzel opacity-60">
            沙盒模式 • 右键管理座位 • 滚轮缩放
          </div>
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
          <SandboxControls onClose={() => setIsMobileMenuOpen(false)} />
        </div>
      </div>

      {/* Mobile Menu Toggle */}
      {!isMobileMenuOpen && (
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="md:hidden fixed bottom-6 right-6 z-50 bg-emerald-900/90 text-emerald-200 p-4 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-emerald-800 hover:bg-emerald-800 active:scale-90 backdrop-blur-sm transition-all"
          style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        >
          <span className="text-xl">☰</span>
        </button>
      )}

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-30 md:hidden backdrop-blur-[2px] transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Role Reference Panel */}
      <RoleReferencePanel
        isOpen={isRolePanelOpen}
        onClose={() => setIsRolePanelOpen(false)}
        playerRoleId={null}
        scriptRoles={currentScript}
      />

      {/* Role Handbook Button */}
      <button
        onClick={() => setIsRolePanelOpen(true)}
        className="fixed bottom-20 md:bottom-6 left-4 md:left-6 z-30 bg-emerald-900 hover:bg-emerald-800 text-emerald-200 p-3 md:p-4 rounded-full shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
        title="查看规则手册"
      >
        <span className="text-xl md:text-2xl">📖</span>
      </button>
    </div>
  );
};

/**
 * 沙盒模式的 Phase Indicator
 */
const SandboxPhaseIndicator: React.FC = () => {
  const gameState = useSandboxStore(state => state.gameState);
  const setPhase = useSandboxStore(state => state.setPhase);
  
  if (!gameState) return null;

  const PHASE_LABELS: Record<string, string> = {
    'SETUP': '🔧 准备阶段',
    'DAY': '☀️ 白天',
    'NOMINATION': '🗳️ 提名阶段',
    'NIGHT': '🌙 夜晚',
    'FINAL_DAY': '⚔️ 决战日'
  };

  const phaseColors: Record<string, string> = {
    'SETUP': 'bg-stone-700 text-stone-300',
    'DAY': 'bg-amber-800 text-amber-200',
    'NOMINATION': 'bg-orange-800 text-orange-200',
    'NIGHT': 'bg-indigo-900 text-indigo-200',
    'FINAL_DAY': 'bg-red-900 text-red-200'
  };

  return (
    <div className={`${phaseColors[gameState.phase] || 'bg-stone-800 text-stone-300'} px-4 py-2 flex items-center justify-between`}>
      <span className="font-cinzel font-bold text-sm">
        {PHASE_LABELS[gameState.phase] || gameState.phase}
      </span>
      
      {/* Quick phase switcher for sandbox */}
      <div className="flex gap-1">
        {(['SETUP', 'DAY', 'NOMINATION', 'NIGHT'] as const).map(phase => (
          <button
            key={phase}
            onClick={() => setPhase(phase)}
            className={`px-2 py-0.5 text-xs rounded transition-colors ${
              gameState.phase === phase 
                ? 'bg-white/20 font-bold' 
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {phase === 'SETUP' ? '准备' : 
             phase === 'DAY' ? '白天' : 
             phase === 'NOMINATION' ? '提名' : '夜晚'}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * 沙盒模式的 Grimoire
 * 复用主 Grimoire 组件但使用沙盒 store 数据
 */
const SandboxGrimoire: React.FC<{ width: number; height: number }> = ({ width, height }) => {
  const gameState = useSandboxStore(state => state.gameState);
  const toggleDead = useSandboxStore(state => state.toggleDead);
  
  if (!gameState) return null;

  return (
    <div 
      className="relative bg-stone-900/50 rounded-lg border border-stone-700"
      style={{ width: width * 0.9, height: height * 0.9 }}
    >
      {/* Simplified grimoire visualization for sandbox */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative" style={{ width: Math.min(width, height) * 0.8, height: Math.min(width, height) * 0.8 }}>
          {/* Circular arrangement of seats */}
          {gameState.seats.map((seat, index) => {
            const angle = (index / gameState.seats.length) * 2 * Math.PI - Math.PI / 2;
            const radius = Math.min(width, height) * 0.35;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            
            return (
              <div
                key={seat.id}
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 md:w-16 md:h-16 rounded-full border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-110 active:scale-95 ${
                  seat.isDead 
                    ? 'bg-stone-800/80 border-stone-600 opacity-60' 
                    : 'bg-stone-700/80 border-stone-500 hover:border-emerald-500'
                }`}
                style={{ 
                  left: `calc(50% + ${x}px)`, 
                  top: `calc(50% + ${y}px)` 
                }}
                onClick={() => toggleDead(seat.id)}
                title={`${seat.userName}${seat.roleId ? ` - ${ROLES[seat.roleId]?.name || seat.roleId}` : ''}\n点击切换死亡状态`}
              >
                <span className="text-stone-300 font-bold text-xs">{index + 1}</span>
                {seat.roleId && ROLES[seat.roleId] && (
                  <span className="text-lg">{ROLES[seat.roleId]?.icon}</span>
                )}
                {seat.isDead && (
                  <span className="absolute -top-1 -right-1 text-lg">💀</span>
                )}
                {!seat.hasGhostVote && seat.isDead && (
                  <span className="absolute -bottom-1 -right-1 text-xs">🚫</span>
                )}
              </div>
            );
          })}
          
          {/* Center info */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="bg-stone-800/90 rounded-lg px-4 py-2 border border-stone-600">
              <p className="text-stone-400 text-sm">沙盒 • {gameState.seats.length} 人</p>
              <p className="text-stone-500 text-xs mt-1">点击座位切换死亡状态</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 沙盒模式的 Controls
 * 复用部分主 Controls 逻辑但连接到沙盒 store
 */
const SandboxControls: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const gameState = useSandboxStore(state => state.gameState);
  const setScript = useSandboxStore(state => state.setScript);
  const assignRole = useSandboxStore(state => state.assignRole);
  const resetGame = useSandboxStore(state => state.resetGame);
  const assignRoles = useSandboxStore(state => state.assignRoles);
  const setPhase = useSandboxStore(state => state.setPhase);
  const exitSandbox = useSandboxStore(state => state.exitSandbox);
  
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  
  if (!gameState) return null;

  const scriptDef = SCRIPTS[gameState.currentScriptId];
  const scriptRoles = (scriptDef?.roles.map(id => ROLES[id]) || []).filter((r): r is typeof ROLES[string] => !!r);

  return (
    <div className="h-full flex flex-col bg-stone-950 border-l border-stone-800">
      {/* Header */}
      <div className="p-4 border-b border-stone-800 flex items-center justify-between">
        <h2 className="text-stone-200 font-cinzel font-bold">🧪 沙盒控制台</h2>
        <button
          onClick={onClose}
          className="md:hidden text-stone-500 hover:text-stone-300 text-xl"
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Script Selection */}
        <div className="bg-stone-900/50 rounded-lg p-3 border border-stone-800">
          <h3 className="text-stone-400 text-sm font-bold mb-2">📜 剧本选择</h3>
          <select
            value={gameState.currentScriptId}
            onChange={(e) => setScript(e.target.value)}
            className="w-full bg-stone-800 text-stone-200 rounded px-3 py-2 text-sm border border-stone-700 focus:outline-none focus:border-emerald-600"
          >
            {Object.entries(SCRIPTS).map(([id, script]) => (
              <option key={id} value={id}>{script.name}</option>
            ))}
          </select>
        </div>

        {/* Quick Actions */}
        <div className="bg-stone-900/50 rounded-lg p-3 border border-stone-800">
          <h3 className="text-stone-400 text-sm font-bold mb-2">⚡ 快捷操作</h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={assignRoles}
              className="px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-200 rounded text-sm font-bold transition-colors"
            >
              🎲 随机分配
            </button>
            <button
              onClick={() => setPhase('NIGHT')}
              className="px-3 py-2 bg-indigo-800 hover:bg-indigo-700 text-indigo-200 rounded text-sm font-bold transition-colors"
            >
              🌙 进入夜晚
            </button>
            <button
              onClick={() => setPhase('DAY')}
              className="px-3 py-2 bg-amber-800 hover:bg-amber-700 text-amber-200 rounded text-sm font-bold transition-colors"
            >
              ☀️ 进入白天
            </button>
            <button
              onClick={resetGame}
              className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm font-bold transition-colors"
            >
              🔄 重置游戏
            </button>
          </div>
        </div>

        {/* Role Assignment */}
        <div className="bg-stone-900/50 rounded-lg p-3 border border-stone-800">
          <h3 className="text-stone-400 text-sm font-bold mb-2">🎭 角色分配</h3>
          <p className="text-stone-500 text-xs mb-2">选择角色，然后点击座位分配</p>
          <div className="grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
            {scriptRoles.map(role => (
              <button
                key={role.id}
                onClick={() => setSelectedRoleId(selectedRoleId === role.id ? null : role.id)}
                className={`p-1 rounded text-center transition-colors ${
                  selectedRoleId === role.id
                    ? 'bg-emerald-800 ring-2 ring-emerald-500'
                    : 'bg-stone-800 hover:bg-stone-700'
                }`}
                title={role.name}
              >
                <span className="text-lg">{role.icon}</span>
              </button>
            ))}
          </div>
          {selectedRoleId && (
            <p className="mt-2 text-emerald-400 text-xs">
              已选择: {ROLES[selectedRoleId]?.name} - 点击座位分配
            </p>
          )}
        </div>

        {/* Seats Overview */}
        <div className="bg-stone-900/50 rounded-lg p-3 border border-stone-800">
          <h3 className="text-stone-400 text-sm font-bold mb-2">💺 座位概览</h3>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {gameState.seats.map((seat, idx) => {
              const role = seat.roleId ? ROLES[seat.roleId] : null;
              return (
              <div 
                key={seat.id}
                className={`flex items-center justify-between px-2 py-1 rounded text-sm ${
                  seat.isDead ? 'bg-stone-800/50 text-stone-500' : 'bg-stone-800 text-stone-300'
                }`}
              >
                <span>{idx + 1}. {seat.userName}</span>
                <div className="flex items-center gap-1">
                  {role && (
                    <span title={role.name}>{role.icon}</span>
                  )}
                  {seat.isDead && <span>💀</span>}
                  {selectedRoleId && (
                    <button
                      onClick={() => {
                        assignRole(seat.id, selectedRoleId);
                      }}
                      className="ml-1 px-1 bg-emerald-700 hover:bg-emerald-600 rounded text-xs"
                      title="分配角色"
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="p-4 border-t border-stone-800">
        <button
          onClick={exitSandbox}
          className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-sm font-bold transition-colors"
        >
          退出沙盒模式
        </button>
      </div>
    </div>
  );
};

export default SandboxView;



