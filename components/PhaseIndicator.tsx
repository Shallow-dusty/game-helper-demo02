import React from 'react';
import { useStore } from '../store';

export const PhaseIndicator: React.FC = () => {
    const gameState = useStore(state => state.gameState);
    const user = useStore(state => state.user);

    if (!gameState || !user) return null;

    const isStoryteller = user.isStoryteller;

    // Determine phase message
    let message = '';
    let bgColor = '';
    let icon = '';

    if (gameState.setupPhase === 'ASSIGNING') {
        message = isStoryteller ? '🎭 正在分配角色...' : '⏳ 等待说书人分配角色...';
        bgColor = 'bg-amber-900/90';
        icon = '📝';
    } else if (gameState.setupPhase === 'READY') {
        message = isStoryteller ? '✅ 角色已发放，准备开始游戏' : '✅ 角色已发放，可查看规则手册';
        bgColor = 'bg-green-900/90';
        icon = '✅';
    } else if (gameState.setupPhase === 'STARTED') {
        // Game in progress
        if (gameState.phase === 'NIGHT') {
            message = '🌙 夜间阶段';
            bgColor = 'bg-blue-900/90';
            icon = '🌙';
        } else if (gameState.phase === 'DAY') {
            message = '☀️ 白天阶段';
            bgColor = 'bg-yellow-900/90';
            icon = '☀️';
        } else if (gameState.voting && gameState.voting.nomineeSeatId !== null) {
            const nominee = gameState.seats[gameState.voting.nomineeSeatId];
            const nomineeName = nominee?.userId ? `座位${gameState.voting.nomineeSeatId + 1}` : '座位' + (gameState.voting.nomineeSeatId + 1);
            message = `📊 投票中：${nomineeName}`;
            bgColor = 'bg-red-900/90';
            icon = '📊';
        } else if (gameState.gameOver?.isOver) {
            message = gameState.gameOver.winner === 'GOOD' ? '🎉 好人胜利！' : '💀 邪恶胜利！';
            bgColor = gameState.gameOver.winner === 'GOOD' ? 'bg-green-900/90' : 'bg-red-900/90';
            icon = gameState.gameOver.winner === 'GOOD' ? '🎉' : '💀';
        }
    }

    if (!message) return null;

    return (
        <div className={`fixed top-0 left-0 right-0 z-50 ${bgColor} backdrop-blur-sm border-b border-stone-700 shadow-lg`}>
            <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-2">
                <span className="text-2xl">{icon}</span>
                <span className="text-stone-100 font-semibold text-sm md:text-base">
                    {message}
                </span>
            </div>
        </div>
    );
};
