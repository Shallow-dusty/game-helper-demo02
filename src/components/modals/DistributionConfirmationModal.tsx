import React from 'react';
import { motion } from 'framer-motion';
import { DistributionAnalysisResult } from '../../lib/distributionAnalysis';

interface DistributionConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    analysis: DistributionAnalysisResult;
}

export const DistributionConfirmationModal: React.FC<DistributionConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    analysis
}) => {
    if (!isOpen) return null;

    const { strategyEvaluation, composition, standardComposition, warnings, playerCount } = analysis;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-stone-900 border border-stone-700 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="p-6 bg-stone-950 border-b border-stone-800 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-transparent pointer-events-none" />
                    <h2 className="text-2xl font-cinzel font-bold text-stone-200 relative z-10">
                        确认角色发放
                    </h2>
                    <p className="text-stone-500 text-sm mt-1 font-serif italic relative z-10">
                        Confirm Role Distribution
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Strategy Evaluation */}
                    <div className="bg-stone-950/50 rounded-lg p-4 border border-stone-800 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-stone-900 border border-stone-700 flex items-center justify-center text-3xl shadow-inner">
                            {strategyEvaluation.icon}
                        </div>
                        <div>
                            <h3 className="text-amber-500 font-bold text-sm uppercase tracking-wider mb-1">
                                局势评估
                            </h3>
                            <p className="text-lg font-cinzel text-stone-200 font-bold">
                                {strategyEvaluation.name}
                            </p>
                            <p className="text-xs text-stone-500">
                                {strategyEvaluation.description}
                            </p>
                        </div>
                    </div>

                    {/* Composition Stats */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                        <div className="p-2 rounded bg-blue-950/20 border border-blue-900/30">
                            <div className="text-xs text-blue-400 font-bold mb-1">镇民</div>
                            <div className="text-xl font-cinzel text-blue-200">{composition.townsfolk}</div>
                            {standardComposition && (
                                <div className="text-[10px] text-stone-600">/{standardComposition.townsfolk}</div>
                            )}
                        </div>
                        <div className="p-2 rounded bg-green-950/20 border border-green-900/30">
                            <div className="text-xs text-green-400 font-bold mb-1">外来者</div>
                            <div className={`text-xl font-cinzel ${composition.outsider !== standardComposition?.outsider ? 'text-yellow-400' : 'text-green-200'}`}>
                                {composition.outsider}
                            </div>
                            {standardComposition && (
                                <div className="text-[10px] text-stone-600">/{standardComposition.outsider}</div>
                            )}
                        </div>
                        <div className="p-2 rounded bg-orange-950/20 border border-orange-900/30">
                            <div className="text-xs text-orange-400 font-bold mb-1">爪牙</div>
                            <div className={`text-xl font-cinzel ${composition.minion !== standardComposition?.minion ? 'text-yellow-400' : 'text-orange-200'}`}>
                                {composition.minion}
                            </div>
                            {standardComposition && (
                                <div className="text-[10px] text-stone-600">/{standardComposition.minion}</div>
                            )}
                        </div>
                        <div className="p-2 rounded bg-red-950/20 border border-red-900/30">
                            <div className="text-xs text-red-400 font-bold mb-1">恶魔</div>
                            <div className={`text-xl font-cinzel ${composition.demon !== standardComposition?.demon ? 'text-red-500 animate-pulse' : 'text-red-200'}`}>
                                {composition.demon}
                            </div>
                            {standardComposition && (
                                <div className="text-[10px] text-stone-600">/{standardComposition.demon}</div>
                            )}
                        </div>
                    </div>

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <div className="bg-red-950/20 border border-red-900/50 rounded p-3 space-y-1">
                            {warnings.map((w, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs text-red-400">
                                    <span>⚠️</span>
                                    <span>{w}</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Info */}
                    <div className="text-center text-xs text-stone-600">
                        <p>即将向 {playerCount} 位玩家发放角色</p>
                        <p>发放后玩家将收到“查看角色”的提示</p>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 bg-stone-950 border-t border-stone-800 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded bg-stone-900 hover:bg-stone-800 text-stone-400 font-bold text-sm transition-colors border border-stone-700"
                    >
                        返回修改
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-[2] py-3 rounded bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-white font-bold text-sm transition-all shadow-lg border border-amber-500 flex items-center justify-center gap-2 group"
                    >
                        <span>✨ 确认发放</span>
                        <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
