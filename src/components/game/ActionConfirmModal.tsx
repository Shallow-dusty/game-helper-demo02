import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, Edit2 } from 'lucide-react';
import { Button } from '../ui/button';
import type { ConfirmationOptions } from '../../hooks/useActionConfirmation';

interface ActionConfirmModalProps {
  isOpen: boolean;
  options: ConfirmationOptions | null;
  inputValue?: string;
  onConfirm: () => void;
  onModify?: () => void;
  onCancel: () => void;
  onInputChange?: (value: string) => void;
}

/**
 * 通用操作确认模态框
 * 
 * 用于"人机协作"模式下的所有确认操作：
 * - 智能信息生成确认
 * - 连锁结算确认
 * - 规则约束提示
 */
export const ActionConfirmModal: React.FC<ActionConfirmModalProps> = ({
  isOpen,
  options,
  inputValue = '',
  onConfirm,
  onModify,
  onCancel,
  onInputChange,
}) => {
  if (!options) return null;

  const getIcon = () => {
    if (options.icon) return options.icon;
    switch (options.type) {
      case 'confirm':
        return <AlertTriangle className="w-6 h-6 text-amber-400" />;
      case 'confirm-modify':
        return <Edit2 className="w-6 h-6 text-blue-400" />;
      case 'info':
      default:
        return <Info className="w-6 h-6 text-stone-400" />;
    }
  };

  const getHeaderBg = () => {
    switch (options.type) {
      case 'confirm':
        return 'bg-gradient-to-r from-amber-900/30 to-transparent';
      case 'confirm-modify':
        return 'bg-gradient-to-r from-blue-900/30 to-transparent';
      default:
        return 'bg-gradient-to-r from-stone-800/30 to-transparent';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 羊皮纸风格卡片 */}
            <div className="glass-panel rounded-lg overflow-hidden border border-amber-900/30 shadow-2xl">
              {/* 头部 */}
              <div className={`flex items-center gap-3 px-5 py-4 border-b border-stone-800/50 ${getHeaderBg()}`}>
                {getIcon()}
                <h3 className="font-cinzel text-lg text-amber-200 flex-1">
                  {options.title}
                </h3>
                <button
                  onClick={onCancel}
                  className="p-1 rounded hover:bg-stone-800/50 transition-colors"
                >
                  <X className="w-4 h-4 text-stone-500" />
                </button>
              </div>

              {/* 内容区 */}
              <div className="px-5 py-4">
                <p className="text-stone-300 leading-relaxed whitespace-pre-wrap">
                  {options.message}
                </p>

                {/* 可编辑输入框（用于修改模式） */}
                {options.type === 'confirm-modify' && onInputChange && (
                  <textarea
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    className="w-full mt-4 p-3 bg-stone-900/50 border border-stone-700/50 rounded-lg 
                               text-stone-200 placeholder-stone-600 resize-none
                               focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/30
                               transition-all duration-200"
                    rows={3}
                    placeholder="输入修改后的内容..."
                  />
                )}
              </div>

              {/* 按钮区 */}
              <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-stone-800/50 bg-stone-900/30">
                <Button
                  variant="ghost"
                  onClick={onCancel}
                  className="text-stone-400 hover:text-stone-200"
                >
                  {options.cancelText || '忽略'}
                </Button>

                {options.type === 'confirm-modify' && onModify && (
                  <Button
                    variant="outline"
                    onClick={onModify}
                    className="border-blue-600/50 text-blue-400 hover:bg-blue-900/30"
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    {options.modifyText || '修改'}
                  </Button>
                )}

                <Button
                  onClick={onConfirm}
                  className="bg-amber-900/50 border border-amber-600/50 text-amber-200 
                             hover:bg-amber-800/50 hover:border-amber-500/50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {options.confirmText || '确认'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActionConfirmModal;
