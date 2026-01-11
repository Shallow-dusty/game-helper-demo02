import { useTranslation } from 'react-i18next';
import { useCallback } from 'react';

/**
 * 自定义翻译 Hook
 * 提供更方便的翻译访问方式
 *
 * @example
 * const { t, tGame, tCommon } = useAppTranslation();
 * console.log(tCommon('loading')); // "加载中..."
 * console.log(tGame('phase.day')); // "白天"
 */
export function useAppTranslation() {
  const { t, i18n } = useTranslation();

  // 通用翻译
  const tCommon = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`common.${key}`, options),
    [t]
  );

  // 游戏相关翻译
  const tGame = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`game.${key}`, options),
    [t]
  );

  // 魔典相关翻译
  const tGrimoire = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`grimoire.${key}`, options),
    [t]
  );

  // 座位相关翻译
  const tSeat = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`seat.${key}`, options),
    [t]
  );

  // 投票相关翻译
  const tVoting = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`voting.${key}`, options),
    [t]
  );

  // 错误消息翻译
  const tError = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`errors.${key}`, options),
    [t]
  );

  // 成功消息翻译
  const tSuccess = useCallback(
    (key: string, options?: Record<string, unknown>) =>
      t(`success.${key}`, options),
    [t]
  );

  return {
    t,
    i18n,
    tCommon,
    tGame,
    tGrimoire,
    tSeat,
    tVoting,
    tError,
    tSuccess,
    // 语言信息
    currentLanguage: i18n.language,
    isZhCN: i18n.language === 'zh-CN' || i18n.language.startsWith('zh'),
    isEn: i18n.language === 'en' || i18n.language.startsWith('en'),
  };
}

export default useAppTranslation;
