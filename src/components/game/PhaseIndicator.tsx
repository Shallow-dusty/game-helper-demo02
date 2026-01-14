import React from 'react';
import { useTranslation } from 'react-i18next';
import { useStore, ConnectionStatus } from '../../store';
import { SCRIPTS } from '../../constants';

export const PhaseIndicator: React.FC = () => {
    const { t } = useTranslation();
    const gameState = useStore(state => state.gameState);
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

    if (!gameState || !user) return null;

    const isStoryteller = user.isStoryteller;

    // Determine phase message
    let message = '';
    let bgColor = '';
    let icon = '';
    let subMessage = '';

    // Get script name
    const scriptName = SCRIPTS[gameState.currentScriptId]?.name ??
                       gameState.customScripts?.[gameState.currentScriptId]?.name ??
                       t('scripts.custom');

    // Get alive player count
    const aliveCount = gameState.seats.filter(s => !s.isDead && (s.userId ?? s.isVirtual)).length;
    const totalPlayers = gameState.seats.filter(s => s.userId ?? s.isVirtual).length;

    if (gameState.gameOver?.isOver) {
        message = gameState.gameOver.winner === 'GOOD' ? t('phase.goodWin') : t('phase.evilWin');
        bgColor = gameState.gameOver.winner === 'GOOD' ? 'bg-green-900/90' : 'bg-red-900/90';
        icon = gameState.gameOver.winner === 'GOOD' ? '🎉' : '💀';
        subMessage = gameState.gameOver.reason;
    } else if (gameState.setupPhase === 'ASSIGNING') {
        message = isStoryteller ? t('phase.assigning') : t('phase.waitingForST');
        bgColor = 'bg-amber-900/90';
        icon = '📝';
        subMessage = `${scriptName} · ${String(totalPlayers)} ${t('phase.playerCount')}`;
    } else if (gameState.setupPhase === 'READY') {
        message = t('phase.rolesAssigned');
        bgColor = 'bg-green-900/90';
        icon = '✅';
        subMessage = isStoryteller ? t('phase.readyToStart') : t('phase.checkRuleBook');
    } else if (gameState.phase !== 'SETUP') {
        // Game in progress (setupPhase is 'STARTED' at this point)
        const roundInfo = gameState.roundInfo;

        if (gameState.phase === 'NIGHT') {
            message = t('phase.night', { count: roundInfo.nightCount });
            bgColor = 'bg-indigo-900/90';
            icon = '🌙';
            // Show current night action role for ST
            if (isStoryteller && gameState.nightCurrentIndex >= 0 && gameState.nightQueue[gameState.nightCurrentIndex]) {
                const currentRoleId = gameState.nightQueue[gameState.nightCurrentIndex];
                subMessage = `${t('phase.current')}: ${String(currentRoleId)} · ${String(aliveCount)}/${String(totalPlayers)} ${t('phase.alive')}`;
            } else {
                subMessage = `${String(aliveCount)}/${String(totalPlayers)} ${t('phase.alive')}`;
            }
        } else if (gameState.phase === 'DAY') {
            message = t('phase.day', { count: roundInfo.dayCount });
            bgColor = 'bg-amber-800/90';
            icon = '☀️';
            subMessage = `${String(aliveCount)}/${String(totalPlayers)} ${t('phase.alive')} · ${t('phase.discussionPhase')}`;
        } else if (gameState.phase === 'NOMINATION') {
            message = t('phase.nomination', { count: roundInfo.dayCount });
            bgColor = 'bg-emerald-900/90';
            icon = '⚖️';
            subMessage = `${t('phase.nominationCount')}: ${String(roundInfo.nominationCount)} · ${String(aliveCount)} ${t('phase.alive')}`;
        } else if (gameState.voting && gameState.voting.nomineeSeatId !== null) {
            // phase is 'VOTING' at this point
            const nominee = gameState.seats[gameState.voting.nomineeSeatId];
            const nomineeName = nominee?.userName ?? `${t('nightAction.panel.seat')} ${String(gameState.voting.nomineeSeatId + 1)}`;
            message = t('phase.voting');
            bgColor = 'bg-red-900/90';
            icon = '📊';
            subMessage = `${t('phase.nominee')}: ${nomineeName} · ${t('phase.current')} ${String(gameState.voting.votes.length)} ${t('phase.votes')}`;
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
                        <span className="text-lg md:text-xl">{icon}</span>
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
                        #{gameState.roomId}
                    </span>
                </div>
            </div>
        </div>
    );
};




