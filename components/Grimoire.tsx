
import React, { useState } from 'react';
import { Stage, Layer, Circle, Text, Group, Rect, Ring } from 'react-konva';
import { useStore } from '../store';
import { ROLES, TEAM_COLORS, PHASE_LABELS, TEAM_LABELS, SCRIPTS, STATUS_ICONS } from '../constants';
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
}

const SeatNode: React.FC<SeatNodeProps> = ({ seat, cx, cy, radius, angle, isST, isCurrentUser, scale, onClick }) => {
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  
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
    <Group x={x} y={y} onClick={onClick} onTap={onClick}>
      {/* Clock Hand Indicator */}
      {isClockHand && (
         <Ring innerRadius={tokenRadius + 3} outerRadius={tokenRadius + 9} fill="#fbbf24" listening={false} />
      )}
      
      {/* Seat Circle (Token Base) */}
      <Circle
        radius={tokenRadius}
        fill={seat.isDead ? '#2d2d2d' : '#1c1c1c'} // Darker background
        stroke={isCurrentUser ? '#fff' : (isNominee ? '#ef4444' : teamColor)}
        strokeWidth={isCurrentUser ? 4 : 2}
        shadowColor="black"
        shadowBlur={10 * scale}
        shadowOpacity={0.6}
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
           <Rect x={-tokenRadius/1.5} y={-3} width={tokenRadius*1.3} height={6} fill="#dc2626" rotation={45} cornerRadius={2}/>
           <Rect x={-tokenRadius/1.5} y={-3} width={tokenRadius*1.3} height={6} fill="#dc2626" rotation={-45} cornerRadius={2}/>
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
          <Group y={-tokenRadius - 10} x={tokenRadius/2}>
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
      
      {/* Reminders (ST Only) */}
      {isST && seat.reminders.length > 0 && (
          <Group y={-tokenRadius} x={-tokenRadius}>
              {seat.reminders.map((rem, i) => (
                  <Group key={rem.id} y={i * -12 * scale}>
                    <Rect width={10 * scale} height={10 * scale} fill="yellow" cornerRadius={2} stroke="black" strokeWidth={1} />
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

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, seatId: number } | null>(null);
  const [roleSelectSeat, setRoleSelectSeat] = useState<number | null>(null);

  if (!gameState || !user) return null;

  const cx = width / 2;
  const cy = height / 2;
  const minDim = Math.min(width, height);
  const baseScale = Math.max(0.6, Math.min(1.2, minDim / 800));
  const r = minDim / 2 - (60 * baseScale); 

  const handleSeatClick = (e: any, seat: Seat) => {
    e.cancelBubble = true;
    if (e.evt.button === 2 && user.isStoryteller) {
        setContextMenu({
            x: e.evt.clientX,
            y: e.evt.clientY,
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
        onClick={() => setContextMenu(null)}
    >
      <Stage width={width} height={height}>
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
              />
            );
          })}
        </Layer>
      </Stage>

      {/* ST Context Menu */}
      {contextMenu && user.isStoryteller && (
          <div 
            className="fixed bg-stone-900 border border-stone-600 rounded shadow-2xl p-2 z-50 flex flex-col gap-1 w-48 animate-in fade-in zoom-in-95 duration-100"
            style={{ top: contextMenu.y, left: contextMenu.x }} 
          >
              <button onClick={() => toggleDead(contextMenu.seatId)} className="text-left px-3 py-2 hover:bg-stone-800 rounded text-xs text-stone-300 flex items-center gap-3 transition-colors">
                  <span className="text-lg w-5 text-center">☠️</span> 切换存活 (Alive/Dead)
              </button>
              <button onClick={() => toggleAbilityUsed(contextMenu.seatId)} className="text-left px-3 py-2 hover:bg-stone-800 rounded text-xs text-stone-300 flex items-center gap-3 transition-colors">
                  <span className="text-lg w-5 text-center">🚫</span> 标记技能耗尽 (Used)
              </button>
              <div className="border-t border-stone-700 my-1"></div>
              <button onClick={() => toggleStatus(contextMenu.seatId, 'POISONED')} className="text-left px-3 py-2 hover:bg-stone-800 rounded text-xs text-stone-300 flex items-center gap-3 transition-colors">
                  <span className="text-lg w-5 text-center">🤢</span> 中毒 (Poison)
              </button>
              <button onClick={() => toggleStatus(contextMenu.seatId, 'DRUNK')} className="text-left px-3 py-2 hover:bg-stone-800 rounded text-xs text-stone-300 flex items-center gap-3 transition-colors">
                  <span className="text-lg w-5 text-center">🍺</span> 醉酒 (Drunk)
              </button>
              <button onClick={() => toggleStatus(contextMenu.seatId, 'PROTECTED')} className="text-left px-3 py-2 hover:bg-stone-800 rounded text-xs text-stone-300 flex items-center gap-3 transition-colors">
                  <span className="text-lg w-5 text-center">🛡️</span> 保护 (Protect)
              </button>
              <div className="border-t border-stone-700 my-1"></div>
              <button onClick={() => { setRoleSelectSeat(contextMenu.seatId); setContextMenu(null); }} className="text-left px-3 py-2 hover:bg-stone-800 rounded text-xs text-stone-300 flex items-center gap-3 transition-colors">
                  <span className="text-lg w-5 text-center">🎭</span> 分配角色 (Assign Role)
              </button>
              <button onClick={() => startVote(contextMenu.seatId)} className="text-left px-3 py-2 hover:bg-stone-800 rounded text-xs text-stone-300 flex items-center gap-3 transition-colors">
                  <span className="text-lg w-5 text-center">⚖️</span> 发起提名 (Nominate)
              </button>
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
                      {renderRoleSection('TOWNSFOLK', '村民 (Townsfolk)', rolesByTeam.TOWNSFOLK)}
                      {renderRoleSection('OUTSIDER', '外来者 (Outsider)', rolesByTeam.OUTSIDER)}
                      {renderRoleSection('MINION', '爪牙 (Minion)', rolesByTeam.MINION)}
                      {renderRoleSection('DEMON', '恶魔 (Demon)', rolesByTeam.DEMON)}
                  </div>

                  <div className="mt-8 flex justify-end gap-4">
                       <button onClick={() => { assignRole(roleSelectSeat!, null as any); setRoleSelectSeat(null); }} className="px-6 py-2 text-stone-500 hover:text-red-400 text-xs uppercase tracking-widest transition-colors">
                          清除角色 (Clear Role)
                      </button>
                      <button onClick={() => setRoleSelectSeat(null)} className="px-8 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded font-cinzel text-sm transition-colors">
                          取消 (Cancel)
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
