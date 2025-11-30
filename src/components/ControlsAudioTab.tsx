import React from 'react';
import { useStore } from '../store';
import { SOUND_EFFECTS, AUDIO_TRACKS } from '../constants';

export const ControlsAudioTab: React.FC = () => {
    const gameState = useStore(state => state.gameState);
    const setAudioTrack = useStore(state => state.setAudioTrack);
    const setAudioVolume = useStore(state => state.setAudioVolume);
    const toggleAudioPlay = useStore(state => state.toggleAudioPlay);

    if (!gameState) return null;

    const { audio } = gameState;

    const playSoundEffect = (url: string) => {
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.play().catch(e => console.error("Failed to play SFX:", e));
    };

    return (
        <div className="h-full overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {/* Background Music Control */}
            <div className="bg-stone-900/50 rounded border border-stone-800 p-4">
                <h3 className="text-stone-400 text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                    <span>🎵</span> 背景音乐 (BGM)
                </h3>

                <div className="space-y-4">
                    {/* Playback Controls */}
                    <div className="flex items-center justify-between bg-stone-950 p-3 rounded border border-stone-800">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleAudioPlay}
                                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${audio.isPlaying
                                        ? 'bg-amber-600 text-white shadow-[0_0_10px_rgba(217,119,6,0.4)]'
                                        : 'bg-stone-800 text-stone-400 hover:bg-stone-700'
                                    }`}
                            >
                                {audio.isPlaying ? '⏸' : '▶'}
                            </button>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-stone-200">
                                    {AUDIO_TRACKS[audio.trackId || 'silence']?.name || '未知音轨'}
                                </span>
                                <span className="text-xs text-stone-500">
                                    {audio.isPlaying ? '正在播放' : '已暂停'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-stone-500">
                            <span>音量</span>
                            <span>{Math.round(audio.volume * 100)}%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={audio.volume}
                            onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-600"
                        />
                    </div>

                    {/* Track Selection */}
                    <div className="space-y-2">
                        <label className="text-xs text-stone-500">选择音轨</label>
                        <div className="grid grid-cols-1 gap-2">
                            {Object.entries(AUDIO_TRACKS).map(([id, track]) => (
                                <button
                                    key={id}
                                    onClick={() => setAudioTrack(id)}
                                    className={`text-left px-3 py-2 rounded text-xs transition-colors border ${audio.trackId === id
                                            ? 'bg-amber-900/30 border-amber-800 text-amber-200'
                                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:bg-stone-800 hover:border-stone-700'
                                        }`}
                                >
                                    {track.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Instant Sound Effects */}
            <div className="bg-stone-900/50 rounded border border-stone-800 p-4">
                <h3 className="text-stone-400 text-xs uppercase tracking-wider font-bold mb-4 flex items-center gap-2">
                    <span>🔊</span> 即时音效 (SFX)
                </h3>

                <div className="grid grid-cols-2 gap-3">
                    {SOUND_EFFECTS.map(sfx => (
                        <button
                            key={sfx.id}
                            onClick={() => playSoundEffect(sfx.url)}
                            className="flex items-center gap-2 p-3 bg-stone-800 hover:bg-stone-700 active:bg-amber-900/50 active:scale-95 border border-stone-700 hover:border-stone-600 rounded transition-all group"
                        >
                            <span className="text-lg group-hover:scale-110 transition-transform duration-300">{sfx.name.split(' ')[0]}</span>
                            <span className="text-xs font-bold text-stone-300 group-hover:text-white">{sfx.name.split(' ')[1]}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};
