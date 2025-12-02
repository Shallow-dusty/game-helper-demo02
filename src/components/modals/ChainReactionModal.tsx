import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChainReactionEvent } from '../../lib/chainReaction';
import { useStore } from '../../store';
import { X, AlertTriangle, Shield, Skull, Trophy, Zap } from 'lucide-react';

/**
 * ChainReactionModal - 连锁反应确认对话框
 * 
 * 当检测到连锁死亡、保护效果或游戏结束条件时，
 * 向 ST 展示确认对话框，让 ST 决定如何处理
 */

interface ChainReactionModalProps {
  events: ChainReactionEvent[];
  onConfirm: (event: ChainReactionEvent) => void;
  onDismiss: (event: ChainReactionEvent) => void;
  onClose: () => void;
}

const eventIcons: Record<ChainReactionEvent['type'], React.ElementType> = {
  death: Skull,
  protection: Shield,
  game_end: Trophy,
  ability_trigger: Zap
};

const priorityColors: Record<ChainReactionEvent['priority'], string> = {
  high: 'border-red-500/50 bg-red-950/30',
  medium: 'border-amber-500/50 bg-amber-950/30',
  low: 'border-stone-500/50 bg-stone-900/30'
};

const priorityBadgeColors: Record<ChainReactionEvent['priority'], string> = {
  high: 'bg-red-900 text-red-200',
  medium: 'bg-amber-900 text-amber-200',
  low: 'bg-stone-700 text-stone-300'
};

export const ChainReactionModal: React.FC<ChainReactionModalProps> = ({
  events,
  onConfirm,
  onDismiss,
  onClose
}) => {
  const seats = useStore(state => state.gameState?.seats || []);

  if (events.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          className="relative bg-stone-900 rounded-xl border border-stone-700 shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-stone-700 bg-stone-800/50">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-stone-100">
                ⚡ 连锁反应检测
              </h2>
              <span className="text-xs bg-stone-700 px-2 py-0.5 rounded text-stone-300">
                {events.length} 个事件
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-stone-700 transition-colors"
            >
              <X className="w-5 h-5 text-stone-400" />
            </button>
          </div>

          {/* Events List */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {events.map((event, index) => {
              const Icon = eventIcons[event.type];
              
              return (
                <motion.div
                  key={`${event.type}-${index}`}
                  className={`rounded-lg border p-4 ${priorityColors[event.priority]}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-5 h-5 text-stone-300" />
                      <h3 className="font-bold text-stone-100">{event.title}</h3>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${priorityBadgeColors[event.priority]}`}>
                      {event.priority === 'high' ? '高优先' : event.priority === 'medium' ? '中优先' : '低优先'}
                    </span>
                  </div>

                  {/* Event Message */}
                  <p className="text-sm text-stone-300 mb-4 leading-relaxed">
                    {event.message}
                  </p>

                  {/* Affected Players */}
                  {event.affectedSeatIds.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-stone-500 mb-2">影响的玩家：</p>
                      <div className="flex flex-wrap gap-2">
                        {event.affectedSeatIds.map(seatId => {
                          const seat = seats[seatId];
                          return (
                            <span
                              key={seatId}
                              className="inline-flex items-center gap-1.5 text-xs bg-stone-800 border border-stone-600 px-2 py-1 rounded"
                            >
                              <span className="w-5 h-5 rounded-full bg-stone-700 flex items-center justify-center text-[10px] font-bold">
                                {seatId + 1}
                              </span>
                              <span className="text-stone-300">{seat?.userName || `座位 ${seatId + 1}`}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {event.suggestedAction === 'mark_dead' && (
                      <>
                        <button
                          onClick={() => onConfirm(event)}
                          className="flex-1 bg-red-900 hover:bg-red-800 text-red-100 py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Skull className="w-4 h-4" />
                          标记死亡
                        </button>
                        <button
                          onClick={() => onDismiss(event)}
                          className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-300 py-2 px-4 rounded text-sm transition-colors"
                        >
                          跳过
                        </button>
                      </>
                    )}

                    {event.suggestedAction === 'cancel_kill' && (
                      <>
                        <button
                          onClick={() => onConfirm(event)}
                          className="flex-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-100 py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Shield className="w-4 h-4" />
                          取消击杀
                        </button>
                        <button
                          onClick={() => onDismiss(event)}
                          className="flex-1 bg-red-900/50 hover:bg-red-800/50 text-red-200 py-2 px-4 rounded text-sm transition-colors"
                        >
                          仍然击杀
                        </button>
                      </>
                    )}

                    {event.suggestedAction === 'end_game' && (
                      <>
                        <button
                          onClick={() => onConfirm(event)}
                          className="flex-1 bg-amber-900 hover:bg-amber-800 text-amber-100 py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Trophy className="w-4 h-4" />
                          结束游戏
                        </button>
                        <button
                          onClick={() => onDismiss(event)}
                          className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-300 py-2 px-4 rounded text-sm transition-colors"
                        >
                          继续游戏
                        </button>
                      </>
                    )}

                    {event.suggestedAction === 'ignore' && (
                      <button
                        onClick={() => onDismiss(event)}
                        className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-300 py-2 px-4 rounded text-sm transition-colors"
                      >
                        已知悉
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-stone-700 bg-stone-800/30">
            <p className="text-xs text-stone-500 text-center">
              💡 提示：高优先级事件应优先处理，处理顺序可能影响游戏结果
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
