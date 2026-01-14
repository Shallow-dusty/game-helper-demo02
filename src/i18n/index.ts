import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCN from './locales/zh-CN.json';
import en from './locales/en.json';

// 语言资源
const resources = {
  'zh-CN': {
    translation: zhCN,
  },
  en: {
    translation: en,
  },
};

void i18n
  // 浏览器语言检测
  .use(LanguageDetector)
  // react-i18next 绑定
  .use(initReactI18next)
  // 初始化配置
  .init({
    resources,
    fallbackLng: 'zh-CN', // 默认语言
    supportedLngs: ['zh-CN', 'en'],

    // 语言检测配置
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React 已经处理 XSS
    },

    // 调试模式 (开发环境)
    debug: import.meta.env.DEV,
  });

export default i18n;

// 语言切换函数
export const changeLanguage = (lng: 'zh-CN' | 'en') => {
  void i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
};

// 获取当前语言
export const getCurrentLanguage = () => i18n.language;

// 支持的语言列表
export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
] as const;
