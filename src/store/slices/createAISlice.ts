import { StoreSlice, AiProvider } from '../types';
import { AI_CONFIG } from '../aiConfig';
import { ChatMessage } from '../../types';
import { supabase } from './connection';

interface AskAiResponse {
    reply?: string;
    error?: string;
}

type InvokeResult<T> = {
    data: T | null;
    error: { message?: string } | null;
};

export interface AISlice {
    isAiThinking: boolean;
    aiProvider: AiProvider;

    askAi: (prompt: string) => Promise<void>;
    setAiProvider: (provider: AiProvider) => void;
    clearAiMessages: () => void;
    deleteAiMessage: (id: string) => void;
}

export const createAISlice: StoreSlice<AISlice> = (set, get) => ({
    isAiThinking: false,
    aiProvider: 'sf_deepseek_v3_2',  // 默认使用 SiliconFlow 的 DeepSeek V3

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
            const config = AI_CONFIG[aiProvider];

            // 构建游戏上下文（精简版，避免传输过多数据）
            const gameContext = {
                phase: gameState.phase,
                dayCount: gameState.roundInfo.dayCount,
                scriptId: gameState.currentScriptId,
                seatCount: gameState.seats.length,
                alivePlayers: gameState.seats.filter(s => !s.isDead).length,
                // 包含历史对话以支持多轮会话
                previousMessages: gameState.aiMessages.slice(-10).map(m => ({
                    role: m.role ?? 'user',
                    content: m.content
                }))
            };

            // 调用 Supabase Edge Function
            const response = await supabase.functions.invoke<AskAiResponse>('ask-ai', {
                body: {
                    prompt,
                    gameContext,
                    aiProvider
                }
            }) as InvokeResult<AskAiResponse>;
            const { data, error } = response;

            if (error) {
                throw new Error(error.message || 'Edge Function 调用失败');
            }

            if (data?.error) {
                throw new Error(data.error);
            }

            const responseText = data?.reply ?? '（无回复）';

            // Add AI response
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                senderId: 'ai',
                senderName: `Grimoire AI (${config.name})`,
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

        } catch (error: unknown) {
            console.error('AI Error:', error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            set((state) => {
                state.isAiThinking = false;
                if (state.gameState) {
                    state.gameState.aiMessages.push({
                        id: Date.now().toString(),
                        senderId: 'system',
                        senderName: 'System',
                        recipientId: null,
                        content: `AI 请求失败: ${errorMessage}`,
                        timestamp: Date.now(),
                        type: 'system',
                        role: 'system'
                    });
                }
            });
        }
    },
});
