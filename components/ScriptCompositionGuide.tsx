import React, { useState } from 'react';
import { ROLES, SCRIPTS } from '../constants';
import type { RoleDef } from '../types';

interface CompositionStrategy {
    id: string;
    name: string;
    description: string;
    difficulty: '新手' | '中等' | '困难';
    guidelines: {
        infoRolesRatio: { min: number; max: number }; // 信息类占比
        powerRolesRatio: { min: number; max: number }; // 功能类占比
        recommendedMinions: string[];
        recommendedOutsiders: string[];
        tips: string[];
    };
}

const STRATEGIES: CompositionStrategy[] = [
    {
        id: 'balanced',
        name: '平衡打法',
        description: '双方势均力敌，适合常规游戏',
        difficulty: '中等',
        guidelines: {
            infoRolesRatio: { min: 0.4, max: 0.5 },
            powerRolesRatio: { min: 0.3, max: 0.4 },
            recommendedMinions: ['poisoner', 'spy', 'baron'],
            recommendedOutsiders: ['drunk', 'recluse'],
            tips: [
                '2-3个首夜信息 + 1-2个持续信息',
                '下毒者或间谍优先',
                '醉酒者必选'
            ]
        }
    },
    {
        id: 'evil_favored',
        name: '邪恶优势',
        description: '增加好人难度，适合经验玩家',
        difficulty: '困难',
        guidelines: {
            infoRolesRatio: { min: 0.2, max: 0.3 },
            powerRolesRatio: { min: 0.4, max: 0.5 },
            recommendedMinions: ['poisoner', 'spy'],
            recommendedOutsiders: ['drunk', 'recluse', 'saint'],
            tips: [
                '仅1个首夜信息角色',
                '下毒者+间谍组合',
                '2个局外人',
                '说书人积极使用下毒'
            ]
        }
    },
    {
        id: 'good_favored',
        name: '好人优势',
        description: '降低难度，适合新手或熟人局',
        difficulty: '新手',
        guidelines: {
            infoRolesRatio: { min: 0.5, max: 0.6 },
            powerRolesRatio: { min: 0.2, max: 0.3 },
            recommendedMinions: ['scarlet_woman', 'baron'],
            recommendedOutsiders: ['drunk'],
            tips: [
                '3-4个首夜信息角色',
                '包含处女/杀手等确认角色',
                '猩红女巫优先（较弱）',
                '仅醉酒者或0个局外人',
                '说书人谨慎使用下毒'
            ]
        }
    },
    {
        id: 'chaotic',
        name: '混乱模式',
        description: '高不确定性，趣味优先',
        difficulty: '困难',
        guidelines: {
            infoRolesRatio: { min: 0.6, max: 0.7 },
            powerRolesRatio: { min: 0.1, max: 0.2 },
            recommendedMinions: ['poisoner', 'baron'],
            recommendedOutsiders: ['drunk', 'saint', 'recluse'],
            tips: [
                '4+个信息角色（信息过载）',
                '下毒者必选（破坏信息）',
                '男爵必选（增加局外人）',
                '包含复杂局外人（圣徒/隐士）'
            ]
        }
    }
];

interface ScriptCompositionGuideProps {
    onClose: () => void;
    playerCount: number;
    onApplyStrategy?: (strategy: CompositionStrategy, roles?: { townsfolk: RoleDef[], outsider: RoleDef[], minion: RoleDef[], demon: RoleDef[] }) => void;
}

// 策略详情弹窗组件
const StrategyDetailModal: React.FC<{
    strategy: CompositionStrategy;
    composition: { townsfolk: number; outsider: number; minion: number; demon: number };
    generatedRoles: { townsfolk: RoleDef[], outsider: RoleDef[], minion: RoleDef[], demon: RoleDef[] } | null;
    onGenerate: () => void;
    onApply: () => void;
    onClose: () => void;
}> = ({ strategy, composition, generatedRoles, onGenerate, onApply, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-stone-900 rounded-lg border border-amber-700 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-stone-700 bg-stone-950 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-amber-400 font-cinzel">{strategy.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                            strategy.difficulty === '新手' ? 'bg-green-950/50 text-green-400 border border-green-800' :
                            strategy.difficulty === '中等' ? 'bg-blue-950/50 text-blue-400 border border-blue-800' :
                            'bg-red-950/50 text-red-400 border border-red-800'
                        }`}>
                            {strategy.difficulty}
                        </span>
                    </div>
                    <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-xl">✕</button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-8rem)]">
                    <p className="text-stone-400 mb-4">{strategy.description}</p>

                    {/* 配置建议 */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-stone-950/50 p-4 rounded border border-stone-800">
                            <h4 className="text-sm font-bold text-stone-300 mb-2">📊 推荐配置</h4>
                            <div className="space-y-1 text-xs text-stone-400">
                                <p>信息类角色: {Math.round(strategy.guidelines.infoRolesRatio.min * composition.townsfolk)}-{Math.round(strategy.guidelines.infoRolesRatio.max * composition.townsfolk)}个</p>
                                <p>推荐爪牙: {strategy.guidelines.recommendedMinions.map(id => ROLES[id]?.name || id).join(', ')}</p>
                                <p>推荐局外人: {strategy.guidelines.recommendedOutsiders.map(id => ROLES[id]?.name || id).join(', ')}</p>
                            </div>
                        </div>
                        <div className="bg-stone-950/50 p-4 rounded border border-stone-800">
                            <h4 className="text-sm font-bold text-stone-300 mb-2">💡 说书人建议</h4>
                            <ul className="space-y-1">
                                {strategy.guidelines.tips.map((tip, i) => (
                                    <li key={i} className="text-xs text-stone-400 flex items-start gap-1">
                                        <span className="text-amber-600">•</span>
                                        <span>{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* 生成按钮 */}
                    <button
                        onClick={onGenerate}
                        className="w-full py-3 px-4 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-sm font-bold transition-colors border border-stone-600 mb-4"
                    >
                        🎲 生成具体角色配置
                    </button>

                    {/* 生成的角色列表 */}
                    {generatedRoles && (
                        <div className="bg-amber-950/20 border border-amber-800 rounded p-4 mb-4">
                            <h4 className="text-sm font-bold text-amber-400 mb-3">🎭 生成的角色配置</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-blue-400 font-bold text-xs mb-2">镇民 ({generatedRoles.townsfolk.length})</p>
                                    {generatedRoles.townsfolk.map(role => (
                                        <p key={role.id} className="text-xs text-stone-400">• {role.name}</p>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-yellow-400 font-bold text-xs mb-2">外来者 ({generatedRoles.outsider.length})</p>
                                    {generatedRoles.outsider.map(role => (
                                        <p key={role.id} className="text-xs text-stone-400">• {role.name}</p>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-orange-400 font-bold text-xs mb-2">爪牙 ({generatedRoles.minion.length})</p>
                                    {generatedRoles.minion.map(role => (
                                        <p key={role.id} className="text-xs text-stone-400">• {role.name}</p>
                                    ))}
                                </div>
                                <div>
                                    <p className="text-red-400 font-bold text-xs mb-2">恶魔 ({generatedRoles.demon.length})</p>
                                    {generatedRoles.demon.map(role => (
                                        <p key={role.id} className="text-xs text-stone-400">• {role.name}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 应用按钮 */}
                    <div className="bg-red-950/20 border border-red-800 rounded p-4">
                        <p className="text-xs text-red-400 mb-3">
                            ⚠️ 应用此策略将<strong>清除当前所有角色分配</strong>，并根据上方配置重新分配角色。
                        </p>
                        <button
                            onClick={onApply}
                            disabled={!generatedRoles}
                            className={`w-full py-3 px-4 rounded font-bold text-sm transition-colors ${
                                generatedRoles 
                                    ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                                    : 'bg-stone-800 text-stone-600 cursor-not-allowed'
                            }`}
                        >
                            {generatedRoles ? `✅ 应用 "${strategy.name}" 策略` : '请先生成角色配置'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ScriptCompositionGuide: React.FC<ScriptCompositionGuideProps> = ({ onClose, playerCount, onApplyStrategy }) => {
    const [selectedStrategy, setSelectedStrategy] = useState<CompositionStrategy | null>(null);
    const [generatedRoles, setGeneratedRoles] = useState<{ townsfolk: RoleDef[], outsider: RoleDef[], minion: RoleDef[], demon: RoleDef[] } | null>(null);

    // 获取标准配比
    const getStandardComposition = (players: number) => {
        const rules: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
            5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
            6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
            7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
            8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
            9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
            10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
            11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
            12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
            13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
            14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
            15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 }
        };
        return rules[players] || rules[7];
    };

    const composition = getStandardComposition(playerCount);

    // 生成具体角色配置
    const generateRoles = (strategy: CompositionStrategy) => {
        const tbRoles = SCRIPTS.tb.roles;
        const townsfolkRoles = tbRoles.filter(id => ROLES[id]?.team === 'TOWNSFOLK');
        const outsiderRoles = tbRoles.filter(id => ROLES[id]?.team === 'OUTSIDER');
        const minionRoles = tbRoles.filter(id => ROLES[id]?.team === 'MINION');
        const demonRoles = tbRoles.filter(id => ROLES[id]?.team === 'DEMON');

        // 随机选择角色
        const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

        const selectedTownsfolk = shuffleArray(townsfolkRoles)
            .slice(0, composition.townsfolk)
            .map(id => ROLES[id]).filter(Boolean) as RoleDef[];

        // 外来者：优先推荐角色 + 其余随机，确保数量正确
        const recommendedOutsiderIds = strategy.guidelines.recommendedOutsiders.filter(id => outsiderRoles.includes(id));
        const otherOutsiderIds = outsiderRoles.filter(id => !recommendedOutsiderIds.includes(id));
        const outsiderPool = [...recommendedOutsiderIds, ...shuffleArray(otherOutsiderIds)];
        const selectedOutsider = outsiderPool
            .slice(0, composition.outsider)
            .map(id => ROLES[id]).filter(Boolean) as RoleDef[];

        // 爪牙：优先推荐角色 + 其余随机
        const recommendedMinionIds = strategy.guidelines.recommendedMinions.filter(id => minionRoles.includes(id));
        const otherMinionIds = minionRoles.filter(id => !recommendedMinionIds.includes(id));
        const minionPool = [...recommendedMinionIds, ...shuffleArray(otherMinionIds)];
        const selectedMinion = minionPool
            .slice(0, composition.minion)
            .map(id => ROLES[id]).filter(Boolean) as RoleDef[];

        const selectedDemon = shuffleArray(demonRoles)
            .slice(0, composition.demon)
            .map(id => ROLES[id]).filter(Boolean) as RoleDef[];

        setGeneratedRoles({
            townsfolk: selectedTownsfolk,
            outsider: selectedOutsider,
            minion: selectedMinion,
            demon: selectedDemon
        });
    };

    const handleApply = () => {
        if (selectedStrategy && generatedRoles && onApplyStrategy) {
            onApplyStrategy(selectedStrategy, generatedRoles);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-stone-900 rounded-lg border border-stone-700 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-stone-800 bg-stone-950 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-stone-200 font-cinzel">📊 板子参考 Script Composition Guide</h3>
                        <p className="text-xs text-stone-500 mt-1">当前人数: {playerCount}人 | 标准配比: {composition.townsfolk}镇民+{composition.outsider}外来者+{composition.minion}爪牙+{composition.demon}恶魔</p>
                    </div>
                    <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-2xl">✕</button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
                    {/* 角色强度说明 */}
                    <div className="mb-6 p-4 bg-stone-950/50 rounded border border-stone-800">
                        <h4 className="text-sm font-bold text-amber-400 mb-2 font-cinzel">💡 角色强度参考</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                            <div>
                                <p className="text-stone-400 font-bold mb-1">Strong 强力</p>
                                <p className="text-stone-500">首夜/持续信息角色、下毒者、间谍</p>
                            </div>
                            <div>
                                <p className="text-stone-400 font-bold mb-1">Medium-Strong 中强</p>
                                <p className="text-stone-500">僧侣、处女、杀手等功能角色</p>
                            </div>
                            <div>
                                <p className="text-stone-400 font-bold mb-1">Medium 中等</p>
                                <p className="text-stone-500">渡鸦守卫、管家等有条件角色</p>
                            </div>
                        </div>
                    </div>

                    {/* 策略列表 - 点击打开详情弹窗 */}
                    <h4 className="text-sm font-bold text-stone-300 mb-3">选择一个策略查看详情：</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {STRATEGIES.map(strategy => (
                            <div
                                key={strategy.id}
                                className="p-4 rounded border border-stone-800 bg-stone-950/30 hover:border-amber-700 hover:bg-amber-950/10 cursor-pointer transition-all group"
                                onClick={() => {
                                    setSelectedStrategy(strategy);
                                    setGeneratedRoles(null);
                                }}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-sm font-bold text-stone-200 font-cinzel group-hover:text-amber-400 transition-colors">{strategy.name}</h4>
                                </div>
                                <span className={`text-xs px-2 py-0.5 rounded inline-block mb-2 ${
                                    strategy.difficulty === '新手' ? 'bg-green-950/50 text-green-400 border border-green-800' :
                                    strategy.difficulty === '中等' ? 'bg-blue-950/50 text-blue-400 border border-blue-800' :
                                    'bg-red-950/50 text-red-400 border border-red-800'
                                }`}>
                                    {strategy.difficulty}
                                </span>
                                <p className="text-xs text-stone-500">{strategy.description}</p>
                                <p className="text-xs text-amber-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">点击查看详情 →</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 策略详情弹窗 */}
            {selectedStrategy && (
                <StrategyDetailModal
                    strategy={selectedStrategy}
                    composition={composition}
                    generatedRoles={generatedRoles}
                    onGenerate={() => generateRoles(selectedStrategy)}
                    onApply={handleApply}
                    onClose={() => {
                        setSelectedStrategy(null);
                        setGeneratedRoles(null);
                    }}
                />
            )}
        </div>
    );
};
