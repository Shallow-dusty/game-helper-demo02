import React from 'react';
import { useStore, ConnectionStatus } from '../store';
import { SCRIPTS } from '../constants';

export const PhaseIndicator: React.FC = () => {
    const gameState = useStore(state => state.gameState);
    const user = useStore(state => state.user);
    const isOffline = useStore(state => state.isOffline);
    const connectionStatus = useStore(state => state.connectionStatus);

    if (!gameState || !user) return null;

    const isStoryteller = user.isStoryteller;

    // Determine phase message
    let message = '';
    let bgColor = '';
    let icon = '';
    let subMessage = '';

    // Get script name
    const scriptName = SCRIPTS[gameState.currentScriptId]?.name || 
                       gameState.customScripts?.[gameState.currentScriptId]?.name || 
                       '自定义剧本';

    // Get alive player count
    const aliveCount = gameState.seats.filter(s => !s.isDead && (s.userId || s.isVirtual)).length;
    const totalPlayers = gameState.seats.filter(s => s.userId || s.isVirtual).length;

    if (gameState.gameOver?.isOver) {
        message = gameState.gameOver.winner === 'GOOD' ? '🎉 好人胜利！' : '💀 邪恶胜利！';
        bgColor = gameState.gameOver.winner === 'GOOD' ? 'bg-green-900/90' : 'bg-red-900/90';
        icon = gameState.gameOver.winner === 'GOOD' ? '🎉' : '💀';
        subMessage = gameState.gameOver.reason;
    } else if (gameState.setupPhase === 'ASSIGNING') {
        message = isStoryteller ? '🎭 正在分配角色...' : '⏳ 等待说书人分配角色...';
        bgColor = 'bg-amber-900/90';
        icon = '📝';
        subMessage = `${scriptName} · ${totalPlayers} 人局`;
    } else if (gameState.setupPhase === 'READY') {
        message = '角色已发放';
        bgColor = 'bg-green-900/90';
        icon = '✅';
        subMessage = isStoryteller ? '准备开始游戏' : '可查看规则手册';
    } else if (gameState.setupPhase === 'STARTED' || gameState.phase !== 'SETUP') {
        // Game in progress
        const roundInfo = gameState.roundInfo || { dayCount: 1, nightCount: 1, nominationCount: 0, totalRounds: 1 };

        if (gameState.phase === 'NIGHT') {
            message = `🌙 第 ${roundInfo.nightCount} 夜`;
            bgColor = 'bg-indigo-900/90';
            icon = '🌙';
            // Show current night action role for ST
            if (isStoryteller && gameState.nightCurrentIndex >= 0 && gameState.nightQueue[gameState.nightCurrentIndex]) {
                const currentRoleId = gameState.nightQueue[gameState.nightCurrentIndex];
                subMessage = `当前: ${currentRoleId} · ${aliveCount}/${totalPlayers} 存活`;
            } else {
                subMessage = `${aliveCount}/${totalPlayers} 存活`;
            }
        } else if (gameState.phase === 'DAY') {
            message = `☀️ 第 ${roundInfo.dayCount} 天`;
            bgColor = 'bg-amber-800/90';
            icon = '☀️';
            subMessage = `${aliveCount}/${totalPlayers} 存活 · 讨论阶段`;
        } else if (gameState.phase === 'NOMINATION') {
            message = `⚖️ 第 ${roundInfo.dayCount} 天 · 提名阶段`;
            bgColor = 'bg-emerald-900/90';
            icon = '⚖️';
            subMessage = `提名次数: ${roundInfo.nominationCount} · ${aliveCount} 人存活`;
        } else if (gameState.phase === 'VOTING' && gameState.voting && gameState.voting.nomineeSeatId !== null) {
            const nominee = gameState.seats[gameState.voting.nomineeSeatId];
            const nomineeName = nominee?.userName || `座位 ${gameState.voting.nomineeSeatId + 1}`;
            message = `📊 投票中`;
            bgColor = 'bg-red-900/90';
            icon = '📊';
            subMessage = `被提名者: ${nomineeName} · 当前 ${gameState.voting.votes.length} 票`;
        }
    }

    if (!message) return null;

    // Connection status display
    const getConnectionDisplay = () => {
        switch (connectionStatus) {
            case 'connected':
                return { color: 'bg-green-500', text: '在线', animate: '' };
            case 'connecting':
                return { color: 'bg-yellow-500', text: '连接中', animate: 'animate-pulse' };
            case 'reconnecting':
                return { color: 'bg-orange-500', text: '重连中', animate: 'animate-pulse' };
            case 'disconnected':
            default:
                return { color: isOffline ? 'bg-gray-500' : 'bg-red-500', text: isOffline ? '离线' : '断开', animate: isOffline ? '' : 'animate-pulse' };
        }
    };

    const connDisplay = getConnectionDisplay();

    return (
        <div className={`fixed top-0 left-0 right-0 z-30 ${bgColor} backdrop-blur-sm border-b border-stone-700 shadow-lg`}>
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
