import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store';
import { X, Volume2, Monitor, User, Shield, Music, MousePointer, Bell, Globe, Wand2, Compass, Hand } from 'lucide-react';
import { LanguageSelector } from '../ui/LanguageSelector';
import { useTranslation } from 'react-i18next';

interface AudioSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const { audioSettings, setAudioMode, toggleAudioCategory, gameState, setRuleAutomationLevel } = useStore();
    const ruleAutomationLevel = gameState?.ruleAutomationLevel ?? 'GUIDED';
    const isAutomationAvailable = Boolean(gameState);

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
                                {t('audio.settingsTitle')}
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
                                <Shield className="w-4 h-4" /> {t('audio.privacyMode')}
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
                                        {t('audio.onlineMode')}
                                    </span>
                                    <span className="text-[10px] text-[#a8a29e] text-center">
                                        {t('audio.onlineModeDesc')}
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
                                        {t('audio.offlineMode')}
                                    </span>
                                    <span className="text-[10px] text-[#a8a29e] text-center">
                                        {t('audio.offlineModeDesc')}
                                    </span>
                                </button>
                            </div>
                            
                            {/* Mode Description */}
                            <div className="bg-[#0c0a09]/50 p-3 rounded border border-[#44403c] text-xs text-[#a8a29e] leading-relaxed">
                                {audioSettings.mode === 'online' ? (
                                    <p className="flex items-start gap-2">
                                        <span className="text-[#d4af37]">⚠️</span>
                                        <span>
                                            <strong className="text-[#e7e5e4]">{t('audio.privacyWarning')}</strong>
                                            {t('audio.privacyWarningDesc')}
                                        </span>
                                    </p>
                                ) : (
                                    <p className="flex items-start gap-2">
                                        <span className="text-[#4ade80]">✓</span>
                                        <span>
                                            <strong className="text-[#e7e5e4]">{t('audio.safeMode')}</strong>
                                            {t('audio.safeModeDesc')}
                                        </span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Rule Automation */}
                        <div className="space-y-4">
                            <h3 className="text-[#a8a29e] text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Wand2 className="w-4 h-4" /> {t('audio.ruleAutomation')}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    {
                                        level: 'FULL_AUTO',
                                        icon: Wand2,
                                        label: t('audio.ruleAutomationFull'),
                                        desc: t('audio.ruleAutomationFullDesc'),
                                    },
                                    {
                                        level: 'GUIDED',
                                        icon: Compass,
                                        label: t('audio.ruleAutomationGuided'),
                                        desc: t('audio.ruleAutomationGuidedDesc'),
                                    },
                                    {
                                        level: 'MANUAL',
                                        icon: Hand,
                                        label: t('audio.ruleAutomationManual'),
                                        desc: t('audio.ruleAutomationManualDesc'),
                                    },
                                ].map(({ level, icon: IconComponent, label, desc }) => {
                                    const isActive = ruleAutomationLevel === level;
                                    return (
                                        <button
                                            key={level}
                                            onClick={() => setRuleAutomationLevel(level as 'FULL_AUTO' | 'GUIDED' | 'MANUAL')}
                                            disabled={!isAutomationAvailable}
                                            className={`p-3 rounded-md border transition-all flex flex-col items-center gap-2 relative overflow-hidden group ${
                                                isActive
                                                    ? 'bg-[#292524] border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                                                    : 'bg-[#0c0a09] border-[#44403c] hover:border-[#78716c] opacity-60 hover:opacity-100'
                                            } ${!isAutomationAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        >
                                            <IconComponent className={`w-7 h-7 ${isActive ? 'text-[#d4af37]' : 'text-[#78716c]'}`} />
                                            <span className={`font-bold font-cinzel text-sm ${isActive ? 'text-[#e7e5e4]' : 'text-[#78716c]'}`}>
                                                {label}
                                            </span>
                                            <span className="text-[10px] text-[#a8a29e] text-center leading-snug">
                                                {desc}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="bg-[#0c0a09]/50 p-3 rounded border border-[#44403c] text-xs text-[#a8a29e] leading-relaxed">
                                {t('audio.ruleAutomationDesc')}
                            </div>
                        </div>

                        {/* Categories */}
                        <div className="space-y-4">
                            <h3 className="text-[#a8a29e] text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Volume2 className="w-4 h-4" /> {t('audio.categories')}
                            </h3>
                            <div className="space-y-2">
                                {/* Ambience */}
                                <div className="flex items-center justify-between p-3 bg-[#292524]/50 rounded border border-[#44403c]">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[#0c0a09] rounded text-[#d4af37]">
                                            <Music className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="text-[#e7e5e4] font-bold text-sm">{t('audio.ambience')}</p>
                                            <p className="text-[#78716c] text-xs">{t('audio.ambienceDesc')}</p>
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
                                            <p className="text-[#e7e5e4] font-bold text-sm">{t('audio.ui')}</p>
                                            <p className="text-[#78716c] text-xs">{t('audio.uiDesc')}</p>
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
                                                {audioSettings.mode === 'offline' ? t('audio.cuesDisabled') : t('audio.cues')}
                                            </p>
                                            <p className="text-[#78716c] text-xs">{t('audio.cuesDesc')}</p>
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

                        {/* Language Settings */}
                        <div className="space-y-4">
                            <h3 className="text-[#a8a29e] text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                                <Globe className="w-4 h-4" /> {t('audio.language')}
                            </h3>
                            <div className="p-4 bg-[#292524]/50 rounded border border-[#44403c]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[#e7e5e4] font-bold text-sm">{t('audio.interfaceLanguage')}</p>
                                        <p className="text-[#78716c] text-xs">{t('audio.selectLanguage')}</p>
                                    </div>
                                    <LanguageSelector />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
