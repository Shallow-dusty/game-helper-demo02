import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AI_CONFIG, getAiConfig } from './aiConfig';

describe('aiConfig', () => {
    describe('AI_CONFIG 常量', () => {
        it('应该包含所有预期的 provider', () => {
            const expectedProviders = [
                'deepseek',
                'gemini', 
                'kimi',
                'sf_deepseek_v3_2',
                'sf_minimax_m2',
                'sf_qwen_3_vl',
                'sf_glm_4_6',
                'sf_kimi_k2',
                'sf_kimi_k2_instruct'
            ];
            
            for (const provider of expectedProviders) {
                expect(AI_CONFIG).toHaveProperty(provider);
            }
        });

        it('每个配置应该有 model 和 name 属性', () => {
            for (const [, config] of Object.entries(AI_CONFIG)) {
                expect(config).toHaveProperty('model');
                expect(config).toHaveProperty('name');
                expect(typeof config.model).toBe('string');
                expect(typeof config.name).toBe('string');
            }
        });

        it('deepseek 配置应该正确', () => {
            expect(AI_CONFIG.deepseek.model).toBe('deepseek-chat');
            expect(AI_CONFIG.deepseek.name).toContain('DeepSeek');
        });

        it('gemini 配置应该正确', () => {
            expect(AI_CONFIG.gemini.model).toContain('gemini');
            expect(AI_CONFIG.gemini.name).toContain('Gemini');
        });

        it('sf_* provider 应该使用 SiliconFlow 模型路径', () => {
            const sfProviders = Object.entries(AI_CONFIG).filter(([key]) => key.startsWith('sf_'));
            
            expect(sfProviders.length).toBeGreaterThan(0);
            
            for (const [, config] of sfProviders) {
                // SiliconFlow 模型通常包含 / 分隔的组织/模型名
                expect(config.model).toMatch(/\//);
            }
        });
    });

    describe('getAiConfig', () => {
        beforeEach(() => {
            // 清除所有环境变量
            vi.stubEnv('VITE_DEEPSEEK_KEY', '');
            vi.stubEnv('VITE_GEMINI_KEY', '');
            vi.stubEnv('VITE_KIMI_KEY', '');
            vi.stubEnv('VITE_SILICONFLOW_KEY', '');
        });

        afterEach(() => {
            vi.unstubAllEnvs();
        });

        it('无环境变量时应该返回 undefined apiKey', () => {
            const config = getAiConfig();
            
            // 所有 apiKey 应该是 undefined 或空字符串
            expect(config.deepseek.apiKey).toBeFalsy();
            expect(config.gemini.apiKey).toBeFalsy();
            expect(config.kimi.apiKey).toBeFalsy();
        });

        it('有 VITE_DEEPSEEK_KEY 时 deepseek 应该有 apiKey', () => {
            vi.stubEnv('VITE_DEEPSEEK_KEY', 'test-deepseek-key');
            
            const config = getAiConfig();
            
            expect(config.deepseek.apiKey).toBe('test-deepseek-key');
        });

        it('有 VITE_GEMINI_KEY 时 gemini 应该有 apiKey', () => {
            vi.stubEnv('VITE_GEMINI_KEY', 'test-gemini-key');
            
            const config = getAiConfig();
            
            expect(config.gemini.apiKey).toBe('test-gemini-key');
        });

        it('有 VITE_KIMI_KEY 时 kimi 应该有 apiKey', () => {
            vi.stubEnv('VITE_KIMI_KEY', 'test-kimi-key');
            
            const config = getAiConfig();
            
            expect(config.kimi.apiKey).toBe('test-kimi-key');
        });

        it('有 VITE_SILICONFLOW_KEY 时所有 sf_* provider 应该有 apiKey', () => {
            vi.stubEnv('VITE_SILICONFLOW_KEY', 'test-sf-key');
            
            const config = getAiConfig();
            
            const sfProviders = Object.entries(config).filter(([key]) => key.startsWith('sf_'));
            
            for (const [, providerConfig] of sfProviders) {
                expect(providerConfig.apiKey).toBe('test-sf-key');
            }
        });

        it('应该保留原始配置的 model, name, note', () => {
            const config = getAiConfig();
            
            for (const [key, originalConfig] of Object.entries(AI_CONFIG)) {
                const provider = key as keyof typeof AI_CONFIG;
                expect(config[provider].model).toBe(originalConfig.model);
                expect(config[provider].name).toBe(originalConfig.name);
                if (originalConfig.note) {
                    expect(config[provider].note).toBe(originalConfig.note);
                }
            }
        });

        it('不同 provider 应该使用对应的 key', () => {
            vi.stubEnv('VITE_DEEPSEEK_KEY', 'deepseek-key');
            vi.stubEnv('VITE_SILICONFLOW_KEY', 'sf-key');
            
            const config = getAiConfig();
            
            // deepseek 使用自己的 key
            expect(config.deepseek.apiKey).toBe('deepseek-key');
            
            // sf_* 使用 siliconflow key
            expect(config.sf_deepseek_v3_2.apiKey).toBe('sf-key');
            expect(config.sf_kimi_k2.apiKey).toBe('sf-key');
        });
    });
});
