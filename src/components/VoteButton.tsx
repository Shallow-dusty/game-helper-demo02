import React, { useState, useCallback } from 'react';

interface VoteButtonProps {
    isRaised: boolean;
    isLocked: boolean;
    isDead?: boolean;
    hasGhostVote?: boolean;
    onToggle: () => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({ 
    isRaised, 
    isLocked, 
    isDead = false,
    hasGhostVote = true,
    onToggle 
}) => {
    const [isLoading, setIsLoading] = useState(false);
    
    // 死亡且无幽灵票时禁用
    const isGhostVoteUsed = isDead && !hasGhostVote;
    const isDisabled = isLoading || isLocked || isGhostVoteUsed;
    
    const handleClick = useCallback(() => {
        if (isDisabled) return;
        setIsLoading(true);
        onToggle();
        // 延迟后重置 loading（给予视觉反馈）
        setTimeout(() => setIsLoading(false), 300);
    }, [isDisabled, onToggle]);
    
    // 获取按钮显示文本
    const getButtonText = () => {
        if (isGhostVoteUsed) return '👻 幽灵票已使用';
        if (isLocked) return '🔒 状态已锁定';
        if (isLoading) return '⏳ 处理中...';
        if (isRaised) return '✋ 已举手';
        return isDead ? '👻 使用幽灵票？' : '举手投票？';
    };

    // 获取按钮样式
    const getButtonStyle = () => {
        if (isGhostVoteUsed) {
            return 'bg-stone-900 border-stone-700 text-stone-600 cursor-not-allowed opacity-60';
        }
        if (isLocked) {
            return 'bg-stone-900 border-stone-700 text-stone-500 cursor-not-allowed';
        }
        if (isLoading) {
            return 'bg-stone-800 border-stone-600 text-stone-500 cursor-wait';
        }
        if (isRaised) {
            return isDead 
                ? 'bg-purple-900 border-purple-600 hover:bg-purple-800 text-purple-100'
                : 'bg-green-900 border-green-600 hover:bg-green-800 text-green-100';
        }
        return isDead
            ? 'bg-stone-800 border-purple-700 hover:bg-stone-700 text-purple-300'
            : 'bg-stone-700 border-stone-500 hover:bg-stone-600 text-stone-300';
    };
    
    return (
        <div className={isGhostVoteUsed ? '' : 'animate-bounce'}>
            <button
                onClick={handleClick}
                disabled={isDisabled}
                className={`w-full py-4 rounded-sm text-xl font-bold shadow-xl transition-all border-2 font-cinzel tracking-wider ${getButtonStyle()}`}
            >
                {getButtonText()}
            </button>
            {/* 幽灵票状态提示 */}
            {isDead && hasGhostVote && !isRaised && (
                <p className="text-xs text-purple-400 text-center mt-1 animate-pulse">
                    你还有一张幽灵票可用
                </p>
            )}
        </div>
    );
};
