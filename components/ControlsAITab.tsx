import React, { useState } from 'react';
import { useStore, AiProvider } from '../store';

export const ControlsAITab: React.FC = () => {
  const user = useStore(state => state.user);
  const gameState = useStore(state => state.gameState);
  const askAi = useStore(state => state.askAi);
  const isAiThinking = useStore(state => state.isAiThinking);
  const aiProvider = useStore(state => state.aiProvider);
  const setAiProvider = useStore(state => state.setAiProvider);
  const clearAiMessages = useStore(state => state.clearAiMessages);
  const deleteAiMessage = useStore(state => state.deleteAiMessage);

  const [aiPrompt, setAiPrompt] = useState('');

  if (!user || !gameState) return null;

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;
    const prompt = aiPrompt;
    setAiPrompt('');
    await askAi(prompt);
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 scrollbar-thin">
        {/* AI Messages */}
        {gameState.aiMessages.length === 0 && (
          <div className="text-center text-stone-500 py-8">
            <div className="text-3xl mb-2">🤖</div>
            <p className="text-sm">AI 助手就绪</p>
            <p className="text-xs text-stone-600 mt-1">输入问题，获取游戏建议</p>
          </div>
        )}
        {gameState.aiMessages.map(msg => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
              msg.role === 'user'
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
                <button onClick={() => deleteAiMessage(msg.id)} className="text-[10px] text-red-900 hover:text-red-500">删除</button>
              )}
            </div>
          </div>
        ))}
        {isAiThinking && (
          <div className="flex items-start">
            <div className="bg-amber-900/30 text-amber-100 p-3 rounded-lg text-sm border border-amber-800/30 animate-pulse">
              思考中...
            </div>
          </div>
        )}
      </div>
      <form onSubmit={handleAiSubmit} className="flex gap-2">
        <input
          type="text"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
          placeholder="询问 AI 助手..."
          className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-stone-300 focus:border-amber-600 focus:outline-none"
        />
        <button type="submit" disabled={!aiPrompt.trim() || isAiThinking} className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white px-3 py-2 rounded">
          发送
        </button>
      </form>
      {user.isStoryteller && (
        <div className="mt-2 flex justify-between items-center">
          <button onClick={clearAiMessages} className="text-xs text-stone-500 hover:text-stone-300">清空记录</button>
          <select
            value={aiProvider}
            onChange={(e) => setAiProvider(e.target.value as AiProvider)}
            className="bg-stone-950 border border-stone-800 text-[10px] text-stone-500 rounded px-1"
          >
            <optgroup label="官方 API（推荐）">
              <option value="deepseek">DeepSeek V3 (稳定)</option>
            </optgroup>
            <optgroup label="其他（可能有 CORS 问题）">
              <option value="kimi">Kimi K2</option>
              <option value="sf_r1">DeepSeek R1 (SF)</option>
              <option value="sf_r1_llama_70b">R1 Llama 70B (SF)</option>
              <option value="sf_r1_qwen_32b">R1 Qwen 32B (SF)</option>
            </optgroup>
          </select>
        </div>
      )}
      <p className="text-[10px] text-stone-600 mt-2 text-center">
        💡 提示：仅 DeepSeek 官方 API 稳定可用，其他 API 可能因 CORS 策略无法访问
      </p>
    </div>
  );
};
