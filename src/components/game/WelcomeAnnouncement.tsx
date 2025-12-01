
import React, { useState, useEffect } from 'react';

const WELCOME_DISMISSED_KEY = 'botc_welcome_dismissed_v1';

export const WelcomeAnnouncement: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

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

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-gradient-to-b from-stone-900 to-stone-950 border border-amber-800/50 rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-900/50 to-amber-900/50 p-6 border-b border-amber-800/30">
                    <div className="flex items-center gap-4">
                        <div className="text-5xl">📖</div>
                        <div>
                            <h2 className="text-2xl font-bold text-amber-200 font-cinzel tracking-wider">
                                欢迎使用血染钟楼魔典
                            </h2>
                            <p className="text-stone-400 text-sm mt-1">
                                Blood on the Clocktower Digital Grimoire
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
                    {/* 基本介绍 */}
                    <section>
                        <h3 className="text-amber-400 font-bold text-lg mb-2 flex items-center gap-2">
                            <span>✨</span> 关于魔典
                        </h3>
                        <p className="text-stone-300 text-sm leading-relaxed">
                            这是一个为《血染钟楼》桌游设计的线上辅助工具，帮助说书人管理游戏状态、分配角色、记录信息，
                            同时让玩家可以远程参与游戏。
                        </p>
                    </section>

                    {/* 主要功能 */}
                    <section>
                        <h3 className="text-amber-400 font-bold text-lg mb-3 flex items-center gap-2">
                            <span>🎯</span> 主要功能
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700">
                                <span className="text-lg">🎭</span>
                                <p className="text-stone-300 text-sm mt-1">角色分配与管理</p>
                            </div>
                            <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700">
                                <span className="text-lg">🌙</span>
                                <p className="text-stone-300 text-sm mt-1">夜间行动流程</p>
                            </div>
                            <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700">
                                <span className="text-lg">⚖️</span>
                                <p className="text-stone-300 text-sm mt-1">投票与提名</p>
                            </div>
                            <div className="bg-stone-800/50 rounded-lg p-3 border border-stone-700">
                                <span className="text-lg">🤖</span>
                                <p className="text-stone-300 text-sm mt-1">AI规则咨询助手</p>
                            </div>
                        </div>
                    </section>

                    {/* 重要说明 */}
                    <section className="bg-amber-950/30 rounded-lg p-4 border border-amber-800/30">
                        <h3 className="text-amber-400 font-bold text-lg mb-2 flex items-center gap-2">
                            <span>⚠️</span> 重要说明
                        </h3>
                        <div className="space-y-3">
                            <div className="flex items-start gap-3">
                                <span className="text-red-400 mt-0.5">🔊</span>
                                <div>
                                    <p className="text-stone-200 text-sm font-medium">
                                        语音通话功能
                                    </p>
                                    <p className="text-stone-400 text-xs mt-1">
                                        本魔典 <strong className="text-amber-300">暂不支持内置语音室功能</strong>。
                                        进行线上游戏时，请使用第三方语音工具（如 Discord、腾讯会议、微信群通话等）进行沟通。
                                    </p>
                                    <p className="text-emerald-400 text-xs mt-2 flex items-center gap-1">
                                        <span>🚀</span>
                                        <span>语音室功能已加入开发计划，敬请期待！</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-blue-400 mt-0.5">📱</span>
                                <div>
                                    <p className="text-stone-200 text-sm font-medium">
                                        移动端支持
                                    </p>
                                    <p className="text-stone-400 text-xs mt-1">
                                        支持手机和平板访问，触摸操作已优化。长按座位可打开操作菜单。
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-purple-400 mt-0.5">☁️</span>
                                <div>
                                    <p className="text-stone-200 text-sm font-medium">
                                        实时同步
                                    </p>
                                    <p className="text-stone-400 text-xs mt-1">
                                        游戏状态通过云端实时同步，所有玩家都能看到最新信息。
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 快速入门 */}
                    <section>
                        <h3 className="text-amber-400 font-bold text-lg mb-2 flex items-center gap-2">
                            <span>🎮</span> 快速开始
                        </h3>
                        <ol className="text-stone-300 text-sm space-y-2 list-decimal list-inside">
                            <li>说书人创建房间，选择剧本和人数</li>
                            <li>分享房间码给玩家加入</li>
                            <li>玩家点击座位入座</li>
                            <li>说书人分配角色后开始游戏</li>
                        </ol>
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-stone-500 text-sm cursor-pointer hover:text-stone-400">
                        <input
                            type="checkbox"
                            id="dontShowAgain"
                            className="rounded border-stone-600 bg-stone-800 text-amber-600 focus:ring-amber-500"
                        />
                        <span>不再显示</span>
                    </label>
                    <button
                        onClick={() => {
                            const checkbox = document.getElementById('dontShowAgain') as HTMLInputElement;
                            handleDismiss(checkbox?.checked || false);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-amber-900/50"
                    >
                        进入魔典 →
                    </button>
                </div>
            </div>
        </div>
    );
};




