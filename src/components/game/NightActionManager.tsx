import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { useShallow } from 'zustand/react/shallow';
import { ROLES } from '../../constants';
import { NightActionRequest } from '../../types';
import { Moon, HelpCircle, Wine, AlertTriangle } from 'lucide-react';

// 优化选择器 - 细粒度订阅
const useNightActionManagerState = () => useStore(
    useShallow(state => ({
        seats: state.gameState?.seats ?? [],
        isStoryteller: state.user?.isStoryteller ?? false,
        hasGameState: !!state.gameState,
    }))
);

/**
 * ST 端的夜间行动管理面板
 * 显示待处理的玩家夜间行动请求，ST 可以输入结果并回复
 */
export const NightActionManager: React.FC = () => {
    const { t } = useTranslation();
    const { seats, isStoryteller, hasGameState } = useNightActionManagerState();
    const resolveNightAction = useStore(state => state.resolveNightAction);
    const getPendingNightActions = useStore(state => state.getPendingNightActions);

    const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
    const [resultInputs, setResultInputs] = useState<Record<string, string>>({});

    // 只有说书人能看到
    if (!isStoryteller || !hasGameState) return null;

    const pendingRequests = getPendingNightActions();

    if (pendingRequests.length === 0) return null;

    const handleResolve = (request: NightActionRequest) => {
        const result = resultInputs[request.id] ?? '';
        if (!result.trim()) {
            // 使用默认回复
            const role = ROLES[request.roleId];
            resolveNightAction(request.id, `${role?.name ?? request.roleId} 能力已执行`);
        } else {
            resolveNightAction(request.id, result);
        }
        setResultInputs(prev => {
            const { [request.id]: _, ...next } = prev;
            void _;
            return next;
        });
        setExpandedRequest(null);
    };

    const getTargetDescription = (request: NightActionRequest): string => {
        if (request.payload.seatId !== undefined) {
            const target = seats.find(s => s.id === request.payload.seatId);
            return target?.userName ?? `座位 ${String(request.payload.seatId + 1)}`;
        }
        if (request.payload.seatIds) {
            return request.payload.seatIds
                .map((id: number) => seats.find(s => s.id === id)?.userName ?? `座位 ${String(id + 1)}`)
                .join(', ');
        }
        if (request.payload.choice !== undefined) {
            const role = ROLES[request.roleId];
            return role?.nightAction?.options?.[request.payload.choice] ?? `选项 ${String(request.payload.choice + 1)}`;
        }
        return '已确认';
    };

    // 快捷回复模板
    const quickReplies: Record<string, string[]> = {
        // 守夜人类（获取信息）
        washerwoman: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.noEffect')],
        librarian: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.noEffect')],
        investigator: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.noEffect')],
        chef: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.noEffect')],
        empath: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.noEffect')],
        fortune_teller: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.noEffect')],
        undertaker: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.targetDead')],
        // 保护类
        monk: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.noEffect')],
        // 其他
        default: [t('nightAction.manager.quickReplies.executed'), t('nightAction.manager.quickReplies.noEffect'), t('nightAction.manager.quickReplies.targetDead')]
    };

    return (
        <div className="bg-indigo-950/30 border border-indigo-800/50 rounded-lg p-4 mb-4 animate-fade-in">
            <div className="flex items-center gap-2 mb-3 border-b border-indigo-900/50 pb-2">
                <Moon className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider">
                    {t('nightAction.manager.title')}
                </h3>
                <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {pendingRequests.length}
                </span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
                {pendingRequests.map(request => {
                    const seat = seats.find(s => s.id === request.seatId);
                    const role = ROLES[request.roleId];
                    const isExpanded = expandedRequest === request.id;
                    const roleQuickReplies = quickReplies[request.roleId] ?? quickReplies.default;

                    // 检测是否是假角色（酒鬼/疯子）：真实角色与显示角色不同
                    const realRoleId = seat?.realRoleId;
                    const seenRoleId = seat?.seenRoleId;
                    const isFakeRole = realRoleId && seenRoleId && realRoleId !== seenRoleId;
                    const realRole = realRoleId ? ROLES[realRoleId] : null;

                    return (
                        <div
                            key={request.id}
                            className={`bg-stone-900/80 border rounded-lg transition-all ${isExpanded ? 'border-indigo-500' : 'border-stone-700'
                                } ${isFakeRole ? 'ring-1 ring-amber-500/50' : ''}`}
                        >
                            {/* 请求摘要 */}
                            <div
                                className="flex items-center justify-between p-3 cursor-pointer hover:bg-stone-800/50"
                                onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                            >
                                <div className="flex items-center gap-3">
                                    {role?.icon ? (
                                        <span className="text-2xl">{role.icon}</span>
                                    ) : (
                                        <HelpCircle className="w-6 h-6 text-stone-500" />
                                    )}
                                    <div>
                                        <div className="font-bold text-stone-200 flex items-center gap-2">
                                            {seat?.userName} ({role?.name ?? request.roleId})
                                            {/* 酒鬼/疯子标记 */}
                                            {isFakeRole && (
                                                <span className="text-xs bg-amber-900/50 text-amber-300 px-1.5 py-0.5 rounded border border-amber-700 flex items-center gap-1" title={`真实角色: ${realRole?.name ?? '未知'}`}>
                                                    <Wine className="w-3 h-3" />
                                                    {realRole?.name === 'drunk' ? t('nightAction.manager.drunkLabel') : t('nightAction.manager.disguiseLabel')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-stone-500">
                                            {t('nightAction.manager.target')}: {getTargetDescription(request)}
                                            {isFakeRole && <span className="ml-2 text-amber-500">({t('nightAction.manager.realRole')}: {realRole?.name})</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded ${isFakeRole ? 'text-amber-400 bg-amber-900/40' : 'text-amber-500 bg-amber-900/30'}`}>
                                        {isFakeRole ? t('nightAction.manager.fakeAction') : t('nightAction.manager.pending')}
                                    </span>
                                    <span className="text-stone-500">{isExpanded ? '▲' : '▼'}</span>
                                </div>
                            </div>

                            {/* 展开的回复区域 */}
                            {isExpanded && (
                                <div className="p-3 pt-0 border-t border-stone-700/50">
                                    {/* 酒鬼提示 */}
                                    {isFakeRole && (
                                        <div className="mb-2 p-2 bg-amber-950/30 border border-amber-800/50 rounded text-xs text-amber-300 flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            <span>{t('nightAction.manager.drunkWarning')} <strong>{realRole?.name}</strong>，{t('nightAction.manager.drunkEffect')}</span>
                                        </div>
                                    )}
                                    {/* 快捷回复 */}
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {roleQuickReplies!.map((reply, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setResultInputs(prev => ({
                                                    ...prev,
                                                    [request.id]: reply
                                                }))}
                                                className="px-2 py-1 text-xs bg-stone-800 hover:bg-indigo-900/50 text-stone-400 hover:text-indigo-300 border border-stone-700 hover:border-indigo-600 rounded transition-colors cursor-pointer"
                                            >
                                                {reply}
                                            </button>
                                        ))}
                                    </div>

                                    {/* 输入框 */}
                                    <textarea
                                        value={resultInputs[request.id] ?? ''}
                                        onChange={(e) => setResultInputs(prev => ({
                                            ...prev,
                                            [request.id]: e.target.value
                                        }))}
                                        placeholder={t('nightAction.manager.replyPlaceholder')}
                                        className="w-full bg-stone-800 border border-stone-600 rounded p-2 text-sm text-stone-200 placeholder-stone-500 resize-none focus:outline-none focus:border-indigo-500"
                                        rows={2}
                                    />

                                    {/* 操作按钮 */}
                                    <div className="flex gap-2 mt-2">
                                        <button
                                            onClick={() => handleResolve(request)}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded text-sm transition-colors cursor-pointer"
                                        >
                                            {t('nightAction.manager.sendReply')}
                                        </button>
                                        <button
                                            onClick={() => {
                                                resolveNightAction(request.id, '（无信息）');
                                            }}
                                            className="px-3 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm transition-colors cursor-pointer"
                                        >
                                            {t('nightAction.manager.skipAction')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};




