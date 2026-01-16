/**
 * AI Provider 配置
 *
 * 注意：API 密钥现在存储在 Supabase Edge Function 的服务端环境变量中，
 * 不再暴露到前端代码。前端只需要知道模型名称和显示信息。
 */
import { AiProvider } from './types';

export interface AiProviderConfig {
    model: string;
    name: string;
    note?: string;
}

export const AI_CONFIG: Record<AiProvider, AiProviderConfig> = {
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
    glm: {
        model: 'glm-4.7',
        name: '🧠 GLM 4.7 (Official)',
        note: '✅ 智谱官方API，稳定可用'
    },
    // 华为云 MaaS Models
    hw_deepseek_v3: {
        model: 'deepseek-v3.2',
        name: '🔥 DeepSeek V3.2 (华为云)',
        note: '✅ 华为云 MaaS，国内直连稳定'
    },
    hw_deepseek_r1: {
        model: 'DeepSeek-R1',
        name: '🧠 DeepSeek R1 (华为云)',
        note: '✅ 华为云 MaaS，推理增强模型'
    },
    // SiliconFlow Models
    sf_deepseek_v3_2: {
        model: 'deepseek-ai/DeepSeek-V3.2-Exp',
        name: '🚀 DeepSeek V3.2 Exp (SF)',
        note: '✅ SiliconFlow 代理，稳定可用'
    },
    sf_minimax_m2: {
        model: 'MiniMaxAI/MiniMax-M2',
        name: '🦄 MiniMax M2',
        note: '✅ SiliconFlow 代理 (MoE)'
    },
    sf_qwen_3_vl: {
        model: 'Qwen/Qwen3-VL-32B-Instruct',
        name: '👁️ Qwen 3 VL 32B',
        note: '✅ SiliconFlow 代理 (视觉模型)'
    },
    sf_glm_4_6: {
        model: 'zai-org/GLM-4.6',
        name: '🚀 GLM 4.6',
        note: '✅ SiliconFlow 代理 (最新版)'
    },
    sf_kimi_k2: {
        model: 'moonshotai/Kimi-K2-Thinking',
        name: '🤔 Kimi K2 Thinking',
        note: '✅ SiliconFlow 代理 (思考模型)'
    },
    sf_kimi_k2_instruct: {
        model: 'moonshotai/Kimi-K2-Instruct-0905',
        name: '📚 Kimi K2 Instruct',
        note: '✅ SiliconFlow 代理 (指令模型)'
    }
};
