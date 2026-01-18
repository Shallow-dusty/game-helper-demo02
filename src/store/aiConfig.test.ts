import { describe, it, expect } from 'vitest';
import { AI_CONFIG } from './aiConfig';

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

    describe('AI_CONFIG 对象结构', () => {
        it('应该有 deepseek, gemini, kimi 等提供商', () => {
            // Check basic providers exist
            expect(AI_CONFIG.deepseek).toBeDefined();
            expect(AI_CONFIG.gemini).toBeDefined();
            expect(AI_CONFIG.kimi).toBeDefined();
        });

        it('应该有 SiliconFlow 提供商 (sf_* 开头)', () => {
            const sfProviders = Object.entries(AI_CONFIG)
                .filter(([key]) => key.startsWith('sf_'))
                .map(([key]) => key);

            expect(sfProviders).toContain('sf_deepseek_v3_2');
            expect(sfProviders).toContain('sf_minimax_m2');
            expect(sfProviders).toContain('sf_qwen_3_vl');
            expect(sfProviders).toContain('sf_glm_4_6');
            expect(sfProviders).toContain('sf_kimi_k2');
            expect(sfProviders).toContain('sf_kimi_k2_instruct');
        });

        it('每个提供商配置都有 model 属性 (字符串)', () => {
            for (const [, config] of Object.entries(AI_CONFIG)) {
                expect(config.model).toBeDefined();
                expect(typeof config.model).toBe('string');
            }
        });

        it('每个提供商配置都有 name 属性 (字符串)', () => {
            for (const [, config] of Object.entries(AI_CONFIG)) {
                expect(config.name).toBeDefined();
                expect(typeof config.name).toBe('string');
            }
        });

        it('SiliconFlow 提供商的模型路径包含斜杠分隔符', () => {
            expect(AI_CONFIG.sf_deepseek_v3_2.model).toMatch(/\//);
        });

        it('deepseek 配置正确', () => {
            expect(AI_CONFIG.deepseek.model).toBe('deepseek-chat');
            expect(AI_CONFIG.deepseek.name).toContain('DeepSeek');
        });

        it('gemini 配置正确', () => {
            expect(AI_CONFIG.gemini.model).toContain('gemini');
            expect(AI_CONFIG.gemini.name).toContain('Gemini');
        });
    });
});
