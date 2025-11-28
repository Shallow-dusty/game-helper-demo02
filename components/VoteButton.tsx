import React, { useState, useCallback } from 'react';

interface VoteButtonProps {
    isRaised: boolean;
    isLocked: boolean;
    onToggle: () => void;
}

export const VoteButton: React.FC<VoteButtonProps> = ({ isRaised, isLocked, onToggle }) => {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleClick = useCallback(() => {
        if (isLoading || isLocked) return;
        setIsLoading(true);
        onToggle();
        // 延迟后重置 loading（给予视觉反馈）
        setTimeout(() => setIsLoading(false), 300);
    }, [isLoading, isLocked, onToggle]);
    
    return (
        <div className="animate-bounce">
            <button
                onClick={handleClick}
                disabled={isLoading || isLocked}
                className={`w-full py-4 rounded-sm text-xl font-bold shadow-xl transition-all border-2 font-cinzel tracking-wider ${
                    isLocked
                        ? 'bg-stone-900 border-stone-700 text-stone-500 cursor-not-allowed'
                        : isLoading 
                            ? 'bg-stone-800 border-stone-600 text-stone-500 cursor-wait'
                            : isRaised 
                            ? 'bg-green-900 border-green-600 hover:bg-green-800 text-green-100' 
                            : 'bg-stone-700 border-stone-500 hover:bg-stone-600 text-stone-300'
                }`}
            >
                {isLocked ? '🔒 状态已锁定' : isLoading ? '⏳ 处理中...' : isRaised ? '✋ 已举手' : '举手投票？'}
            </button>
        </div>
    );
};
