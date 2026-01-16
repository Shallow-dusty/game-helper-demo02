
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Provider Configuration Mapping
// 环境变量名不再使用 VITE_ 前缀（服务端不需要）
interface ProviderConfig {
    envKey: string;
    baseURL: string;
    model: string;
}

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
    // === 官方 API ===
    deepseek: {
        envKey: 'DEEPSEEK_KEY',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
    },
    gemini: {
        envKey: 'GEMINI_KEY',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash-exp',
    },
    kimi: {
        envKey: 'KIMI_KEY',
        baseURL: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k',
    },
    glm: {
        envKey: 'GLM_KEY',
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4.7',
    },
    // === 华为云 MaaS ===
    hw_deepseek_v3: {
        envKey: 'HW_MAAS_KEY',
        baseURL: 'https://api.modelarts-maas.com/v1',
        model: 'deepseek-v3.2',
    },
    hw_deepseek_r1: {
        envKey: 'HW_MAAS_KEY',
        baseURL: 'https://api.modelarts-maas.com/v1',
        model: 'DeepSeek-R1',
    },
    // === SiliconFlow 代理 ===
    sf_deepseek_v3_2: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-V3.2-Exp',
    },
    sf_minimax_m2: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'MiniMaxAI/MiniMax-M2',
    },
    sf_qwen_3_vl: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'Qwen/Qwen3-VL-32B-Instruct',
    },
    sf_glm_4_6: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'zai-org/GLM-4.6',
    },
    sf_kimi_k2: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'moonshotai/Kimi-K2-Thinking',
    },
    sf_kimi_k2_instruct: {
        envKey: 'SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'moonshotai/Kimi-K2-Instruct-0905',
    },
};

serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // 1. Verify Authentication
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // 2. Parse Request Body
        const { prompt, gameContext, aiProvider } = await req.json();

        if (!prompt) throw new Error('Missing prompt');
        if (!aiProvider || !PROVIDER_CONFIG[aiProvider]) throw new Error('Invalid or missing aiProvider');

        const config = PROVIDER_CONFIG[aiProvider];
        const apiKey = Deno.env.get(config.envKey);

        if (!apiKey) {
            console.error(`Missing API Key for ${aiProvider} (Env: ${config.envKey})`);
            throw new Error(`Server configuration error: Missing API Key for ${aiProvider}`);
        }

        // 3. Initialize OpenAI Client
        const openai = new OpenAI({
            apiKey: apiKey,
            baseURL: config.baseURL,
        });

        // 4. Build messages array with conversation history
        const systemPrompt = "你是《血染钟楼》的说书人助手。请简短、专业地回答规则问题。不要废话。";

        const messages: Array<{ role: string; content: string }> = [
            { role: "system", content: systemPrompt }
        ];

        // Add previous messages for multi-turn conversation
        if (gameContext?.previousMessages && Array.isArray(gameContext.previousMessages)) {
            for (const msg of gameContext.previousMessages) {
                if (msg.role && msg.content) {
                    messages.push({
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content
                    });
                }
            }
        }

        // Add current prompt with context
        const contextInfo = gameContext ?
            `[游戏状态: 第${gameContext.dayCount || 1}天, ${gameContext.phase || 'DAY'}阶段, ${gameContext.alivePlayers || '?'}/${gameContext.seatCount || '?'}存活]` : '';

        messages.push({
            role: "user",
            content: contextInfo ? `${contextInfo}\n${prompt}` : prompt
        });

        // 5. Call AI API
        const completion = await openai.chat.completions.create({
            messages: messages as any,
            model: config.model,
        });

        let reply = completion.choices[0]?.message?.content || '';

        // Handle DeepSeek R1 "reasoning_content" if available
        // @ts-ignore
        const reasoning = completion.choices[0]?.message?.reasoning_content;
        if (reasoning) {
            reply = `<think>${reasoning}</think>\n${reply}`;
        }

        // 6. Return Response
        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
