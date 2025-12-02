import React, { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { motion, AnimatePresence } from 'framer-motion';
import { generateInfoForRole, getInfoRolesForNight, InfoGenerationResult } from '../../lib/infoGeneration';
import { Brain, RefreshCw, ChevronDown, ChevronUp, Copy, Check, AlertTriangle, Sparkles, Target } from 'lucide-react';
import { ROLES } from '../../constants/roles';

/**
 * SmartInfoPanel - 智能信息生成面板
 * 
 * 为 ST 提供信息类角色（共情者、厨师、占卜师等）的信息建议
 * - 自动检测当前夜晚需要处理的信息角色
 * - 生成真实信息和伪造信息（中毒/醉酒状态）
 * - 一键复制信息到剪贴板
 * - 占卜师目标选择支持
 */

interface SmartInfoPanelProps {
  isExpanded?: boolean;
  onToggle?: () => void;
}

// 需要额外参数的角色
const ROLES_NEED_PARAMS = ['fortune_teller', 'undertaker'];

export const SmartInfoPanel: React.FC<SmartInfoPanelProps> = ({
  isExpanded = false,
  onToggle
}) => {
  const gameState = useStore(state => state.gameState);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<Map<number, InfoGenerationResult>>(new Map());
  
  // 占卜师目标选择状态
  const [fortuneTellerTargets, setFortuneTellerTargets] = useState<Map<number, { target1: number | null; target2: number | null }>>(new Map());

  // 检测当前夜晚的信息角色
  const infoRoles = useMemo(() => {
    if (!gameState) return [];
    const isFirstNight = gameState.roundInfo?.nightCount === 1;
    return getInfoRolesForNight(gameState, isFirstNight);
  }, [gameState]);

  // 获取存活玩家列表（用于占卜师目标选择）
  const alivePlayers = useMemo(() => {
    if (!gameState) return [];
    return gameState.seats.filter(s => !s.isDead);
  }, [gameState]);

  // 生成单个角色的信息
  const generateInfo = (seatId: number, roleId: string, additionalParams?: { target1SeatId?: number; target2SeatId?: number; executedSeatId?: number }) => {
    if (!gameState) return;
    
    const result = generateInfoForRole(gameState, roleId, seatId, additionalParams);
    if (result) {
      setGeneratedResults(prev => {
        const next = new Map(prev);
        next.set(seatId, result);
        return next;
      });
    }
  };

  // 生成所有信息（跳过需要参数的角色）
  const generateAllInfo = () => {
    if (!gameState) return;
    
    const newResults = new Map<number, InfoGenerationResult>();
    infoRoles.forEach(({ seatId, roleId }) => {
      // 跳过需要额外参数的角色
      if (ROLES_NEED_PARAMS.includes(roleId)) return;
      
      const result = generateInfoForRole(gameState, roleId, seatId);
      if (result) {
        newResults.set(seatId, result);
      }
    });
    setGeneratedResults(prev => {
      const next = new Map(prev);
      newResults.forEach((v, k) => next.set(k, v));
      return next;
    });
  };

  // 复制到剪贴板
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // 更新占卜师目标
  const updateFortuneTellerTarget = (seatId: number, targetNum: 1 | 2, targetSeatId: number | null) => {
    setFortuneTellerTargets(prev => {
      const next = new Map(prev);
      const current = next.get(seatId) ?? { target1: null, target2: null };
      if (targetNum === 1) {
        current.target1 = targetSeatId;
      } else {
        current.target2 = targetSeatId;
      }
      next.set(seatId, current);
      return next;
    });
  };

  if (gameState?.phase !== 'NIGHT') {
    return null;
  }

  return (
    <div className="bg-stone-900 rounded-lg border border-indigo-900/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between bg-indigo-950/30 hover:bg-indigo-950/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-bold text-indigo-300">智能信息生成</span>
          {infoRoles.length > 0 && (
            <span className="text-[10px] bg-indigo-900 px-1.5 py-0.5 rounded text-indigo-200">
              {infoRoles.length} 角色
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-indigo-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-indigo-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 space-y-3">
              {/* 无信息角色提示 */}
              {infoRoles.length === 0 ? (
                <div className="text-center py-4 text-stone-500">
                  <p className="text-sm">本夜无需处理的信息角色</p>
                </div>
              ) : (
                <>
                  {/* 批量生成按钮 */}
                  <button
                    onClick={generateAllInfo}
                    className="w-full flex items-center justify-center gap-2 py-2 bg-indigo-900/50 hover:bg-indigo-800/50 rounded text-sm text-indigo-200 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    一键生成所有信息
                  </button>

                  {/* 角色信息列表 */}
                  <div className="space-y-2">
                    {infoRoles.map(({ seatId, roleId, roleName }) => {
                      const result = generatedResults.get(seatId);
                      const seat = gameState.seats[seatId];
                      const isTainted = seat?.statuses.includes('POISONED') || seat?.statuses.includes('DRUNK');
                      const needsParams = ROLES_NEED_PARAMS.includes(roleId);
                      const ftTargets = fortuneTellerTargets.get(seatId);
                      
                      return (
                        <div
                          key={`${String(seatId)}-${roleId}`}
                          className={`rounded border p-3 ${
                            isTainted 
                              ? 'bg-purple-950/30 border-purple-700/50' 
                              : 'bg-stone-800/50 border-stone-700/50'
                          }`}
                        >
                          {/* 角色标题 */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{ROLES[roleId]?.icon ?? '❓'}</span>
                              <div>
                                <p className="text-sm font-bold text-stone-200">
                                  {seat?.userName ?? `座位 ${String(seatId + 1)}`}
                                </p>
                                <p className="text-xs text-stone-500">{roleName}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {isTainted && (
                                <span className="text-[10px] bg-purple-900 px-1.5 py-0.5 rounded text-purple-200 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  中毒/醉酒
                                </span>
                              )}
                              {!needsParams && (
                                <button
                                  onClick={() => generateInfo(seatId, roleId)}
                                  className="p-1.5 rounded bg-stone-700 hover:bg-stone-600 transition-colors"
                                  title="重新生成"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* 占卜师目标选择 */}
                          {roleId === 'fortune_teller' && (
                            <div className="mb-3 p-2 bg-stone-900/50 rounded border border-stone-700/50">
                              <div className="flex items-center gap-1 mb-2 text-xs text-stone-400">
                                <Target className="w-3 h-3" />
                                <span>选择查验目标</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <select
                                  value={ftTargets?.target1 ?? ''}
                                  onChange={(e) => updateFortuneTellerTarget(seatId, 1, e.target.value ? Number(e.target.value) : null)}
                                  className="bg-stone-800 border border-stone-600 rounded text-xs text-stone-300 p-1.5"
                                >
                                  <option value="">目标 1</option>
                                  {alivePlayers.filter(p => p.id !== seatId && p.id !== ftTargets?.target2).map(p => (
                                    <option key={p.id} value={p.id}>{String(p.id + 1)}号 {p.userName}</option>
                                  ))}
                                </select>
                                <select
                                  value={ftTargets?.target2 ?? ''}
                                  onChange={(e) => updateFortuneTellerTarget(seatId, 2, e.target.value ? Number(e.target.value) : null)}
                                  className="bg-stone-800 border border-stone-600 rounded text-xs text-stone-300 p-1.5"
                                >
                                  <option value="">目标 2</option>
                                  {alivePlayers.filter(p => p.id !== seatId && p.id !== ftTargets?.target1).map(p => (
                                    <option key={p.id} value={p.id}>{String(p.id + 1)}号 {p.userName}</option>
                                  ))}
                                </select>
                              </div>
                              <button
                                onClick={() => {
                                  if (ftTargets?.target1 != null && ftTargets?.target2 != null) {
                                    generateInfo(seatId, roleId, {
                                      target1SeatId: ftTargets.target1,
                                      target2SeatId: ftTargets.target2
                                    });
                                  }
                                }}
                                disabled={ftTargets?.target1 == null || ftTargets?.target2 == null}
                                className={`w-full mt-2 py-1.5 rounded text-xs transition-colors ${
                                  ftTargets?.target1 != null && ftTargets?.target2 != null
                                    ? 'bg-indigo-900 hover:bg-indigo-800 text-indigo-200'
                                    : 'bg-stone-700 text-stone-500 cursor-not-allowed'
                                }`}
                              >
                                生成查验结果
                              </button>
                            </div>
                          )}

                          {/* 生成的信息 */}
                          {result ? (
                            <div className="space-y-2">
                              {/* 建议信息 */}
                              <div className="flex items-start gap-2">
                                <span className="text-[10px] text-stone-500 mt-1 shrink-0">建议:</span>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm ${isTainted ? 'text-purple-300' : 'text-emerald-300'}`}>
                                      {result.suggestedInfo}
                                    </p>
                                    <button
                                      onClick={() => void copyToClipboard(result.suggestedInfo, `${String(seatId)}-suggested`)}
                                      className="p-1 rounded hover:bg-stone-700 transition-colors"
                                      title="复制"
                                    >
                                      {copiedId === `${String(seatId)}-suggested` ? (
                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                      ) : (
                                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* 真实信息（仅在中毒时显示） */}
                              {isTainted && (
                                <div className="flex items-start gap-2">
                                  <span className="text-[10px] text-stone-500 mt-1 shrink-0">真实:</span>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-sm text-stone-400 line-through">
                                        {result.realInfo}
                                      </p>
                                      <button
                                        onClick={() => void copyToClipboard(result.realInfo, `${String(seatId)}-real`)}
                                        className="p-1 rounded hover:bg-stone-700 transition-colors"
                                        title="复制"
                                      >
                                        {copiedId === `${String(seatId)}-real` ? (
                                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : (
                                          <Copy className="w-3.5 h-3.5 text-stone-500" />
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : !needsParams ? (
                            <button
                              onClick={() => generateInfo(seatId, roleId)}
                              className="w-full py-2 text-xs text-stone-500 hover:text-stone-400 border border-dashed border-stone-700 rounded hover:border-stone-600 transition-colors"
                            >
                              点击生成信息
                            </button>
                          ) : roleId !== 'fortune_teller' && (
                            <p className="text-xs text-stone-500 text-center py-2">
                              请先选择目标后生成
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* 帮助提示 */}
              <div className="text-[10px] text-stone-600 bg-stone-800/50 p-2 rounded">
                💡 提示：占卜师需要选择两个查验目标。中毒/醉酒状态的玩家会收到伪造信息。
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SmartInfoPanel;
