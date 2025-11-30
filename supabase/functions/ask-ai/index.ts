
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import OpenAI from "https://esm.sh/openai@4.28.0";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// AI Provider Configuration Mapping
interface ProviderConfig {
    envKey: string;
    baseURL: string;
    model: string;
}

const PROVIDER_CONFIG: Record<string, ProviderConfig> = {
    deepseek: {
        envKey: 'VITE_DEEPSEEK_KEY',
        baseURL: 'https://api.deepseek.com',
        model: 'deepseek-chat',
    },
    gemini: {
        envKey: 'VITE_GEMINI_KEY',
        baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash-exp',
    },
    kimi: {
        envKey: 'VITE_KIMI_KEY',
        baseURL: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k',
    },
    sf_deepseek_v3_2: {
        envKey: 'VITE_SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'deepseek-ai/DeepSeek-V3.2-Exp',
    },
    sf_minimax_m2: {
        envKey: 'VITE_SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'MiniMaxAI/MiniMax-M2',
    },
    sf_qwen_3_vl: {
        envKey: 'VITE_SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'Qwen/Qwen3-VL-32B-Instruct',
    },
    sf_glm_4_6: {
        envKey: 'VITE_SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'zai-org/GLM-4.6',
    },
    sf_kimi_k2: {
        envKey: 'VITE_SILICONFLOW_KEY',
        baseURL: 'https://api.siliconflow.cn/v1',
        model: 'moonshotai/Kimi-K2-Thinking',
    },
    sf_kimi_k2_instruct: {
        envKey: 'VITE_SILICONFLOW_KEY',
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
        // 1. Verify Authentication (Optional but recommended)
        // For this demo, we'll check if the Authorization header exists.
        // In a stricter app, you'd verify the JWT using Supabase Auth.
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

        // 4. Call AI API
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "You are an expert 'Blood on the Clocktower' Storyteller assistant. Keep answers concise and helpful. Respond in Chinese." },
                { role: "user", content: `Context: ${JSON.stringify(gameContext)}. User Question: ${prompt}` }
            ],
            model: config.model,
        });

        let reply = completion.choices[0]?.message?.content || '';

        // Handle DeepSeek R1 "reasoning_content" if available
        // @ts-ignore
        const reasoning = completion.choices[0]?.message?.reasoning_content;
        if (reasoning) {
            reply = `<think>${reasoning}</think>\n${reply}`;
        }

        // 5. Return Response
        return new Response(JSON.stringify({ reply }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error('Error:', error.message);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400, // Or 500 depending on error
        });
    }
});
