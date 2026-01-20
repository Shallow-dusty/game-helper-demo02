import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { AI_CONFIG } from '../../store/aiConfig';
import { AiProvider } from '../../store/types';

export const ControlsAITab: React.FC = () => {
  const { t } = useTranslation();
    const user = useStore(state => state.user);
    const aiMessages = useStore(state => state.gameState?.aiMessages ?? []);
    const askAi = useStore(state => state.askAi);
    const isAiThinking = useStore(state => state.isAiThinking);
    const aiProvider = useStore(state => state.aiProvider);
    const setAiProvider = useStore(state => state.setAiProvider);
    const clearAiMessages = useStore(state => state.clearAiMessages);
    const deleteAiMessage = useStore(state => state.deleteAiMessage);

  const [aiPrompt, setAiPrompt] = useState('');

  if (!user) return null;

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const prompt = aiPrompt;
    setAiPrompt('');
    void askAi(prompt);
  };

  // 获取当前 provider 的配置
  const currentConfig = AI_CONFIG[aiProvider];

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin">
        {/* AI Messages */}
        {aiMessages.length === 0 && (
          <div className="text-center text-stone-500 py-8">
            <div className="text-3xl mb-2">🤖</div>
            <p className="text-sm">{t('controls.ai.ready')}</p>
            <p className="text-xs text-stone-600 mt-1">{t('controls.ai.subtitle')}</p>
          </div>
        )}
        {aiMessages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap ${msg.role === 'user'
              ? 'bg-stone-800 text-stone-200'
              : msg.role === 'system'
                ? 'bg-red-900/30 text-red-300 border border-red-800/30'
                : 'bg-amber-900/30 text-amber-100 border border-amber-800/30'
              }`}>
              {msg.content}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-stone-600">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              {user.isStoryteller && msg.role !== 'user' && (
                <button onClick={() => deleteAiMessage(msg.id)} className="text-[10px] text-red-900 hover:text-red-500">{t('controls.ai.delete')}</button>
              )}
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div className="flex items-start">
            <div className="bg-amber-900/30 text-amber-100 p-3 rounded-lg text-sm border border-amber-800/30 animate-pulse">
              {t('controls.ai.thinking')}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleAiSubmit} className="flex gap-2">
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder={t('controls.ai.placeholder')}
          className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-stone-300 focus:border-amber-600 focus:outline-none"
        />
        <button type="submit" disabled={!aiPrompt.trim() || isAiThinking} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-2 rounded">
          {t('controls.ai.send')}
        </button>
      </form>
      {user.isStoryteller && (
        <div className="mt-2 flex justify-between items-center">
          <button onClick={clearAiMessages} className="text-xs text-stone-500 hover:text-stone-300">{t('controls.ai.clearHistory')}</button>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as AiProvider)}
            className="bg-stone-950 border border-stone-800 text-[10px] text-stone-500 rounded px-1 max-w-[200px]"
          >
            <optgroup label={t('controls.ai.officialProvider')}>
              {Object.entries(AI_CONFIG)
                .filter(([key]) => !key.startsWith('sf_') && !key.startsWith('hw_'))
                .map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label={t('controls.ai.siliconflowProvider')}>
              {Object.entries(AI_CONFIG)
                .filter(([key]) => key.startsWith('sf_'))
                .map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
            </optgroup>
            <optgroup label="华为云 MaaS">
              {Object.entries(AI_CONFIG)
                .filter(([key]) => key.startsWith('hw_'))
                .map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.name}
                  </option>
                ))}
            </optgroup>
          </select>
        </div>
      )}
      <p className="text-[10px] text-stone-600 mt-2 text-center">
        {currentConfig?.note || t('controls.ai.selectModel')}
      </p>
    </div>
  );
};
