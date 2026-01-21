import React, { useRef, useEffect } from 'react';
import { Group, Circle, Text, Rect, Ring, Arc, RegularPolygon } from 'react-konva';
import { Seat } from '../../types';
import { ROLES, TEAM_COLORS, STATUS_ICONS } from '../../constants';
import Konva from 'konva';
import { useLongPress } from '../../hooks/useLongPress';

interface SeatNodeProps {
  seat: Seat;
  cx: number;
  cy: number;
  radius: number;
  angle: number;
  isST: boolean;
  isCurrentUser: boolean;
  scale: number;
  onClick: (e: Konva.KonvaEventObject<MouseEvent>) => void;
  onLongPress: (e: unknown) => void;
  onContextMenu: (e: Konva.KonvaEventObject<PointerEvent>) => void;
  disableInteractions?: boolean;
  isSwapSource?: boolean;
  publicOnly?: boolean;
  setupPhase?: string;
  rolesRevealed?: boolean;
  votingClockHandSeatId?: number | null;
  isHovered?: boolean;
}

const SeatNode: React.FC<SeatNodeProps> = React.memo(({
  seat, cx, cy, radius, angle, isST, isCurrentUser, scale,
  onClick, onLongPress, onContextMenu, disableInteractions = false,
  isSwapSource = false, publicOnly = false, setupPhase,
  rolesRevealed = false, votingClockHandSeatId
}) => {
  const x = cx + radius * Math.cos(angle);
  const y = cy + radius * Math.sin(angle);
  const [isHovered, setIsHovered] = React.useState(false);

  const { isPressing, ...longPressHandlers } = useLongPress(onLongPress, onClick, {
    delay: 500,
    disabled: disableInteractions,
    detectMouse: false
  });

  const progressRingRef = useRef<Konva.Arc>(null);
  const groupRef = useRef<Konva.Group>(null);
  const breathTweenRef = useRef<Konva.Tween | null>(null);

  // Long press progress ring animation
  useEffect(() => {
    const node = progressRingRef.current;
    if (isPressing && node) {
      node.angle(0);
      node.opacity(1);
      const tween = new Konva.Tween({
        node: node,
        duration: 0.5,
        angle: 360,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- Konva.Easings is a static easing function
        easing: Konva.Easings.Linear,
      });
      tween.play();
      return () => { tween.destroy(); };
    }
    return undefined;
  }, [isPressing]);

  // Breathing animation
  useEffect(() => {
    if (seat.isDead || isSwapSource) return;
    const node = groupRef.current;
    if (!node) return;

    const delay = Math.random() * 2;

    const createBreathTween = () => {
      node.scaleX(0.98);
      node.scaleY(0.98);

      const tween = new Konva.Tween({
        node: node,
        duration: 2 + Math.random(),
        scaleX: 1.02,
        scaleY: 1.02,
        yoyo: true,
        // eslint-disable-next-line @typescript-eslint/unbound-method -- Konva.Easings is a static easing function
        easing: Konva.Easings.EaseInOut,
      });
      return tween;
    };

    breathTweenRef.current = createBreathTween();
    const timer = setTimeout(() => breathTweenRef.current?.play(), delay * 1000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        breathTweenRef.current?.pause();
      } else {
        breathTweenRef.current?.play();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      breathTweenRef.current?.destroy();
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [seat.isDead, isSwapSource]);

  // Trembling animation (Nomination)
  useEffect(() => {
    if (!seat.isNominated) return;
    const node = groupRef.current;
    if (!node) return;

    const anim = new Konva.Animation((frame) => {
      if (!frame) return;
      const amp = 2 * scale;
      node.offsetX(Math.sin(frame.time * 0.1) * amp);
      node.offsetY(Math.cos(frame.time * 0.1) * amp);
    }, node.getLayer());

    anim.start();
    return () => {
        anim.stop();
        node.offsetX(0);
        node.offsetY(0);
    };
  }, [seat.isNominated, scale]);

  // Death particle effect
  const prevIsDeadRef = useRef(seat.isDead);
  useEffect(() => {
    if (seat.isDead && !prevIsDeadRef.current) {
      const layer = groupRef.current?.getLayer();
      if (!layer) return;

      for (let i = 0; i < 20; i++) {
        const particle = new Konva.Circle({
          x: x,
          y: y,
          radius: Math.random() * 3 + 1,
          fill: '#ef4444',
          opacity: 1,
        });
        layer.add(particle);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 50 + 20;

        new Konva.Tween({
          node: particle,
          duration: 1,
          x: x + Math.cos(angle) * speed,
          y: y + Math.sin(angle) * speed,
          opacity: 0,
          onFinish: () => particle.destroy(),
        }).play();
      }
    }
    prevIsDeadRef.current = seat.isDead;
  }, [seat.isDead, x, y]);

  // Role display logic
  const displayRoleId = isST
    ? (seat.realRoleId ?? seat.seenRoleId)
    : (isCurrentUser && rolesRevealed ? seat.seenRoleId : null);

  const showRole = !publicOnly && displayRoleId;
  const roleDef = showRole && displayRoleId ? ROLES[displayRoleId] : null;

  const isMisled = isST && seat.realRoleId && seat.seenRoleId && seat.realRoleId !== seat.seenRoleId;
  const seenRoleDef = isMisled && seat.seenRoleId ? ROLES[seat.seenRoleId] : null;
  const isClockHand = votingClockHandSeatId === seat.id;

  const tokenRadius = 35 * scale;
  const fontSizeName = Math.max(10, 14 * scale);
  const fontSizeRole = Math.max(14, 20 * scale);
  const iconSize = Math.max(12, 16 * scale);
  const statusIconSize = Math.max(12, 14 * scale);

  // Roman numeral conversion
  const getRomanNumeral = (num: number): string => {
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
  };

  return (
    <Group
      ref={groupRef}
      x={x}
      y={y}
      {...longPressHandlers}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Long Press Progress Ring */}
      {isPressing && (
        <Arc
          ref={progressRingRef}
          innerRadius={tokenRadius + 8}
          outerRadius={tokenRadius + 12}
          angle={0}
          fill="#f59e0b"
          opacity={0.8}
          listening={false}
        />
      )}

      {/* Clock Hand Indicator */}
      {isClockHand && (
        <Ring innerRadius={tokenRadius + 3} outerRadius={tokenRadius + 9} fill="#fbbf24" listening={false} />
      )}

      {/* Swap Source Indicator */}
      {isSwapSource && (
        <Ring
          innerRadius={tokenRadius + 5}
          outerRadius={tokenRadius + 8}
          stroke="#06b6d4"
          strokeWidth={2}
          dash={[10, 5]}
          listening={false}
        />
      )}

      {/* Seat Token */}
      <RegularPolygon
        sides={6}
        radius={tokenRadius}
        fillRadialGradientStartPoint={{ x: -tokenRadius / 3, y: -tokenRadius / 3 }}
        fillRadialGradientStartRadius={0}
        fillRadialGradientEndPoint={{ x: 0, y: 0 }}
        fillRadialGradientEndRadius={tokenRadius}
        fillRadialGradientColorStops={[
          0, seat.isDead ? '#44403c' : (isCurrentUser ? '#fbbf24' : '#57534e'),
          0.6, seat.isDead ? '#1c1917' : TEAM_COLORS[roleDef?.team ?? 'TOWNSFOLK'],
          1, '#0c0a09'
        ]}
        stroke={isCurrentUser ? '#f59e0b' : '#78350f'}
        strokeWidth={isCurrentUser ? 3 : 2}
        shadowBlur={isCurrentUser ? 15 : 10}
        shadowColor={isCurrentUser ? '#f59e0b' : '#000'}
        shadowOpacity={0.8}
        opacity={seat.isDead ? 0.9 : 1}
        dash={seat.isVirtual ? [5, 5] : undefined}
        rotation={30}
      />

      {/* Inner Border */}
      <RegularPolygon
        sides={6}
        radius={tokenRadius - 5}
        stroke="#a8a29e"
        strokeWidth={1}
        opacity={0.3}
        listening={false}
        rotation={30}
      />

      {/* Seat ID */}
      <Text
        text={getRomanNumeral(seat.id + 1)}
        y={-tokenRadius - 15}
        fontSize={12 * scale}
        fill="#78350f"
        fontFamily="Cinzel"
        fontStyle="bold"
        align="center"
        width={tokenRadius * 2}
        offsetX={tokenRadius}
        listening={false}
        shadowColor="#000"
        shadowBlur={2}
      />

      {/* Dead Indicator */}
      {seat.isDead && (
        <Group>
          <Rect x={-tokenRadius / 1.5} y={-3} width={tokenRadius * 1.3} height={6} fill="#dc2626" rotation={45} cornerRadius={2} />
          <Rect x={-tokenRadius / 1.5} y={-3} width={tokenRadius * 1.3} height={6} fill="#dc2626" rotation={-45} cornerRadius={2} />
        </Group>
      )}

      {/* Player Name */}
      <Text
        y={tokenRadius + 12}
        text={seat.userName}
        fontSize={fontSizeName}
        fill="#e7e5e4"
        width={tokenRadius * 3}
        offsetX={tokenRadius * 1.5}
        align="center"
        fontStyle="bold"
        fontFamily="Cinzel"
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={1}
        ellipsis={true}
        wrap="none"
      />

      {/* Role Info */}
      {roleDef && (
        <Group>
          <Text
            y={-fontSizeRole / 3}
            text={roleDef.name.substring(0, 2)}
            fontSize={fontSizeRole}
            fontStyle="bold"
            fontFamily="Cinzel"
            fill={seat.hasUsedAbility ? '#777' : '#fff'}
            width={tokenRadius * 2}
            offsetX={tokenRadius}
            align="center"
            listening={false}
          />
          {seat.hasUsedAbility && (
            <Text
              x={tokenRadius * 0.3}
              y={-tokenRadius * 0.7}
              text="🚫"
              fontSize={statusIconSize}
              listening={false}
            />
          )}
          {roleDef.icon && (
            <Text
              x={-tokenRadius * 0.7}
              y={-tokenRadius * 0.7}
              text={roleDef.icon}
              fontSize={iconSize}
              listening={false}
            />
          )}
          {isMisled && seenRoleDef && (
            <Group x={tokenRadius * 0.5} y={-tokenRadius * 0.8}>
              <Circle radius={9 * scale} fill="#000" stroke="red" strokeWidth={1} />
              <Text
                text={seenRoleDef.name.substring(0, 1)}
                fontSize={10 * scale}
                fill="red"
                x={-5 * scale}
                y={-5 * scale}
                fontStyle="bold"
                listening={false}
              />
            </Group>
          )}
        </Group>
      )}

      {/* Status Icons */}
      {isST && seat.statuses.length > 0 && (
        <Group>
          {seat.statuses.map((status, idx) => {
            const total = seat.statuses.length;
            const step = Math.PI / 4;
            const startAngle = -Math.PI / 2 - ((total - 1) * step) / 2;
            const angle = startAngle + idx * step;
            const iconRadius = tokenRadius + 15 * scale;

            return (
              <Group
                key={status}
                x={iconRadius * Math.cos(angle)}
                y={iconRadius * Math.sin(angle)}
              >
                <Circle radius={8 * scale} fill="rgba(0,0,0,0.7)" />
                <Text
                  text={STATUS_ICONS[status]}
                  fontSize={statusIconSize}
                  offsetX={statusIconSize / 2}
                  offsetY={statusIconSize / 2}
                />
              </Group>
            );
          })}
        </Group>
      )}

      {/* Voting Hand */}
      {seat.isHandRaised && (
        <Group y={-tokenRadius - 10} x={tokenRadius / 2}>
          <Circle radius={10 * scale} fill="#fbbf24" shadowBlur={5} />
          <Text text="✋" x={-7 * scale} y={-7 * scale} fontSize={14 * scale} />
        </Group>
      )}

      {/* Ghost Vote */}
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

      {/* Ready Indicator */}
      {seat.isReady && setupPhase !== 'STARTED' && (
        <Group x={tokenRadius * 0.7} y={-tokenRadius * 0.7}>
          <Circle radius={10 * scale} fill="#22c55e" stroke="#fff" strokeWidth={1} shadowBlur={5} shadowColor="#22c55e" />
          <Text text="✓" x={-5 * scale} y={-5 * scale} fontSize={12 * scale} fill="#fff" fontStyle="bold" />
        </Group>
      )}

      {/* Hover Tooltip */}
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
}, (prevProps, nextProps) => {
  // Custom equality check: only re-render if these specific props change
  return (
    prevProps.seat === nextProps.seat &&
    prevProps.isHovered === nextProps.isHovered &&
    prevProps.scale === nextProps.scale &&
    prevProps.isSwapSource === nextProps.isSwapSource
  );
});

SeatNode.displayName = 'SeatNode';

export default SeatNode;
