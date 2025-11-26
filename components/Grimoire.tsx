
import React, { useState, useRef, useCallback } from 'react';
import { Stage, Layer, Circle, Text, Group, Rect, Ring } from 'react-konva';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS, PHASE_LABELS, SCRIPTS, STATUS_OPTIONS, STATUS_ICONS, PRESET_REMINDERS } from '../constants';
import { Seat, Team, SeatStatus } from '../types';

interface GrimoireProps {
  width: number;
  height: number;
}

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
}

// Long press hook for mobile support
const useLongPress = (onLongPress: (e: any) => void, onClick: (e: any) => void, delay = 500) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback((e: any) => {
    isLongPressRef.current = false;
    startPosRef.current = { x: e.evt?.clientX || 0, y: e.evt?.clientY || 0 };
    timerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress(e);
    }, delay);
  }, [onLongPress, delay]);

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

  return {
    onTouchStart: start,
    onTouchEnd: (e: any) => clear(e, true),
    onTouchMove: move,
    onMouseDown: start,
    onMouseUp: (e: any) => clear(e, true),
    onMouseLeave: (e: any) => clear(e, false),
  };
};

const SeatNode: React.FC<SeatNodeProps> = ({ seat, cx, cy, radius, angle, isST, isCurrentUser, scale, onClick, onLongPress }) => {
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  const [isHovered, setIsHovered] = React.useState(false);
  
  const longPressHandlers = useLongPress(onLongPress, onClick);

  // --- PRIVACY LOGIC ---
  // Only show Role if: User is Storyteller, OR User is this Seat
  const showRole = (isST || isCurrentUser) && seat.roleId;
  const roleDef = showRole && seat.roleId ? ROLES[seat.roleId] : null;

  // Show team color? ST always sees. Player only sees their own color. 
  // Others see grey/default unless we implement complex "known info" logic.
  const teamColor = roleDef ? TEAM_COLORS[roleDef.team] : '#525252';

  // Voting Highlighting
  const votingState = useStore(state => state.gameState?.voting);
  const isClockHand = votingState?.clockHandSeatId === seat.id;
  const isNominee = votingState?.nomineeSeatId === seat.id;

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
};

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

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, seatId: number } | null>(null);
  const [showReminderMenu, setShowReminderMenu] = useState(false);
  const [roleSelectSeat, setRoleSelectSeat] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false); // Mobile Lock State

  if (!gameState || !user) return null;

  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const baseScale = Math.max(0.6, Math.min(1.2, minDim / 800));
  const r = minDim / 2 - (60 * baseScale);

  // Handle long press for mobile (opens context menu for ST)
  const handleLongPress = useCallback((e: any, seat: Seat) => {
    if (isLocked) return;
    if (!user.isStoryteller) return;
    
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
  }, [isLocked, user.isStoryteller]);

  const handleSeatClick = (e: any, seat: Seat) => {
    if (isLocked) return; // Double check logic
    e.cancelBubble = true;
    
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
    // ST can force join? No, let players join themselves mostly.
    // Or ST can click empty seat to assign? 
    if (seat.userId === null) joinSeat(seat.id);
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
    if (role && rolesByTeam[role.team]) {
      rolesByTeam[role.team].push(role);
    }
  });

  const renderRoleSection = (team: string, title: string, roles: any[]) => (
    <div className="mb-4" key={team}>
      <h4 className="text-xs font-bold uppercase tracking-widest mb-2 border-b border-stone-700 pb-1 font-cinzel" style={{ color: TEAM_COLORS[team as keyof typeof TEAM_COLORS] }}>
        {title} ({roles.length})
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {roles.map(role => (
          <button
            key={role.id}
            onClick={() => { assignRole(roleSelectSeat!, role.id); setRoleSelectSeat(null); }}
            className="p-2 rounded border border-stone-800 bg-stone-950 hover:bg-stone-800 text-xs text-center transition-all flex flex-col items-center justify-center gap-1 h-20 group active:scale-95"
            style={{ borderColor: TEAM_COLORS[role.team as keyof typeof TEAM_COLORS] + '30' }}
          >
            <div className="w-8 h-8 rounded-full border-2 flex items-center justify-center mb-1 shadow-md group-hover:scale-110 transition-transform bg-black/40" style={{ borderColor: TEAM_COLORS[role.team as keyof typeof TEAM_COLORS] }}>
              <span className="text-lg">
                {role.team === 'DEMON' ? '👿' : role.team === 'MINION' ? '🧪' : role.team === 'OUTSIDER' ? '⚡' : '⚜️'}
              </span>
            </div>
            <span className="block font-bold text-stone-300 leading-none scale-90">{role.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="relative w-full h-full"
      onContextMenu={(e) => e.preventDefault()}
      onClick={() => { setContextMenu(null); setShowReminderMenu(false); }}
    >
      {/* Mobile Lock Button & Hint */}
      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
        <button
          onClick={() => setIsLocked(!isLocked)}
          className={`p-2 rounded-full shadow-lg transition-colors ${isLocked ? 'bg-red-600 text-white' : 'bg-stone-800/80 text-stone-400 hover:bg-stone-700'}`}
          title={isLocked ? "解锁交互 (Unlock)" : "锁定交互 (Lock)"}
        >
          {isLocked ? '🔒' : '🔓'}
        </button>
        {user.isStoryteller && !isLocked && (
          <div className="text-[10px] text-stone-500 bg-stone-900/80 px-2 py-1 rounded text-right hidden sm:block">
            💡 长按玩家打开菜单
          </div>
        )}
      </div>

      <Stage width={width} height={height} listening={!isLocked}>
        <Layer>
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
              />
            );
          })}
        </Layer>
      </Stage>

      {/* ST Context Menu (Now a Modal) */}
      {contextMenu && user.isStoryteller && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
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
                  {gameState.seats.find(s => s.id === contextMenu.seatId)?.roleId ?
                    (ROLES[gameState.seats.find(s => s.id === contextMenu.seatId)?.roleId!]?.team === 'DEMON' ? '👿' :
                      ROLES[gameState.seats.find(s => s.id === contextMenu.seatId)?.roleId!]?.team === 'MINION' ? '🧪' : '⚜️')
                    : '👤'}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-stone-200 font-cinzel">
                    {gameState.seats.find(s => s.id === contextMenu.seatId)?.userName}
                  </h3>
                  <p className="text-xs text-stone-500">
                    座位 {contextMenu.seatId + 1} • {gameState.seats.find(s => s.id === contextMenu.seatId)?.roleId ? ROLES[gameState.seats.find(s => s.id === contextMenu.seatId)?.roleId!]?.name : '未分配角色'}
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
                className={`p-3 rounded border flex items-center gap-3 transition-colors ${gameState.seats.find(s => s.id === contextMenu.seatId)?.isDead ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}
              >
                <span className="text-2xl">{gameState.seats.find(s => s.id === contextMenu.seatId)?.isDead ? '💀' : '❤️'}</span>
                <div className="text-left">
                  <div className="font-bold text-sm">切换存活</div>
                  <div className="text-[10px] opacity-70">{gameState.seats.find(s => s.id === contextMenu.seatId)?.isDead ? '当前: 死亡' : '当前: 存活'}</div>
                </div>
              </button>

              {/* Ability Used Toggle */}
              <button
                onClick={() => { toggleAbilityUsed(contextMenu.seatId); setContextMenu(null); }}
                className={`p-3 rounded border flex items-center gap-3 transition-colors ${gameState.seats.find(s => s.id === contextMenu.seatId)?.hasUsedAbility ? 'bg-stone-950 border-stone-800 text-stone-500' : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'}`}
              >
                <span className="text-2xl">🚫</span>
                <div className="text-left">
                  <div className="font-bold text-sm">技能耗尽</div>
                  <div className="text-[10px] opacity-70">{gameState.seats.find(s => s.id === contextMenu.seatId)?.hasUsedAbility ? '已使用' : '未使用'}</div>
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
                  const seat = gameState.seats.find(s => s.id === contextMenu.seatId);
                  const hasStatus = seat?.statuses.includes(status.id as SeatStatus);
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
                {gameState.seats.find(s => s.id === contextMenu.seatId)?.reminders.map(rem => (
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
                {gameState.seats.find(s => s.id === contextMenu.seatId)?.reminders.length === 0 && (
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
      )}

      {/* Role Selector Modal */}
      {roleSelectSeat !== null && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-stone-950 border border-stone-700 p-6 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
            <div className="flex justify-between items-center mb-6 border-b border-stone-800 pb-4">
              <h3 className="text-2xl text-stone-200 font-cinzel tracking-widest">
                <span className="text-red-800 mr-2">✦</span>
                分配角色 ({SCRIPTS[gameState.currentScriptId].name})
              </h3>
              <button onClick={() => setRoleSelectSeat(null)} className="text-stone-500 hover:text-stone-200 text-2xl">×</button>
            </div>

            <div className="space-y-6">
              {renderRoleSection('TOWNSFOLK', '村民', rolesByTeam.TOWNSFOLK)}
              {renderRoleSection('OUTSIDER', '外来者', rolesByTeam.OUTSIDER)}
              {renderRoleSection('MINION', '爪牙', rolesByTeam.MINION)}
              {renderRoleSection('DEMON', '恶魔', rolesByTeam.DEMON)}
            </div>

            <div className="mt-8 flex justify-end gap-4">
              <button onClick={() => { assignRole(roleSelectSeat!, null as any); setRoleSelectSeat(null); }} className="px-6 py-2 text-stone-500 hover:text-red-400 text-xs uppercase tracking-widest transition-colors">
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
