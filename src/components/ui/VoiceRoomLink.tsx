import React, { useState } from 'react';
import { useStore } from '../../store';

/**
 * 语音房间链接组件
 * 显示在游戏控制面板中，用于设置和显示外部语音房间链接
 */
export const VoiceRoomLink: React.FC = () => {
    const user = useStore(state => state.user);
    const gameState = useStore(state => state.gameState);
    const syncToCloud = useStore(state => state.syncToCloud);
    
    const [isEditing, setIsEditing] = useState(false);
    const [inputValue, setInputValue] = useState(gameState?.voiceRoomUrl || '');

    if (!gameState) return null;

    const handleSave = () => {
        if (!gameState) return;
        
        // 更新游戏状态
        const newState = { ...gameState, voiceRoomUrl: inputValue.trim() || undefined };
        useStore.setState({ gameState: newState });
        void syncToCloud();
        setIsEditing(false);
    };

    const handleClear = () => {
        if (!gameState) return;
        
        const newState = { ...gameState, voiceRoomUrl: undefined };
        useStore.setState({ gameState: newState });
        void syncToCloud();
        setInputValue('');
        setIsEditing(false);
    };

    const openVoiceRoom = () => {
        if (gameState.voiceRoomUrl) {
            window.open(gameState.voiceRoomUrl, '_blank', 'noopener,noreferrer');
        }
    };

    const isStoryteller = user?.isStoryteller || false;

    return (
        <div className="bg-stone-900 rounded border border-stone-700 p-3">
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-stone-500 uppercase flex items-center gap-2">
                    🎙️ 语音房间
                </span>
                {isStoryteller && !isEditing && (
                    <button
                        onClick={() => {
                            setInputValue(gameState.voiceRoomUrl || '');
                            setIsEditing(true);
                        }}
                        className="text-[10px] text-blue-400 hover:text-blue-300"
                    >
                        {gameState.voiceRoomUrl ? '编辑' : '添加'}
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-2">
                    <input
                        type="url"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="输入 Discord/QQ/腾讯会议链接..."
                        className="w-full bg-stone-950 border border-stone-700 rounded px-3 py-2 text-base text-stone-300 focus:border-blue-600 focus:outline-none"
                        autoFocus
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs font-bold"
                        >
                            保存
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-400 rounded text-xs"
                        >
                            取消
                        </button>
                        {gameState.voiceRoomUrl && (
                            <button
                                onClick={handleClear}
                                className="py-1.5 px-3 bg-red-900/30 hover:bg-red-800/50 text-red-400 rounded text-xs"
                            >
                                清除
                            </button>
                        )}
                    </div>
                </div>
            ) : gameState.voiceRoomUrl ? (
                <div className="flex items-center gap-2">
                    <button
                        onClick={openVoiceRoom}
                        className="flex-1 py-2 px-3 bg-green-900/30 hover:bg-green-800/50 text-green-300 rounded text-sm font-bold border border-green-800/50 transition-colors flex items-center justify-center gap-2"
                    >
                        <span>🔗</span>
                        <span>加入语音房间</span>
                        <span className="text-xs text-green-400/70">↗</span>
                    </button>
                </div>
            ) : (
                <div className="text-xs text-stone-600 italic text-center py-2">
                    {isStoryteller ? '点击"添加"设置语音房间链接' : '说书人尚未设置语音房间'}
                </div>
            )}
            
            {gameState.voiceRoomUrl && (
                <p className="text-[10px] text-stone-600 mt-2 truncate" title={gameState.voiceRoomUrl}>
                    {gameState.voiceRoomUrl.length > 40 
                        ? gameState.voiceRoomUrl.substring(0, 40) + '...' 
                        : gameState.voiceRoomUrl}
                </p>
            )}
        </div>
    );
};



