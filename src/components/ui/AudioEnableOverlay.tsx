import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';

/**
 * 音频启用引导遮罩
 * 在用户首次进入游戏时显示，引导用户点击以启用浏览器音频
 */
export const AudioEnableOverlay = () => {
    const { t } = useTranslation();
    const isAudioBlocked = useStore(state => state.isAudioBlocked);
    const setAudioBlocked = useStore(state => state.setAudioBlocked);
    const gameState = useStore(state => state.gameState);

    const [isVisible, setIsVisible] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // 检查是否需要显示引导
    useEffect(() => {
        // 只在游戏房间中且音频被阻止时显示
        if (gameState && isAudioBlocked && !hasInteracted) {
            // 延迟显示，避免闪烁
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 500);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
        return undefined;
    }, [gameState, isAudioBlocked, hasInteracted]);

    const handleClick = () => {
        setHasInteracted(true);
        setIsVisible(false);

        // 尝试播放静音音频来激活 AudioContext
        try {
            const audio = new Audio();
            audio.volume = 0;
            audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
            void audio.play()
                .then(() => {
                    audio.pause();
                    setAudioBlocked(false);
                })
                .catch(() => {
                    // 仍然失败，可能需要更多用户交互
                });
        } catch (e) {
            console.warn('Failed to activate audio:', e);
        }
    };

    if (!isVisible) return null;

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in cursor-pointer"
            onClick={handleClick}
        >
            <div className="max-w-md w-full bg-stone-900 border border-stone-700 rounded-lg p-8 text-center shadow-2xl">
                <div className="text-6xl mb-6 animate-bounce">🔊</div>
                <h2 className="text-2xl font-bold text-stone-200 mb-4 font-cinzel">{t('ui.audioEnableOverlay.title')}</h2>
                <p className="text-stone-400 mb-6">
                    {t('ui.audioEnableOverlay.browserBlocked')}<br />
                    {t('ui.audioEnableOverlay.clickToEnable')}
                </p>
                <button
                    className="px-8 py-3 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded-lg transition-colors shadow-lg"
                    onClick={handleClick}
                >
                    {t('ui.audioEnableOverlay.buttonText')}
                </button>
                <p className="text-xs text-stone-600 mt-4">
                    {t('ui.audioEnableOverlay.adjustLater')}
                </p>
            </div>
        </div>
    );
};



