import React, { useState } from 'react';

export const GameRules: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [expandedSection, setExpandedSection] = useState<string | null>('basic');

    const toggleSection = (section: string) => {
        setExpandedSection(expandedSection === section ? null : section);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-stone-900 rounded-lg border border-stone-800 overflow-hidden w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="p-3 bg-stone-950 border-b border-stone-800 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-stone-300 font-cinzel">📜 游戏规则 (Game Rules)</h3>
                    {onClose && (
                        <button onClick={onClose} className="text-stone-500 hover:text-stone-300">
                            ✕
                        </button>
                    )}
                </div>

                <div className="divide-y divide-stone-800">
                    {/* Basic Rules */}
                    <div className="bg-stone-900/50">
                        <button
                            onClick={() => toggleSection('basic')}
                            className="w-full p-3 flex justify-between items-center text-left hover:bg-stone-800/50 transition-colors"
                        >
                            <span className="text-xs font-bold text-stone-400">基础流程</span>
                            <span className="text-stone-600">{expandedSection === 'basic' ? '−' : '+'}</span>
                        </button>
                        {expandedSection === 'basic' && (
                            <div className="p-3 pt-0 text-xs text-stone-500 leading-relaxed space-y-2">
                                <p>游戏分为**白天**和**夜晚**两个阶段交替进行。</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>**夜晚**: 所有玩家闭眼，特定角色睁眼发动技能。</li>
                                    <li>**白天**: 所有玩家睁眼，自由讨论。</li>
                                    <li>**提名与投票**: 白天讨论后，玩家可以提名处决嫌疑人。</li>
                                    <li>**处决**: 得票数超过半数且最高的玩家被处决（死亡）。</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Winning Conditions */}
                    <div className="bg-stone-900/50">
                        <button
                            onClick={() => toggleSection('winning')}
                            className="w-full p-3 flex justify-between items-center text-left hover:bg-stone-800/50 transition-colors"
                        >
                            <span className="text-xs font-bold text-stone-400">获胜条件</span>
                            <span className="text-stone-600">{expandedSection === 'winning' ? '−' : '+'}</span>
                        </button>
                        {expandedSection === 'winning' && (
                            <div className="p-3 pt-0 text-xs text-stone-500 leading-relaxed space-y-2">
                                <p><strong className="text-blue-400">好人阵营 (Good)</strong> 获胜条件：</p>
                                <ul className="list-disc pl-4 space-y-1 mb-2">
                                    <li>处决恶魔。</li>
                                    <li>或者，场上没有恶魔存活。</li>
                                </ul>
                                <p><strong className="text-red-400">邪恶阵营 (Evil)</strong> 获胜条件：</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>场上仅剩 2 名玩家存活（其中包含恶魔）。</li>
                                    <li>或者，达成特定角色的特殊获胜条件（如小恶魔自杀传递给爪牙）。</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Death & Ghost Votes */}
                    <div className="bg-stone-900/50">
                        <button
                            onClick={() => toggleSection('death')}
                            className="w-full p-3 flex justify-between items-center text-left hover:bg-stone-800/50 transition-colors"
                        >
                            <span className="text-xs font-bold text-stone-400">死亡与幽灵票</span>
                            <span className="text-stone-600">{expandedSection === 'death' ? '−' : '+'}</span>
                        </button>
                        {expandedSection === 'death' && (
                            <div className="p-3 pt-0 text-xs text-stone-500 leading-relaxed space-y-2">
                                <p>死亡的玩家：</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>失去技能（除非特定角色）。</li>
                                    <li>仍然可以发言和参与讨论。</li>
                                    <li>获得 **1 张幽灵票**，可在整局游戏的任意一次投票中使用。</li>
                                    <li>使用后幽灵票消失，无法再次投票。</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};




