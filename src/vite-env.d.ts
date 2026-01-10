/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_ANON_KEY: string
    readonly VITE_ANTHROPIC_API_KEY?: string
    readonly VITE_DEEPSEEK_API_KEY?: string
    readonly VITE_OPENAI_API_KEY?: string
    readonly VITE_DEEPSEEK_KEY?: string
    readonly VITE_GEMINI_KEY?: string
    readonly VITE_KIMI_KEY?: string
    readonly VITE_GLM_KEY?: string
    readonly VITE_HW_MAAS_KEY?: string
    readonly VITE_SILICONFLOW_KEY?: string
    readonly VITE_ADMIN_PASSWORD?: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
