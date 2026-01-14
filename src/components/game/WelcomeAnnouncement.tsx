
import React, { useState, useEffect } from 'react';

const WELCOME_DISMISSED_KEY = 'botc_welcome_dismissed_v1';

import { useStore } from '../../store';
import { Shield, Monitor, User, Volume2, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const WelcomeAnnouncement: React.FC = () => {
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [step, setStep] = useState<'audio-setup' | 'welcome'>('audio-setup');
    const { setAudioMode, audioSettings } = useStore();

    useEffect(() => {
        // 检查用户是否已经关闭过公告
        const dismissed = localStorage.getItem(WELCOME_DISMISSED_KEY);
        if (!dismissed) {
            setIsVisible(true);
        }
    }, []);

    const handleDismiss = (dontShowAgain: boolean) => {
        if (dontShowAgain) {
            localStorage.setItem(WELCOME_DISMISSED_KEY, 'true');
        }
        setIsVisible(false);
    };

    const handleAudioSetupComplete = () => {
        setStep('welcome');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="bg-[#1c1917] border-[3px] border-[#44403c] rounded-sm shadow-2xl w-full max-w-2xl mx-4 overflow-hidden relative">
                {/* Background Texture */}
                <div className="absolute inset-0 pointer-events-none opacity-40 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] z-0"></div>
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#0c0a09]/80 via-transparent to-[#0c0a09]/80 z-0"></div>

                {step === 'audio-setup' ? (
                    <div className="p-8 relative z-10 space-y-8">
                        <div className="text-center space-y-2">
                            <div className="w-16 h-16 rounded-full bg-[#292524] border-2 border-[#d4af37] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                                <Volume2 className="w-8 h-8 text-[#d4af37]" />
                            </div>
                            <h2 className="text-2xl font-bold text-[#e7e5e4] font-cinzel tracking-widest">
                                {t('game.welcomeAnnouncement.audioSetup.title')}
                            </h2>
                            <p className="text-[#a8a29e] font-serif text-sm">
                                {t('game.welcomeAnnouncement.audioSetup.subtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <button
                                onClick={() => setAudioMode('online')}
                                className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-4 relative overflow-hidden group ${
                                    audioSettings.mode === 'online'
                                        ? 'bg-[#292524] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                                        : 'bg-[#0c0a09] border-[#44403c] hover:border-[#78716c] opacity-60 hover:opacity-100'
                                }`}
                            >
                                <div className={`p-3 rounded-full ${audioSettings.mode === 'online' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#292524] text-[#78716c]'}`}>
                                    <User className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <h3 className={`font-bold font-cinzel text-lg ${audioSettings.mode === 'online' ? 'text-[#e7e5e4]' : 'text-[#78716c]'}`}>
                                        {t('game.welcomeAnnouncement.audioSetup.onlineMode')}
                                    </h3>
                                    <p className="text-xs text-[#a8a29e] mt-1">{t('game.welcomeAnnouncement.audioSetup.onlineModeDesc')}</p>
                                </div>
                                <ul className="text-[10px] text-[#78716c] space-y-1 text-left w-full px-2">
                                    <li className="flex items-center gap-1"><Check className="w-3 h-3" /> {t('game.welcomeAnnouncement.audioSetup.playAll')}</li>
                                    <li className="flex items-center gap-1 text-[#d4af37]"><Shield className="w-3 h-3" /> {t('game.welcomeAnnouncement.audioSetup.includeSensitive')}</li>
                                </ul>
                            </button>

                            <button
                                onClick={() => setAudioMode('offline')}
                                className={`p-6 rounded-lg border-2 transition-all flex flex-col items-center gap-4 relative overflow-hidden group ${
                                    audioSettings.mode === 'offline'
                                        ? 'bg-[#292524] border-[#d4af37] shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                                        : 'bg-[#0c0a09] border-[#44403c] hover:border-[#78716c] opacity-60 hover:opacity-100'
                                }`}
                            >
                                <div className={`p-3 rounded-full ${audioSettings.mode === 'offline' ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#292524] text-[#78716c]'}`}>
                                    <Monitor className="w-8 h-8" />
                                </div>
                                <div className="text-center">
                                    <h3 className={`font-bold font-cinzel text-lg ${audioSettings.mode === 'offline' ? 'text-[#e7e5e4]' : 'text-[#78716c]'}`}>
                                        {t('game.welcomeAnnouncement.audioSetup.offlineMode')}
                                    </h3>
                                    <p className="text-xs text-[#a8a29e] mt-1">{t('game.welcomeAnnouncement.audioSetup.offlineModeDesc')}</p>
                                </div>
                                <ul className="text-[10px] text-[#78716c] space-y-1 text-left w-full px-2">
                                    <li className="flex items-center gap-1"><Check className="w-3 h-3" /> {t('game.welcomeAnnouncement.audioSetup.onlyAmbient')}</li>
                                    <li className="flex items-center gap-1 text-[#4ade80]"><Shield className="w-3 h-3" /> {t('game.welcomeAnnouncement.audioSetup.autoBlock')}</li>
                                </ul>
                            </button>
                        </div>

                        <div className="flex justify-center pt-4">
                            <button
                                onClick={handleAudioSetupComplete}
                                className="px-10 py-3 bg-[#d4af37] hover:bg-[#b5952f] text-[#0c0a09] font-bold rounded-sm transition-all shadow-lg font-cinzel tracking-widest uppercase flex items-center gap-2 group"
                            >
                                <span>{t('game.welcomeAnnouncement.audioSetup.confirmSetup')}</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-[#0c0a09] p-8 border-b border-[#44403c] relative z-10 shadow-md">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-full bg-[#292524] border-2 border-[#57534e] flex items-center justify-center shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]">
                                    <span className="text-5xl filter drop-shadow-lg">📖</span>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-[#d6d3d1] font-cinzel tracking-[0.1em] drop-shadow-md">
                                        {t('game.welcomeAnnouncement.welcome.title')}
                                    </h2>
                                    <div className="h-0.5 w-full bg-gradient-to-r from-[#78716c] to-transparent my-2 opacity-50"></div>
                                    <p className="text-[#a8a29e] text-sm font-serif italic tracking-wide">
                                        {t('game.welcomeAnnouncement.welcome.subtitle')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 max-h-[60vh] overflow-y-auto space-y-8 relative z-10 scrollbar-thin scrollbar-thumb-[#44403c] scrollbar-track-[#1c1917]">
                            {/* 基本介绍 */}
                            <section>
                                <h3 className="text-[#d4af37] font-bold text-lg mb-3 flex items-center gap-2 font-cinzel tracking-wide border-b border-[#44403c] pb-1 w-fit">
                                    <span>✨</span> {t('game.welcomeAnnouncement.welcome.about')}
                                </h3>
                                <p className="text-[#d6d3d1] text-sm leading-relaxed font-serif pl-1">
                                    {t('game.welcomeAnnouncement.welcome.aboutDesc')}
                                </p>
                            </section>

                            {/* 主要功能 */}
                            <section>
                                <h3 className="text-[#d4af37] font-bold text-lg mb-4 flex items-center gap-2 font-cinzel tracking-wide border-b border-[#44403c] pb-1 w-fit">
                                    <span>🎯</span> {t('game.welcomeAnnouncement.welcome.features')}
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { icon: "🎭", title: t('game.welcomeAnnouncement.welcome.feature1Title'), desc: t('game.welcomeAnnouncement.welcome.feature1Subtitle') },
                                        { icon: "🌙", title: t('game.welcomeAnnouncement.welcome.feature2Title'), desc: t('game.welcomeAnnouncement.welcome.feature2Subtitle') },
                                        { icon: "⚖️", title: t('game.welcomeAnnouncement.welcome.feature3Title'), desc: t('game.welcomeAnnouncement.welcome.feature3Subtitle') },
                                        { icon: "🤖", title: t('game.welcomeAnnouncement.welcome.feature4Title'), desc: t('game.welcomeAnnouncement.welcome.feature4Subtitle') }
                                    ].map((item, idx) => (
                                        <div key={idx} className="bg-[#292524] rounded-sm p-4 border border-[#44403c] hover:border-[#78716c] transition-colors group shadow-sm">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl group-hover:scale-110 transition-transform">{item.icon}</span>
                                                <div>
                                                    <p className="text-[#e7e5e4] text-sm font-bold font-cinzel">{item.title}</p>
                                                    <p className="text-[#78716c] text-[10px] uppercase tracking-wider mt-1">{item.desc}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* 重要说明 */}
                            <section className="bg-[#2a1810]/60 rounded-sm p-5 border border-[#7c2d12]/30 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl pointer-events-none">⚠️</div>
                                <h3 className="text-[#fdba74] font-bold text-lg mb-4 flex items-center gap-2 font-cinzel tracking-wide relative z-10">
                                    <span>📜</span> {t('game.welcomeAnnouncement.welcome.important')}
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    <div className="flex items-start gap-3">
                                        <span className="text-[#f87171] mt-0.5 text-lg">🔊</span>
                                        <div>
                                            <p className="text-[#e7e5e4] text-sm font-bold font-cinzel">
                                                {t('game.welcomeAnnouncement.welcome.voiceTitle')}
                                            </p>
                                            <p className="text-[#a8a29e] text-xs mt-1 font-serif leading-relaxed">
                                                {t('game.welcomeAnnouncement.welcome.voiceDesc')} <strong className="text-[#fdba74]">{t('game.welcomeAnnouncement.welcome.voiceNotSupported')}</strong>{t('game.welcomeAnnouncement.welcome.voiceDesc2')}
                                            </p>
                                            <p className="text-[#34d399] text-xs mt-2 flex items-center gap-1 font-bold opacity-80">
                                                <span>🚀</span>
                                                <span>{t('game.welcomeAnnouncement.welcome.voiceComingSoon')}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-[#60a5fa] mt-0.5 text-lg">📱</span>
                                        <div>
                                            <p className="text-[#e7e5e4] text-sm font-bold font-cinzel">
                                                {t('game.welcomeAnnouncement.welcome.mobileTitle')}
                                            </p>
                                            <p className="text-[#a8a29e] text-xs mt-1 font-serif">
                                                {t('game.welcomeAnnouncement.welcome.mobileDesc')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-[#c084fc] mt-0.5 text-lg">☁️</span>
                                        <div>
                                            <p className="text-[#e7e5e4] text-sm font-bold font-cinzel">
                                                {t('game.welcomeAnnouncement.welcome.syncTitle')}
                                            </p>
                                            <p className="text-[#a8a29e] text-xs mt-1 font-serif">
                                                {t('game.welcomeAnnouncement.welcome.syncDesc')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* 快速入门 */}
                            <section>
                                <h3 className="text-[#d4af37] font-bold text-lg mb-3 flex items-center gap-2 font-cinzel tracking-wide border-b border-[#44403c] pb-1 w-fit">
                                    <span>🎮</span> {t('game.welcomeAnnouncement.welcome.quickStart')}
                                </h3>
                                <ol className="text-[#d6d3d1] text-sm space-y-2 list-decimal list-inside font-serif pl-2 marker:text-[#78716c]">
                                    <li>{t('game.welcomeAnnouncement.welcome.step1')}</li>
                                    <li>{t('game.welcomeAnnouncement.welcome.step2')}</li>
                                    <li>{t('game.welcomeAnnouncement.welcome.step3')}</li>
                                    <li>{t('game.welcomeAnnouncement.welcome.step4')}</li>
                                </ol>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-[#0c0a09] border-t border-[#44403c] flex items-center justify-between relative z-10">
                            <label className="flex items-center gap-2 text-[#78716c] text-sm cursor-pointer hover:text-[#a8a29e] transition-colors group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        id="dontShowAgain"
                                        className="peer h-4 w-4 cursor-pointer appearance-none rounded-sm border border-[#57534e] bg-[#1c1917] checked:border-[#d4af37] checked:bg-[#d4af37] transition-all"
                                    />
                                    <svg className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 peer-checked:opacity-100 w-3 h-3 text-black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <span className="font-serif group-hover:underline decoration-[#57534e] underline-offset-4">{t('game.welcomeAnnouncement.welcome.dontShowAgain')}</span>
                            </label>
                            <button
                                onClick={() => {
                                    const checkbox = document.getElementById('dontShowAgain') as HTMLInputElement;
                                    handleDismiss(checkbox?.checked || false);
                                }}
                                className="px-8 py-3 bg-[#292524] hover:bg-[#44403c] text-[#e7e5e4] font-bold rounded-sm transition-all shadow-lg border border-[#57534e] font-cinzel tracking-widest uppercase hover:shadow-[#d4af37]/20 hover:border-[#d4af37]/50 flex items-center gap-2 group"
                            >
                                <span>{t('game.welcomeAnnouncement.welcome.enterGrimoire')}</span>
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};





