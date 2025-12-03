import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { X, Volume2, Monitor, User, Shield, Music, MousePointer, Bell } from 'lucide-react';

interface AudioSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
    const { audioSettings, setAudioMode, toggleAudioCategory } = useStore();

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[#1c1917] border border-[#44403c] rounded-lg shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Background Texture */}
                    <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] z-0"></div>

                    {/* Header */}
                    <div className="p-6 border-b border-[#44403c] flex items-center justify-between relative z-10 bg-[#0c0a09]/50">
                        <div className="flex items-center gap-3">
                            <Volume2 className="w-6 h-6 text-[#d4af37]" />
                            <h2 className="text-xl font-bold text-[#e7e5e4] font-cinzel tracking-wider">
                                音频设置
                            </h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-[#78716c] hover:text-[#d4af37] transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-8 relative z-10">
                        {/* Mode Selection */}
                        <div className="space-y-4">
                            <h3 className="text-[#a8a29e] text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Shield className="w-4 h-4" /> 隐私模式
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setAudioMode('online')}
                                    className={`p-4 rounded-md border transition-all flex flex-col items-center gap-2 relative overflow-hidden group ${
                                        audioSettings.mode === 'online'
                                            ? 'bg-[#292524] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                            : 'bg-[#0c0a09] border-[#44403c] hover:border-[#78716c] opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <User className={`w-8 h-8 ${audioSettings.mode === 'online' ? 'text-[#d4af37]' : 'text-[#78716c]'}`} />
                                    <span className={`font-bold font-cinzel ${audioSettings.mode === 'online' ? 'text-[#e7e5e4]' : 'text-[#78716c]'}`}>
                                        在线模式
                                    </span>
                                    <span className="text-[10px] text-[#a8a29e] text-center">
                                        个人设备使用<br/>播放所有音效
                                    </span>
                                </button>

                                <button
                                    onClick={() => setAudioMode('offline')}
                                    className={`p-4 rounded-md border transition-all flex flex-col items-center gap-2 relative overflow-hidden group ${
                                        audioSettings.mode === 'offline'
                                            ? 'bg-[#292524] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                            : 'bg-[#0c0a09] border-[#44403c] hover:border-[#78716c] opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <Monitor className={`w-8 h-8 ${audioSettings.mode === 'offline' ? 'text-[#d4af37]' : 'text-[#78716c]'}`} />
                                    <span className={`font-bold font-cinzel ${audioSettings.mode === 'offline' ? 'text-[#e7e5e4]' : 'text-[#78716c]'}`}>
                                        线下/投屏
                                    </span>
                                    <span className="text-[10px] text-[#a8a29e] text-center">
                                        公共屏幕使用<br/>隐藏秘密音效
                                    </span>
                                </button>
                            </div>
                            
                            {/* Mode Description */}
                            <div className="bg-[#0c0a09]/50 p-3 rounded border border-[#44403c] text-xs text-[#a8a29e] leading-relaxed">
                                {audioSettings.mode === 'online' ? (
                                    <p className="flex items-start gap-2">
                                        <span className="text-[#d4af37]">⚠️</span>
                                        <span>
                                            <strong className="text-[#e7e5e4]">注意隐私泄露：</strong>
                                            此模式会播放包含身份信息的提示音（如夜间行动反馈）。请勿在公共屏幕上使用此模式。
                                        </span>
                                    </p>
                                ) : (
                                    <p className="flex items-start gap-2">
                                        <span className="text-[#4ade80]">✓</span>
                                        <span>
                                            <strong className="text-[#e7e5e4]">安全投屏：</strong>
                                            已自动屏蔽所有敏感提示音。适合通过投影仪或直播展示给所有玩家观看。
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="space-y-4">
                            <h3 className="text-[#a8a29e] text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Volume2 className="w-4 h-4" /> 音效类别
                            </h3>
                            <div className="space-y-2">
                                {/* Ambience */}
                                <div className="flex items-center justify-between p-3 bg-[#292524]/50 rounded border border-[#44403c]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#0c0a09] rounded text-[#d4af37]">
                                            <Music className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[#e7e5e4] font-bold text-sm">氛围音效</p>
                                            <p className="text-[#78716c] text-xs">BGM、钟声、环境音</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={audioSettings.categories.ambience}
                                            onChange={() => toggleAudioCategory('ambience')}
                                        />
                                        <div className="w-11 h-6 bg-[#44403c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#a8a29e] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37] peer-checked:after:bg-white"></div>
                                    </label>
                                </div>

                                {/* UI */}
                                <div className="flex items-center justify-between p-3 bg-[#292524]/50 rounded border border-[#44403c]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#0c0a09] rounded text-[#d4af37]">
                                            <MousePointer className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[#e7e5e4] font-bold text-sm">界面音效</p>
                                            <p className="text-[#78716c] text-xs">点击、拖拽、纸张声</p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={audioSettings.categories.ui}
                                            onChange={() => toggleAudioCategory('ui')}
                                        />
                                        <div className="w-11 h-6 bg-[#44403c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#a8a29e] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37] peer-checked:after:bg-white"></div>
                                    </label>
                                </div>

                                {/* Cues */}
                                <div className={`flex items-center justify-between p-3 rounded border transition-colors ${
                                    audioSettings.mode === 'offline' 
                                        ? 'bg-[#0c0a09]/30 border-[#44403c]/30 opacity-50 cursor-not-allowed' 
                                        : 'bg-[#292524]/50 border-[#44403c]'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded ${audioSettings.mode === 'offline' ? 'bg-[#1c1917] text-[#57534e]' : 'bg-[#0c0a09] text-[#d4af37]'}`}>
                                            <Bell className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className={`font-bold text-sm ${audioSettings.mode === 'offline' ? 'text-[#57534e]' : 'text-[#e7e5e4]'}`}>
                                                提示音效 {audioSettings.mode === 'offline' && '(已禁用)'}
                                            </p>
                                            <p className="text-[#78716c] text-xs">夜间行动、私聊提示</p>
                                        </div>
                                    </div>
                                    <label className={`relative inline-flex items-center ${audioSettings.mode === 'offline' ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={audioSettings.categories.cues}
                                            onChange={() => toggleAudioCategory('cues')}
                                            disabled={audioSettings.mode === 'offline'}
                                        />
                                        <div className="w-11 h-6 bg-[#44403c] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#a8a29e] after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#d4af37] peer-checked:after:bg-white"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
