import { AiProvider } from './types';

export const AI_CONFIG: Record<AiProvider, { model: string; name: string; note?: string }> = {
    deepseek: {
        model: 'deepseek-chat',
        name: 'DeepSeek V3.2 Exp (Official)',
        note: '✅ 稳定可用，推荐使用'
    },
    gemini: {
        model: 'gemini-2.0-flash-exp',
        name: 'Gemini 2.0 Flash (Exp)',
        note: '⚠️ 国内网络无法访问，需要科学上网'
    },
    kimi: {
        model: 'moonshot-v1-8k',
        name: 'Kimi (Official)',
        note: '❌ 官方API不支持浏览器直连(CORS)，请使用SiliconFlow版Kimi'
    },
    // SiliconFlow Models - 需要 VITE_SILICONFLOW_KEY
    sf_deepseek_v3_2: {
        model: 'deepseek-ai/DeepSeek-V3.2-Exp',
        name: '🚀 DeepSeek V3.2 Exp (SF)',
        note: '⚠️ SiliconFlow 直连'
    },
    sf_minimax_m2: {
        model: 'MiniMaxAI/MiniMax-M2',
        name: '🦄 MiniMax M2',
        note: '⚠️ SiliconFlow 直连 (MoE)'
    },
    sf_qwen_3_vl: {
        model: 'Qwen/Qwen3-VL-32B-Instruct',
        name: '👁️ Qwen 3 VL 32B',
        note: '⚠️ SiliconFlow 直连 (视觉模型)'
    },
    sf_glm_4_6: {
        model: 'zai-org/GLM-4.6',
        name: '🚀 GLM 4.6',
        note: '⚠️ SiliconFlow 直连 (最新版)'
    },
    sf_kimi_k2: {
        model: 'moonshotai/Kimi-K2-Thinking',
        name: '🤔 Kimi K2 Thinking',
        note: '⚠️ SiliconFlow 直连 (思考模型)'
    },
    sf_kimi_k2_instruct: {
        model: 'moonshotai/Kimi-K2-Instruct-0905',
        name: '📚 Kimi K2 Instruct',
        note: '⚠️ SiliconFlow 直连 (指令模型)'
    }
};

// 导出配置供组件使用，动态添加 apiKey 字段
export const getAiConfig = (): Record<AiProvider, { model: string; name: string; note?: string; apiKey?: string }> => {
    const config: Record<AiProvider, { model: string; name: string; note?: string; apiKey?: string }> = {} as any;

    // 从环境变量读取 API Keys
    const deepseekKey = import.meta.env.VITE_DEEPSEEK_KEY;
    const geminiKey = import.meta.env.VITE_GEMINI_KEY;
    const kimiKey = import.meta.env.VITE_KIMI_KEY;
    const siliconflowKey = import.meta.env.VITE_SILICONFLOW_KEY;

    // 为每个 provider 添加 apiKey 字段
    for (const [key, value] of Object.entries(AI_CONFIG)) {
        const provider = key as AiProvider;
        let apiKey: string | undefined;

        if (provider === 'deepseek') {
            apiKey = deepseekKey;
        } else if (provider === 'gemini') {
            apiKey = geminiKey;
        } else if (provider === 'kimi') {
            apiKey = kimiKey;
        } else if (provider.startsWith('sf_')) {
            apiKey = siliconflowKey;
        }

        config[provider] = { ...value, apiKey };
    }

    return config;
};
