import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Shield,
  Users,
  Skull,
  Ghost,
  Crown,
  X
} from 'lucide-react';
import { checkRuleCompliance, type RuleCheckResult } from '../../lib/distributionAnalysis';
import type { Seat } from '../../types';

interface RuleCompliancePanelProps {
  seats: Seat[];
  scriptId: string;
  playerCount: number;
  isOpen: boolean;
  onClose: () => void;
}

const getRuleIcon = (rule: string) => {
  switch (rule) {
    case 'DEMON_COUNT':
      return <Skull className="w-4 h-4" />;
    case 'MINION_COUNT':
      return <Ghost className="w-4 h-4" />;
    case 'OUTSIDER_COUNT':
      return <Crown className="w-4 h-4" />;
    case 'TOWNSFOLK_COUNT':
      return <Users className="w-4 h-4" />;
    case 'NO_DUPLICATES':
      return <Shield className="w-4 h-4" />;
    case 'PLAYER_COUNT':
      return <Users className="w-4 h-4" />;
    default:
      return <Info className="w-4 h-4" />;
  }
};

const getSeverityStyle = (severity: RuleCheckResult['severity'], passed: boolean) => {
  if (passed) {
    return {
      bg: 'bg-emerald-950/30',
      border: 'border-emerald-800/50',
      text: 'text-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />
    };
  }
  
  switch (severity) {
    case 'error':
      return {
        bg: 'bg-red-950/30',
        border: 'border-red-800/50',
        text: 'text-red-400',
        icon: <XCircle className="w-5 h-5 text-red-500" />
      };
    case 'warning':
      return {
        bg: 'bg-amber-950/30',
        border: 'border-amber-800/50',
        text: 'text-amber-400',
        icon: <AlertTriangle className="w-5 h-5 text-amber-500" />
      };
    default:
      return {
        bg: 'bg-slate-900/30',
        border: 'border-slate-700/50',
        text: 'text-slate-400',
        icon: <Info className="w-5 h-5 text-slate-500" />
      };
  }
};

/**
 * 规则合规性检查面板
 * 
 * 显示游戏配置的规则检查结果：
 * - 恶魔/爪牙/外来者/镇民数量
 * - 重复角色检查
 * - 剧本角色验证
 * - 特殊角色效果提示
 */
export const RuleCompliancePanel: React.FC<RuleCompliancePanelProps> = ({
  seats,
  scriptId,
  playerCount,
  isOpen,
  onClose
}) => {
  const { t } = useTranslation();

  const ruleChecks = useMemo(() =>
    checkRuleCompliance(seats, scriptId, playerCount),
    [seats, scriptId, playerCount]
  );

  const summary = useMemo(() => {
    const errors = ruleChecks.filter(c => !c.passed && c.severity === 'error').length;
    const warnings = ruleChecks.filter(c => !c.passed && c.severity === 'warning').length;
    const passed = ruleChecks.filter(c => c.passed).length;
    return { errors, warnings, passed, total: ruleChecks.length };
  }, [ruleChecks]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="glass-panel rounded-lg border border-stone-700/50 shadow-2xl">
              {/* 头部 */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800/50 bg-gradient-to-r from-stone-900/80 to-transparent">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-amber-500" />
                  <h3 className="font-cinzel text-lg text-amber-200">{t('game.ruleCompliance.title')}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded hover:bg-stone-800/50 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              {/* 摘要 */}
              <div className="px-5 py-3 border-b border-stone-800/30 bg-stone-900/30">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-400">{summary.passed} {t('game.ruleCompliance.passed')}</span>
                  </div>
                  {summary.warnings > 0 && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="text-amber-400">{summary.warnings} {t('game.ruleCompliance.warnings')}</span>
                    </div>
                  )}
                  {summary.errors > 0 && (
                    <div className="flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-red-500" />
                      <span className="text-red-400">{summary.errors} {t('game.ruleCompliance.errors')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 规则检查列表 */}
              <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
                {ruleChecks.map((check, index) => {
                  const style = getSeverityStyle(check.severity, check.passed);
                  return (
                    <motion.div
                      key={check.rule}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${style.bg} ${style.border}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {style.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-stone-500">
                            {getRuleIcon(check.rule)}
                          </span>
                          <span className="text-xs text-stone-500 uppercase tracking-wider">
                            {check.rule.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className={`text-sm ${style.text}`}>
                          {check.message}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* 底部 */}
              <div className="px-5 py-3 border-t border-stone-800/30 bg-stone-900/30">
                <p className="text-xs text-stone-500 text-center">
                  {summary.errors === 0 && summary.warnings === 0
                    ? t('game.ruleCompliance.allPassed')
                    : summary.errors > 0
                      ? t('game.ruleCompliance.hasErrors')
                      : t('game.ruleCompliance.hasWarnings')}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RuleCompliancePanel;
