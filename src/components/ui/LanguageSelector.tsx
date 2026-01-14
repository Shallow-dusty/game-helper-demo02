import { useTranslation } from 'react-i18next';
import { changeLanguage, supportedLanguages, getCurrentLanguage } from '../../i18n';
import { useState, useEffect } from 'react';

/**
 * 语言切换器组件
 * Language Selector Component
 */
export function LanguageSelector() {
  const { t } = useTranslation();
  const [currentLang, setCurrentLang] = useState(getCurrentLanguage());

  useEffect(() => {
    // 监听语言变化
    const handleLanguageChange = () => {
      setCurrentLang(getCurrentLanguage());
    };

    // 订阅 i18next 语言变化事件
    window.addEventListener('languagechange', handleLanguageChange);
    return () => window.removeEventListener('languagechange', handleLanguageChange);
  }, []);

  const handleChange = (lng: 'zh-CN' | 'en') => {
    changeLanguage(lng);
    setCurrentLang(lng);
  };

  return (
    <div className="flex items-center gap-1">
      {supportedLanguages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleChange(lang.code)}
          className={`
            px-2 py-1 rounded text-sm transition-all
            ${currentLang === lang.code || currentLang.startsWith(lang.code.split('-')[0])
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
          title={lang.name}
        >
          {lang.flag}
        </button>
      ))}
    </div>
  );
}

/**
 * 语言选择下拉框
 * Language Select Dropdown
 */
export function LanguageSelect() {
  const { i18n } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    changeLanguage(e.target.value as 'zh-CN' | 'en');
  };

  return (
    <select
      value={i18n.language}
      onChange={handleChange}
      className="bg-gray-800 text-white border border-gray-600 rounded px-2 py-1 text-sm"
    >
      {supportedLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  );
}
