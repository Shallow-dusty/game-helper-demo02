import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Zap, Shield, Skull, Trophy, X } from 'lucide-react';
import { Button } from '../ui/button';
import type { ChainReactionEvent } from '../../lib/chainReaction';
import { useTranslation } from 'react-i18next';

interface ChainReactionModalProps {
  isOpen: boolean;
  events: ChainReactionEvent[];
  onConfirm: (event: ChainReactionEvent) => void;
  onSkip: (event: ChainReactionEvent) => void;
  onClose: () => void;
}

/**
 * 连锁结算确认模态框
 * 
 * 用于显示和确认游戏中的连锁反应事件：
 * - 祖母-孙子死亡联动
 * - 月之子死亡联动
 * - 僧侣保护生效
 * - 游戏结束条件
 */
export const ChainReactionModal: React.FC<ChainReactionModalProps> = ({
  isOpen,
  events,
  onConfirm,
  onSkip,
  onClose,
}) => {
  const { t } = useTranslation();
  const currentEvent = events[0];
  
  if (!isOpen || !currentEvent) return null;

  const getIcon = () => {
    switch (currentEvent.type) {
      case 'death':
        return <Skull className="w-8 h-8 text-red-400" />;
      case 'protection':
        return <Shield className="w-8 h-8 text-blue-400" />;
      case 'game_end':
        return <Trophy className="w-8 h-8 text-amber-400" />;
      case 'ability_trigger':
        return <Zap className="w-8 h-8 text-purple-400" />;
      default:
        return <AlertTriangle className="w-8 h-8 text-amber-400" />;
    }
  };

  const getBorderColor = () => {
    switch (currentEvent.priority) {
      case 'high':
        return 'border-red-700/50';
      case 'medium':
        return 'border-amber-700/50';
      default:
        return 'border-stone-700/50';
    }
  };

  const getActionLabel = () => {
    switch (currentEvent.suggestedAction) {
      case 'mark_dead':
        return t('game.chainReaction.actions.markDead');
      case 'cancel_kill':
        return t('game.chainReaction.actions.cancelKill');
      case 'end_game':
        return t('game.chainReaction.actions.endGame');
      default:
        return t('game.chainReaction.actions.confirm');
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`glass-panel rounded-lg overflow-hidden border-2 ${getBorderColor()} shadow-2xl`}>
            {/* 头部 */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-stone-800/50 bg-gradient-to-r from-stone-900/80 to-transparent">
              <div className="p-2 rounded-full bg-stone-800/50">
                {getIcon()}
              </div>
              <div className="flex-1">
                <h3 className="font-cinzel text-lg text-amber-200">
                  {currentEvent.title}
                </h3>
                {events.length > 1 && (
                  <p className="text-xs text-stone-500 mt-1">
                    {t('game.chainReaction.pendingEvents', { count: events.length - 1 })}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded hover:bg-stone-800/50 transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* 内容区 */}
            <div className="px-5 py-4">
              <p className="text-stone-300 leading-relaxed">
                {currentEvent.message}
              </p>
              
              {/* 受影响的座位 */}
              {currentEvent.affectedSeatIds.length > 0 && (
                <div className="mt-3 p-3 bg-stone-900/50 rounded border border-stone-800">
                  <p className="text-xs text-stone-500 mb-1">{t('game.chainReaction.affectedSeats')}</p>
                  <p className="text-sm text-stone-300">
                    {t('game.chainReaction.seatNumbers', { seats: currentEvent.affectedSeatIds.map(id => id + 1).join(', ') })}
                  </p>
                </div>
              )}
            </div>

            {/* 按钮区 */}
            <div className="flex gap-3 px-5 py-4 border-t border-stone-800/50 bg-stone-900/30">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => onSkip(currentEvent)}
              >
                {t('game.chainReaction.skip')}
              </Button>
              <Button
                variant="default"
                className="flex-1 bg-amber-700 hover:bg-amber-600"
                onClick={() => onConfirm(currentEvent)}
              >
                {getActionLabel()}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChainReactionModal;
