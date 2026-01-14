import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { Z_INDEX } from '../../constants';

/**
 * 移动端悬浮投票按钮
 * 仅在投票阶段显示，解决侧边栏遮挡魔典的问题
 */
export const FloatingVoteButton: React.FC = () => {
    const { t } = useTranslation();
    const gameState = useStore(state => state.gameState);
    const user = useStore(state => state.user);
    const toggleHand = useStore(state => state.toggleHand);
    const [isLoading, setIsLoading] = useState(false);

    // 获取当前用户的座位
    const currentSeat = gameState?.seats.find(s => s.userId === user?.id);

    // 检查是否应该显示此按钮
    // 1. 必须是玩家（非说书人）
    // 2. 必须在投票阶段
    // 3. 必须已入座
    // 4. 仅在移动端显示（桌面端使用侧边栏）
    // 5. 没有打开全屏模态框
    const isModalOpen = useStore(state => state.isModalOpen);
    const shouldShow = !user?.isStoryteller &&
        gameState?.voting?.isOpen &&
        currentSeat &&
        !isModalOpen;

    // 死亡且无幽灵票时禁用
    const isDead = currentSeat?.isDead ?? false;
    const hasGhostVote = currentSeat?.hasGhostVote ?? true;
    const isGhostVoteUsed = isDead && !hasGhostVote;
    const isLocked = currentSeat?.voteLocked ?? false;
    const isRaised = currentSeat?.isHandRaised ?? false;
    const isDisabled = isLoading || isLocked || isGhostVoteUsed;

    const handleClick = useCallback(() => {
        if (isDisabled || !currentSeat) return;
        setIsLoading(true);
        toggleHand();
        setTimeout(() => setIsLoading(false), 300);
    }, [isDisabled, toggleHand, currentSeat]);

    // 早期返回必须在所有 hooks 之后
    if (!shouldShow) return null;

    // 获取按钮样式
    const getButtonStyle = () => {
        if (isGhostVoteUsed) {
            return 'bg-stone-900/95 border-stone-700 text-stone-600';
        }
        if (isLocked) {
            return 'bg-stone-900/95 border-stone-700 text-stone-500';
        }
        if (isRaised) {
            return isDead
                ? 'bg-purple-900/95 border-purple-500 text-purple-100 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                : 'bg-green-900/95 border-green-500 text-green-100 shadow-[0_0_20px_rgba(34,197,94,0.4)]';
        }
        return isDead
            ? 'bg-stone-900/95 border-purple-600 text-purple-300'
            : 'bg-stone-900/95 border-amber-600 text-amber-300';
    };

    // 获取按钮图标和文本
    const getButtonContent = () => {
        if (isGhostVoteUsed) return { icon: '👻', text: t('game.floatingVote.voteUsed') };
        if (isLocked) return { icon: '🔒', text: t('game.floatingVote.locked') };
        if (isLoading) return { icon: '⏳', text: '...' };
        if (isRaised) return { icon: '✋', text: t('game.floatingVote.alreadyVoted') };
        return isDead
            ? { icon: '👻', text: t('game.floatingVote.ghostVote') }
            : { icon: '🗳️', text: t('game.floatingVote.voteButton') };
    };

    const content = getButtonContent();

    return (
        <button
            onClick={handleClick}
            disabled={isDisabled}
            className={`
                md:hidden fixed bottom-20 left-1/2 -translate-x-1/2
                px-6 py-3 rounded-full border-2 font-bold
                flex items-center gap-2 backdrop-blur-sm
                transition-all duration-200 active:scale-95
                ${isDisabled ? 'cursor-not-allowed opacity-70' : 'animate-bounce'}
                ${getButtonStyle()}
            `}
            style={{
                zIndex: Z_INDEX.floatingPanel,
                marginBottom: 'env(safe-area-inset-bottom, 0px)'
            }}
        >
            <span className="text-xl">{content.icon}</span>
            <span className="font-cinzel tracking-wider">{content.text}</span>
            {/* 受审者信息 */}
            {gameState.voting?.nomineeSeatId !== undefined && (
                <span className="text-xs opacity-70 ml-1">
                    → {gameState.seats.find(s => s.id === gameState.voting?.nomineeSeatId)?.userName ?? '?'}
                </span>
            )}
        </button>
    );
};




