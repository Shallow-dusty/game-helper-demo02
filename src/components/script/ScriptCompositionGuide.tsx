import React, { useState, Component, ErrorInfo, ReactNode } from 'react';
import { useStore } from '../../store';
import { ROLES, SCRIPTS } from '../../constants';
import type { RoleDef } from '../../types';

// 简单的错误边界组件，用于捕获渲染错误
class ModalErrorBoundary extends Component<{ children: ReactNode; onClose: () => void }, { hasError: boolean }> {
    constructor(props: { children: ReactNode; onClose: () => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(): { hasError: boolean } {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.error('ScriptCompositionGuide error:', error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={this.props.onClose}>
                    <div className="bg-stone-900 rounded-lg border border-red-700 p-6 max-w-md" onClick={e => e.stopPropagation()}>
                        <div className="text-center">
                            <span className="text-4xl">⚠️</span>
                            <h3 className="text-lg font-bold text-red-400 mt-2">加载出错</h3>
                            <p className="text-stone-400 text-sm mt-2">板子参考加载失败，请重试。</p>
                            <button
                                onClick={this.props.onClose}
                                className="mt-4 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded"
                            >
                                关闭
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

interface CompositionStrategy {
    id: string;
    name: string;
    description: string;
    difficulty: '新手' | '中等' | '困难';
    guidelines: {
        strongRoles: { min: number; max: number; roles: string[] };      // 强力角色
        mediumStrongRoles: { min: number; max: number; roles: string[] }; // 中强角色
        mediumRoles: { roles: string[] };                                  // 中等角色（填充用）
        recommendedMinions: string[];
        recommendedOutsiders: string[];
        tips: string[];
    };
}

// 角色强度分类（基于暗流涌动剧本）
const ROLE_STRENGTH = {
    // 强力角色：能提供关键信息或强力保护
    strong: ['fortune_teller', 'empath', 'virgin', 'monk', 'soldier'],
    // 中强角色：提供有用但有限的信息
    mediumStrong: ['undertaker', 'ravenkeeper', 'investigator', 'chef', 'librarian'],
    // 中等角色：有条件或风险的角色
    medium: ['butler', 'recluse', 'washerwoman', 'saint']
};

const STRATEGIES: CompositionStrategy[] = [
    {
        id: 'balanced',
        name: '平衡打法',
        description: '适合标准游戏体验，善恶双方都有充足的工具',
        difficulty: '中等',
        guidelines: {
            strongRoles: { min: 1, max: 2, roles: ROLE_STRENGTH.strong },
            mediumStrongRoles: { min: 2, max: 3, roles: ROLE_STRENGTH.mediumStrong },
            mediumRoles: { roles: ROLE_STRENGTH.medium },
            recommendedMinions: ['poisoner', 'spy', 'baron'],
            recommendedOutsiders: ['drunk', 'recluse'],
            tips: [
                '保证至少有1个强力信息角色',
                '邪恶角色选择中等强度',
                '避免过多的"确认"类角色'
            ]
        }
    },
    {
        id: 'evil_favored',
        name: '邪恶优势',
        description: '增加游戏难度，适合有经验的好人玩家',
        difficulty: '困难',
        guidelines: {
            strongRoles: { min: 0, max: 1, roles: ['fortune_teller'] },
            mediumStrongRoles: { min: 1, max: 2, roles: ['undertaker', 'empath'] },
            mediumRoles: { roles: ['butler', 'recluse', 'washerwoman', 'saint', 'chef'] },
            recommendedMinions: ['poisoner', 'spy'],
            recommendedOutsiders: ['drunk', 'recluse', 'saint'],
            tips: [
                '减少确定性信息角色',
                '增加可能给假信息的角色（如隐士、酒鬼）',
                '考虑选用更强的恶魔和爪牙'
            ]
        }
    },
    {
        id: 'good_favored',
        name: '好人优势',
        description: '降低游戏难度，适合新手玩家',
        difficulty: '新手',
        guidelines: {
            strongRoles: { min: 2, max: 3, roles: ROLE_STRENGTH.strong },
            mediumStrongRoles: { min: 2, max: 3, roles: ROLE_STRENGTH.mediumStrong },
            mediumRoles: { roles: [] },
            recommendedMinions: ['scarlet_woman', 'baron'],
            recommendedOutsiders: ['drunk'],
            tips: [
                '增加强力信息角色',
                '减少负面效果角色',
                '选用较弱的恶魔和爪牙'
            ]
        }
    },
    {
        id: 'chaotic',
        name: '混乱模式',
        description: '充满不确定性，适合追求刺激的玩家',
        difficulty: '困难',
        guidelines: {
            strongRoles: { min: 0, max: 1, roles: [] },
            mediumStrongRoles: { min: 0, max: 1, roles: [] },
            mediumRoles: { roles: ['butler', 'recluse', 'washerwoman', 'saint', 'soldier'] },
            recommendedMinions: ['poisoner', 'baron'],
            recommendedOutsiders: ['drunk', 'saint', 'recluse'],
            tips: [
                '选择会产生假信息的角色',
                '增加角色之间的相互影响',
                '考虑选用特殊规则的恶魔'
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
    generatedRoles: { townsfolk: RoleDef[], outsider: RoleDef[], minion: RoleDef[], demon: RoleDef[] } | null;
    onGenerate: () => void;
    onApply: () => void;
    onClose: () => void;
}> = ({ strategy, generatedRoles, onGenerate, onApply, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-stone-900 rounded-lg border border-amber-700 w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-stone-700 bg-stone-950 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-amber-400 font-cinzel">{strategy.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded ${strategy.difficulty === '新手' ? 'bg-green-950/50 text-green-400 border border-green-800' :
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
                            <h4 className="text-sm font-bold text-stone-300 mb-2">📊 角色强度配置</h4>
                            <div className="space-y-2 text-xs text-stone-400">
                                <div>
                                    <p className="text-amber-400">强力角色（建议{strategy.guidelines.strongRoles.min}-{strategy.guidelines.strongRoles.max}个）</p>
                                    <p className="text-stone-500">{strategy.guidelines.strongRoles.roles.map(id => ROLES[id]?.name || id).join('、') || '无'}</p>
                                </div>
                                <div>
                                    <p className="text-blue-400">中强角色（建议{strategy.guidelines.mediumStrongRoles.min}-{strategy.guidelines.mediumStrongRoles.max}个）</p>
                                    <p className="text-stone-500">{strategy.guidelines.mediumStrongRoles.roles.map(id => ROLES[id]?.name || id).join('、') || '无'}</p>
                                </div>
                                <div>
                                    <p className="text-stone-400">中等角色（填充用）</p>
                                    <p className="text-stone-500">{strategy.guidelines.mediumRoles.roles.map(id => ROLES[id]?.name || id).join('、') || '无'}</p>
                                </div>
                                <div className="pt-2 border-t border-stone-700">
                                    <p>推荐爪牙: {strategy.guidelines.recommendedMinions.map(id => ROLES[id]?.name || id).join('、')}</p>
                                    <p>推荐局外人: {strategy.guidelines.recommendedOutsiders.map(id => ROLES[id]?.name || id).join('、')}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-stone-950/50 p-4 rounded border border-stone-800">
                            <h4 className="text-sm font-bold text-stone-300 mb-2">💡 选取建议</h4>
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
                                    {generatedRoles.townsfolk.map((role, index) => (
                                        role ? <p key={role.id || index} className="text-xs text-stone-400">• {role.name || '未知'}</p> : null
                                    ))}
                                </div>
                                <div>
                                    <p className="text-yellow-400 font-bold text-xs mb-2">外来者 ({generatedRoles.outsider.length})</p>
                                    {generatedRoles.outsider.map((role, index) => (
                                        role ? <p key={role.id || index} className="text-xs text-stone-400">• {role.name || '未知'}</p> : null
                                    ))}
                                </div>
                                <div>
                                    <p className="text-orange-400 font-bold text-xs mb-2">爪牙 ({generatedRoles.minion.length})</p>
                                    {generatedRoles.minion.map((role, index) => (
                                        role ? <p key={role.id || index} className="text-xs text-stone-400">• {role.name || '未知'}</p> : null
                                    ))}
                                </div>
                                <div>
                                    <p className="text-red-400 font-bold text-xs mb-2">恶魔 ({generatedRoles.demon.length})</p>
                                    {generatedRoles.demon.map((role, index) => (
                                        role ? <p key={role.id || index} className="text-xs text-stone-400">• {role.name || '未知'}</p> : null
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
                            className={`w-full py-3 px-4 rounded font-bold text-sm transition-colors ${generatedRoles
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

const ScriptCompositionGuideInner: React.FC<ScriptCompositionGuideProps> = ({ onClose, playerCount, onApplyStrategy }) => {
    const [selectedStrategy, setSelectedStrategy] = useState<CompositionStrategy | null>(null);
    const [generatedRoles, setGeneratedRoles] = useState<{ townsfolk: RoleDef[], outsider: RoleDef[], minion: RoleDef[], demon: RoleDef[] } | null>(null);

    // 安全的玩家数量，确保始终有效
    const safePlayerCount = (playerCount && playerCount >= 5 && playerCount <= 15) ? playerCount : 7;

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

    const composition = getStandardComposition(safePlayerCount);

    // Get current script from store
    const currentScriptId = useStore(state => state.gameState?.currentScriptId) || 'tb';
    const currentScript = SCRIPTS[currentScriptId] || SCRIPTS.tb;

    // 生成具体角色配置
    const generateRoles = (strategy: CompositionStrategy) => {
        try {
            const scriptRoles = currentScript?.roles;
            if (!scriptRoles || !composition) return;



            const townsfolkRoles = scriptRoles.filter(id => ROLES[id]?.team === 'TOWNSFOLK');
            const outsiderRoles = scriptRoles.filter(id => ROLES[id]?.team === 'OUTSIDER');
            const minionRoles = scriptRoles.filter(id => ROLES[id]?.team === 'MINION');
            const demonRoles = scriptRoles.filter(id => ROLES[id]?.team === 'DEMON');

            // 随机选择角色
            const shuffleArray = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

            // 根据策略的角色强度分级来选择镇民
            const { strongRoles, mediumStrongRoles, mediumRoles } = strategy.guidelines;

            // 计算每个强度等级需要的数量
            const strongCount = Math.floor(Math.random() * (strongRoles.max - strongRoles.min + 1)) + strongRoles.min;
            const mediumStrongCount = Math.floor(Math.random() * (mediumStrongRoles.max - mediumStrongRoles.min + 1)) + mediumStrongRoles.min;
            const remainingCount = composition.townsfolk - strongCount - mediumStrongCount;

            // 从各强度池中选择角色
            const availableStrong = shuffleArray(strongRoles.roles.filter(id => townsfolkRoles.includes(id)));
            const availableMediumStrong = shuffleArray(mediumStrongRoles.roles.filter(id => townsfolkRoles.includes(id)));
            const availableMedium = shuffleArray(mediumRoles.roles.filter(id => townsfolkRoles.includes(id)));

            // 已选择的角色ID（避免重复）
            const selectedTownsfolkIds: string[] = [];

            // 选择强力角色
            for (let i = 0; i < strongCount && i < availableStrong.length; i++) {
                const roleId = availableStrong[i];
                if (roleId) selectedTownsfolkIds.push(roleId);
            }

            // 选择中强角色
            for (let i = 0; i < mediumStrongCount && i < availableMediumStrong.length; i++) {
                const roleId = availableMediumStrong[i];
                if (roleId && !selectedTownsfolkIds.includes(roleId)) {
                    selectedTownsfolkIds.push(roleId);
                }
            }

            // 用中等角色填充剩余位置
            for (let i = 0; i < remainingCount && i < availableMedium.length; i++) {
                const roleId = availableMedium[i];
                if (roleId && !selectedTownsfolkIds.includes(roleId)) {
                    selectedTownsfolkIds.push(roleId);
                }
            }

            // 如果还不够，从剩余镇民中随机选择
            const remainingTownsfolk = shuffleArray(townsfolkRoles.filter(id => !selectedTownsfolkIds.includes(id)));
            while (selectedTownsfolkIds.length < composition.townsfolk && remainingTownsfolk.length > 0) {
                selectedTownsfolkIds.push(remainingTownsfolk.shift()!);
            }

            const selectedTownsfolk = selectedTownsfolkIds.map(id => ROLES[id]).filter(Boolean) as RoleDef[];

            // 外来者：优先推荐角色 + 其余随机，确保数量正确
            const recommendedOutsiderIds = shuffleArray(strategy.guidelines.recommendedOutsiders.filter(id => outsiderRoles.includes(id)));
            const otherOutsiderIds = outsiderRoles.filter(id => !recommendedOutsiderIds.includes(id));
            const outsiderPool = [...recommendedOutsiderIds, ...shuffleArray(otherOutsiderIds)];
            const selectedOutsider = outsiderPool
                .slice(0, composition.outsider)
                .map(id => ROLES[id]).filter(Boolean) as RoleDef[];

            // 爪牙：优先推荐角色 + 其余随机
            const recommendedMinionIds = shuffleArray(strategy.guidelines.recommendedMinions.filter(id => minionRoles.includes(id)));
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
        } catch (error) {
            console.error('generateRoles error:', error);
        }
    };

    const handleApply = () => {
        if (selectedStrategy && generatedRoles && onApplyStrategy) {
            onApplyStrategy(selectedStrategy, generatedRoles);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-sm"
                style={{
                    background: `
                        linear-gradient(to bottom right, rgba(0,0,0,0.1), rgba(0,0,0,0.3)),
                        url("https://www.transparenttextures.com/patterns/aged-paper.png"),
                        #f4e4bc
                    `,
                    boxShadow: 'inset 0 0 100px rgba(60, 40, 20, 0.3), 0 0 20px rgba(0,0,0,0.8)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Decorative Border */}
                <div className="absolute inset-2 border-2 border-[#8b4513] opacity-50 pointer-events-none rounded-sm" />
                <div className="absolute inset-3 border border-[#8b4513] opacity-30 pointer-events-none rounded-sm" />

                {/* Header */}
                <div className="p-5 border-b-2 border-[#8b4513]/30 flex justify-between items-center relative z-10 bg-[#e6d2a0]/50">
                    <div>
                        <h3 className="text-2xl font-bold text-[#4a3728] font-cinzel tracking-wider drop-shadow-sm">
                            📜 板子配置建议 (Script Guide)
                        </h3>
                        <p className="text-xs text-[#654321] mt-1 font-serif italic">
                            当前人数: {safePlayerCount}人 | 标准配比: {composition?.townsfolk || 0}镇民+{composition?.outsider || 0}外来者+{composition?.minion || 0}爪牙+{composition?.demon || 0}恶魔
                        </p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-[#8b4513] hover:text-[#4a3728] text-2xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#8b4513]/10 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)] relative z-10 scrollbar-thin scrollbar-thumb-[#8b4513]/50 scrollbar-track-transparent">
                    {/* 角色强度说明 */}
                    <div className="mb-6 p-4 bg-[#fff9e6]/60 rounded border border-[#8b4513]/30 shadow-inner">
                        <h4 className="text-sm font-bold text-[#8b4513] mb-3 font-cinzel border-b border-[#8b4513]/20 pb-1 inline-block">
                            💡 角色强度参考（暗流涌动）
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-serif">
                            <div>
                                <p className="text-[#b91c1c] font-bold mb-1 uppercase tracking-wider">强力角色</p>
                                <p className="text-[#4a3728] leading-relaxed">{ROLE_STRENGTH.strong.map(id => ROLES[id]?.name || id).join('、')}</p>
                            </div>
                            <div>
                                <p className="text-[#1d4ed8] font-bold mb-1 uppercase tracking-wider">中强角色</p>
                                <p className="text-[#4a3728] leading-relaxed">{ROLE_STRENGTH.mediumStrong.map(id => ROLES[id]?.name || id).join('、')}</p>
                            </div>
                            <div>
                                <p className="text-[#4a3728] font-bold mb-1 uppercase tracking-wider">中等角色</p>
                                <p className="text-[#4a3728] leading-relaxed">{ROLE_STRENGTH.medium.map(id => ROLES[id]?.name || id).join('、')}</p>
                            </div>
                        </div>
                    </div>

                    {/* 策略列表 */}
                    <h4 className="text-sm font-bold text-[#4a3728] mb-3 font-cinzel">选择一个策略查看详情：</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {STRATEGIES.map(strategy => (
                            <div
                                key={strategy.id}
                                className="p-4 rounded border border-[#8b4513]/30 bg-[#fff9e6]/40 hover:bg-[#fff9e6]/80 hover:border-[#8b4513] hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
                                onClick={() => {
                                    setSelectedStrategy(strategy);
                                    setGeneratedRoles(null);
                                }}
                            >
                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <h4 className="text-sm font-bold text-[#4a3728] font-cinzel group-hover:text-[#b91c1c] transition-colors">{strategy.name}</h4>
                                </div>
                                <span className={`text-[10px] px-2 py-0.5 rounded inline-block mb-2 font-bold border ${
                                    strategy.difficulty === '新手' ? 'bg-green-100 text-green-800 border-green-300' :
                                    strategy.difficulty === '中等' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                    'bg-red-100 text-red-800 border-red-300'
                                }`}>
                                    {strategy.difficulty}
                                </span>
                                <p className="text-xs text-[#654321] font-serif leading-snug relative z-10">{strategy.description}</p>
                                <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-xs text-[#8b4513]">➜</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 策略详情弹窗 */}
            {selectedStrategy && (
                <StrategyDetailModal
                    strategy={selectedStrategy}
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

// 包装错误边界的导出
export const ScriptCompositionGuide: React.FC<ScriptCompositionGuideProps> = (props) => (
    <ModalErrorBoundary onClose={props.onClose}>
        <ScriptCompositionGuideInner {...props} />
    </ModalErrorBoundary>
);



