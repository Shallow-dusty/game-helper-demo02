/**
 * AI Slice - 处理 AI 助手相关状态和操作
 * 
 * 重命名自 createAISlice.ts，遵循新的命名规范
 */
import { StoreSlice, AiProvider } from '../types';
import { getAiConfig } from '../aiConfig';
import { ChatMessage } from '../../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

export interface AISlice {
    isAiThinking: boolean;
    aiProvider: AiProvider;

    askAi: (prompt: string) => Promise<void>;
    setAiProvider: (provider: AiProvider) => void;
    clearAiMessages: () => void;
    deleteAiMessage: (id: string) => void;
}

export const aiSlice: StoreSlice<AISlice> = (set, get) => ({
    isAiThinking: false,
    aiProvider: 'deepseek',

    setAiProvider: (provider) => set({ aiProvider: provider }),

    clearAiMessages: () => set((state) => {
        if (state.gameState) {
            state.gameState.aiMessages = [];
        }
    }),

    deleteAiMessage: (id) => set((state) => {
        if (state.gameState) {
            state.gameState.aiMessages = state.gameState.aiMessages.filter(m => m.id !== id);
        }
    }),

    askAi: async (prompt) => {
        const { gameState, aiProvider } = get();
        if (!gameState) return;

        set({ isAiThinking: true });

        // Add user message
        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            senderId: 'user',
            senderName: 'Storyteller',
            recipientId: null,
            content: prompt,
            timestamp: Date.now(),
            type: 'chat',
            role: 'user'
        };

        set((state) => {
            if (state.gameState) {
                state.gameState.aiMessages.push(userMsg);
            }
        });

        try {
            const config = getAiConfig()[aiProvider];
            if (!config.apiKey) {
                throw new Error(`未配置 ${config.name} 的 API Key`);
            }

            let responseText = '';

            // --- GEMINI ---
            if (aiProvider === 'gemini') {
                const genAI = new GoogleGenerativeAI(config.apiKey);
                const model = genAI.getGenerativeModel({ model: config.model });
                const result = await model.generateContent(prompt);
                responseText = result.response.text();
            }
            // --- OPENAI COMPATIBLE (DeepSeek, Kimi, SiliconFlow) ---
            else {
                let baseURL = 'https://api.deepseek.com';
                if (aiProvider === 'kimi') baseURL = 'https://api.moonshot.cn/v1';
                if (aiProvider.startsWith('sf_')) baseURL = 'https://api.siliconflow.cn/v1';

                const openai = new OpenAI({
                    apiKey: config.apiKey,
                    baseURL: baseURL,
                    dangerouslyAllowBrowser: true
                });

                const completion = await openai.chat.completions.create({
                    messages: [
                        { role: "system", content: "你是《血染钟楼》的说书人助手。请简短、专业地回答规则问题。不要废话。" },
                        ...gameState.aiMessages.map(m => ({
                            role: (m.role || 'user'),
                            content: m.content
                        })),
                        { role: "user", content: prompt }
                    ],
                    model: config.model,
                });

                responseText = completion.choices[0]?.message?.content || '（无回复）';
            }

            // Add AI response
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                senderId: 'ai',
                senderName: 'Grimoire AI',
                recipientId: null,
                content: responseText,
                timestamp: Date.now(),
                type: 'chat',
                role: 'assistant'
            };

            set((state) => {
                if (state.gameState) {
                    state.gameState.aiMessages.push(aiMsg);
                }
                state.isAiThinking = false;
            });

        } catch (error: any) {
            console.error('AI Error:', error);
            set((state) => {
                state.isAiThinking = false;
                if (state.gameState) {
                    state.gameState.aiMessages.push({
                        id: Date.now().toString(),
                        senderId: 'system',
                        senderName: 'System',
                        recipientId: null,
                        content: `AI 请求失败: ${error.message}`,
                        timestamp: Date.now(),
                        type: 'system',
                        role: 'system'
                    });
                }
            });
        }
    },
});

// 向后兼容导出
export const createAISlice = aiSlice;
