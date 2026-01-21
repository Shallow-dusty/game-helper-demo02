import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, ConnectionStatus } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { SCRIPTS } from '../../constants';
import { PartyPopper, Skull, FileEdit, CheckCircle, Moon, Sun, Scale, BarChart3 } from 'lucide-react';

// 细粒度订阅
const usePhaseIndicatorState = () => useStore(
    useShallow(state => ({
        phase: state.gameState?.phase,
        setupPhase: state.gameState?.setupPhase,
        currentScriptId: state.gameState?.currentScriptId ?? 'tb',
        customScripts: state.gameState?.customScripts ?? {},
        seats: state.gameState?.seats ?? [],
        gameOver: state.gameState?.gameOver,
        roundInfo: state.gameState?.roundInfo,
        nightCurrentIndex: state.gameState?.nightCurrentIndex ?? -1,
        nightQueue: state.gameState?.nightQueue ?? [],
        voting: state.gameState?.voting,
        roomId: state.gameState?.roomId ?? '',
        hasGameState: !!state.gameState,
    }))
);

export const PhaseIndicator: React.FC = () => {
    const { t } = useTranslation();
    const { phase, setupPhase, currentScriptId, customScripts, seats, gameOver, roundInfo, nightCurrentIndex, nightQueue, voting, roomId, hasGameState } = usePhaseIndicatorState();
    const user = useStore(state => state.user);
    const isOffline = useStore(state => state.isOffline);
    const connectionStatus = useStore(state => state.connectionStatus);

    // 连接状态样式配置
    const CONNECTION_STYLES: Record<ConnectionStatus, { text: string; className: string }> = {
        connecting: { text: t('connection.connecting'), className: 'text-yellow-400 animate-pulse' },
        connected: { text: t('connection.connected'), className: 'text-green-400' },
        reconnecting: { text: t('connection.reconnecting'), className: 'text-yellow-400 animate-pulse' },
        disconnected: { text: t('connection.disconnected'), className: 'text-red-400' },
    };

    if (!hasGameState || !user) return null;

    const isStoryteller = user.isStoryteller;

    // Determine phase message
    let message = '';
    let bgColor = '';
    let icon = '';
    let subMessage = '';

    // Get script name
    const scriptName = SCRIPTS[currentScriptId]?.name ??
                       customScripts?.[currentScriptId]?.name ??
                       t('scripts.custom');

    // Get alive player count
    const aliveCount = seats.filter(s => !s.isDead && (s.userId ?? s.isVirtual)).length;
    const totalPlayers = seats.filter(s => s.userId ?? s.isVirtual).length;

    if (gameOver?.isOver) {
        message = gameOver.winner === 'GOOD' ? t('phase.goodWin') : t('phase.evilWin');
        bgColor = gameOver.winner === 'GOOD' ? 'bg-green-900/90' : 'bg-red-900/90';
        icon = gameOver.winner === 'GOOD' ? '🎉' : '💀';
        subMessage = gameOver.reason ?? '';
    } else if (setupPhase === 'ASSIGNING') {
        message = isStoryteller ? t('phase.assigning') : t('phase.waitingForST');
        bgColor = 'bg-amber-900/90';
        icon = '📝';
        subMessage = `${scriptName} · ${String(totalPlayers)} ${t('phase.playerCount')}`;
    } else if (setupPhase === 'READY') {
        message = t('phase.rolesAssigned');
        bgColor = 'bg-green-900/90';
        icon = '✅';
        subMessage = isStoryteller ? t('phase.readyToStart') : t('phase.checkRuleBook');
    } else if (phase !== 'SETUP') {
        // Game in progress (setupPhase is 'STARTED' at this point)

        if (phase === 'NIGHT') {
            message = t('phase.night', { count: roundInfo?.nightCount ?? 1 });
            bgColor = 'bg-indigo-900/90';
            icon = '🌙';
            if (isStoryteller && nightCurrentIndex >= 0 && nightQueue[nightCurrentIndex]) {
                const currentRoleId = nightQueue[nightCurrentIndex];
                subMessage = `${t('phase.current')}: ${currentRoleId} · ${String(aliveCount)}/${String(totalPlayers)} ${t('phase.alive')}`;
            } else {
                subMessage = `${String(aliveCount)}/${String(totalPlayers)} ${t('phase.alive')}`;
            }
        } else if (phase === 'DAY') {
            message = t('phase.day', { count: roundInfo?.dayCount ?? 1 });
            bgColor = 'bg-amber-800/90';
            icon = '☀️';
            subMessage = `${String(aliveCount)}/${String(totalPlayers)} ${t('phase.alive')} · ${t('phase.discussionPhase')}`;
        } else if (phase === 'NOMINATION') {
            message = t('phase.nomination', { count: roundInfo?.dayCount ?? 1 });
            bgColor = 'bg-emerald-900/90';
            icon = '⚖️';
            subMessage = `${t('phase.nominationCount')}: ${String(roundInfo?.nominationCount ?? 0)} · ${String(aliveCount)} ${t('phase.alive')}`;
        } else if (voting && voting.nomineeSeatId !== null) {
            const nominee = seats[voting.nomineeSeatId];
            const nomineeName = nominee?.userName ?? `${t('nightAction.panel.seat')} ${String(voting.nomineeSeatId + 1)}`;
            message = t('phase.voting');
            bgColor = 'bg-red-900/90';
            icon = '📊';
            subMessage = `${t('phase.nominee')}: ${nomineeName} · ${t('phase.current')} ${String(voting.votes.length)} ${t('phase.votes')}`;
        }
    }

    if (!message) return null;

    // Connection status display - 使用常量配置
    const getConnectionDisplay = () => {
        const style = CONNECTION_STYLES[connectionStatus];

        if (connectionStatus === 'disconnected' && isOffline) {
            return { color: 'bg-gray-500', text: t('connection.offline'), animate: '' };
        }

        const colorMap: Record<ConnectionStatus, string> = {
            connected: 'bg-green-500',
            connecting: 'bg-yellow-500',
            reconnecting: 'bg-orange-500',
            disconnected: 'bg-red-500',
        };

        return {
            color: colorMap[connectionStatus],
            text: style.text.replace('...', ''),
            animate: style.className.includes('animate') ? 'animate-pulse' : ''
        };
    };

    const connDisplay = getConnectionDisplay();

    return (
        <div className={`w-full z-30 ${bgColor} backdrop-blur-sm border-b border-stone-700 shadow-lg flex-shrink-0`}>
            <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                {/* Left: Connection Status */}
                <div className="flex items-center gap-2 min-w-[70px]">
                    <div className={`w-2 h-2 rounded-full ${connDisplay.color} ${connDisplay.animate}`} />
                    <span className="text-[10px] text-stone-400 hidden sm:inline">
                        {connDisplay.text}
                    </span>
                </div>

                {/* Center: Phase Info */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2">
                        {icon === '🎉' ? <PartyPopper className="w-5 h-5 md:w-6 md:h-6" /> :
                         icon === '💀' ? <Skull className="w-5 h-5 md:w-6 md:h-6" /> :
                         icon === '📝' ? <FileEdit className="w-5 h-5 md:w-6 md:h-6" /> :
                         icon === '✅' ? <CheckCircle className="w-5 h-5 md:w-6 md:h-6" /> :
                         icon === '🌙' ? <Moon className="w-5 h-5 md:w-6 md:h-6" /> :
                         icon === '☀️' ? <Sun className="w-5 h-5 md:w-6 md:h-6" /> :
                         icon === '⚖️' ? <Scale className="w-5 h-5 md:w-6 md:h-6" /> :
                         icon === '📊' ? <BarChart3 className="w-5 h-5 md:w-6 md:h-6" /> :
                         <span className="text-lg md:text-xl">{icon}</span>}
                        <span className="text-stone-100 font-semibold text-sm md:text-base font-cinzel tracking-wide">
                            {message}
                        </span>
                    </div>
                    {subMessage && (
                        <span className="text-stone-300/70 text-[10px] md:text-xs mt-0.5">
                            {subMessage}
                        </span>
                    )}
                </div>

                {/* Right: Room Code */}
                <div className="flex items-center gap-2 min-w-[70px] justify-end">
                    <span className="text-xs font-mono text-stone-400 bg-stone-800/50 px-2 py-0.5 rounded">
                        #{roomId}
                    </span>
                </div>
            </div>
        </div>
    );
};




