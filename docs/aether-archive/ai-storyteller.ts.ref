/**
 * AI 说书人辅助模块
 *
 * 为血染钟楼说书人提供智能辅助功能：
 * - 角色分配建议
 * - 能力结果生成
 * - 游戏节奏提示
 * - 新手引导
 */

import { chat, createSession, type AIProvider } from './ai-client';
import type { Player, Character, CharacterId } from '../types/game';
import { Team } from '../types/game';
import { getCharacterById, TROUBLE_BREWING_CHARACTERS } from '../data/characters/trouble-brewing';

// ============================================================
// 类型定义
// ============================================================

export interface RoleAssignmentSuggestion {
    /** 建议的角色分配方案 */
    assignments: Array<{
        playerId: string;
        playerName: string;
        characterId: CharacterId;
        characterName: string;
        reason: string;
    }>;
    /** 方案的整体描述 */
    description: string;
    /** 游戏平衡性评估 */
    balance: {
        score: number; // 1-10
        analysis: string;
    };
}

export interface AbilityResultSuggestion {
    /** 角色ID */
    characterId: CharacterId;
    /** 建议的结果 */
    result: Record<string, unknown>;
    /** 解释说明 */
    explanation: string;
    /** 是否包含错误信息（中毒/醉酒） */
    isPoisonedInfo: boolean;
}

export interface GamePacingTip {
    /** 提示类型 */
    type: 'warning' | 'suggestion' | 'info';
    /** 提示内容 */
    message: string;
    /** 相关玩家（如果有） */
    relatedPlayers?: string[];
}

export interface StorytellerAssistantConfig {
    /** AI 提供商 */
    provider?: AIProvider;
    /** 模型 */
    model?: string;
    /** 是否启用 */
    enabled: boolean;
}

// ============================================================
// 系统提示词
// ============================================================

const STORYTELLER_SYSTEM_PROMPT = `你是一个专业的《血染钟楼》(Blood on the Clocktower) 游戏说书人助手。

你的职责是帮助说书人：
1. 设计平衡有趣的角色分配方案
2. 根据游戏情况生成合理的能力结果
3. 提供游戏节奏建议
4. 确保游戏的公平性和趣味性

关于 Trouble Brewing 剧本：
- 适合 5-15 人游戏
- 镇民(Townsfolk)是善良阵营核心
- 外来者(Outsider)是善良但可能有负面效果
- 爪牙(Minion)辅助恶魔
- 恶魔(Demon)是邪恶阵营核心

标准人数配置：
- 5人: 3镇民, 0外来者, 1爪牙, 1恶魔
- 6人: 3镇民, 1外来者, 1爪牙, 1恶魔
- 7人: 5镇民, 0外来者, 1爪牙, 1恶魔
- 8人: 5镇民, 1外来者, 1爪牙, 1恶魔
- 9人: 5镇民, 2外来者, 1爪牙, 1恶魔
- 10人: 7镇民, 0外来者, 2爪牙, 1恶魔
- 11人: 7镇民, 1外来者, 2爪牙, 1恶魔
- 12人: 7镇民, 2外来者, 2爪牙, 1恶魔
- 13人: 9镇民, 0外来者, 3爪牙, 1恶魔
- 14人: 9镇民, 1外来者, 3爪牙, 1恶魔
- 15人: 9镇民, 2外来者, 3爪牙, 1恶魔

回复时请使用 JSON 格式，便于程序解析。`;

// ============================================================
// AI 说书人助手类
// ============================================================

export class AIStorytellerAssistant {
    private config: StorytellerAssistantConfig;
    private session: ReturnType<typeof createSession> | null = null;

    constructor(config: StorytellerAssistantConfig = { enabled: true }) {
        this.config = config;
        if (config.enabled) {
            this.session = createSession({
                provider: config.provider || 'deepseek',
                model: config.model,
                systemPrompt: STORYTELLER_SYSTEM_PROMPT
            });
        }
    }

    /**
     * 检查 AI 是否启用
     */
    isEnabled(): boolean {
        return this.config.enabled && this.session !== null;
    }

    /**
     * 生成角色分配建议
     */
    async suggestRoleAssignment(
        players: Array<{ id: string; name: string }>,
        options?: {
            preferredCharacters?: CharacterId[];
            excludedCharacters?: CharacterId[];
            experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
        }
    ): Promise<RoleAssignmentSuggestion> {
        if (!this.isEnabled()) {
            return this.generateLocalRoleAssignment(players, options);
        }

        const playerCount = players.length;
        const prompt = `请为 ${playerCount} 人游戏设计角色分配方案。

玩家列表：
${players.map((p, i) => `${i + 1}. ${p.name} (ID: ${p.id})`).join('\n')}

${options?.preferredCharacters ? `偏好角色：${options.preferredCharacters.join(', ')}` : ''}
${options?.excludedCharacters ? `排除角色：${options.excludedCharacters.join(', ')}` : ''}
${options?.experienceLevel ? `玩家经验水平：${options.experienceLevel}` : ''}

请返回 JSON 格式的建议方案，包含：
1. assignments: 每个玩家的角色分配（包含 playerId, playerName, characterId, characterName, reason）
2. description: 整体方案描述
3. balance: 平衡性评估（score 1-10, analysis 分析说明）`;

        try {
            const response = await this.session!.send(prompt);
            return this.parseRoleAssignmentResponse(response, players);
        } catch (error) {
            console.error('AI 角色分配建议失败，使用本地生成:', error);
            return this.generateLocalRoleAssignment(players, options);
        }
    }

    /**
     * 生成能力结果建议
     */
    async suggestAbilityResult(
        characterId: CharacterId,
        actor: Player,
        targets: Player[] | undefined,
        gameState: {
            players: Player[];
            currentNight: number;
            isFirstNight: boolean;
            isPoisoned?: boolean;
        }
    ): Promise<AbilityResultSuggestion> {
        if (!this.isEnabled()) {
            return this.generateLocalAbilityResult(characterId, actor, targets, gameState);
        }

        const character = getCharacterById(characterId);
        if (!character) {
            throw new Error(`未知角色: ${characterId}`);
        }

        const prompt = `请为以下角色能力生成结果建议：

角色：${character.name} (${character.nameEn})
能力说明：${character.abilityText}

执行者：${actor.name}
${targets ? `目标：${targets.map(t => t.name).join(', ')}` : '无目标'}

当前游戏状态：
- 夜晚：第 ${gameState.currentNight} 夜${gameState.isFirstNight ? '（首夜）' : ''}
- 存活玩家：${gameState.players.filter(p => !p.isDead).length} 人
- 执行者是否中毒：${gameState.isPoisoned ? '是' : '否'}

${gameState.isPoisoned ? '注意：由于执行者中毒，需要生成错误信息。' : ''}

请返回 JSON 格式，包含：
1. characterId: 角色ID
2. result: 建议的能力结果数据
3. explanation: 为什么这样建议
4. isPoisonedInfo: 是否是中毒产生的错误信息`;

        try {
            const response = await this.session!.send(prompt);
            return this.parseAbilityResultResponse(response, characterId, gameState.isPoisoned);
        } catch (error) {
            console.error('AI 能力结果建议失败，使用本地生成:', error);
            return this.generateLocalAbilityResult(characterId, actor, targets, gameState);
        }
    }

    /**
     * 获取游戏节奏提示
     */
    async getGamePacingTips(gameState: {
        players: Player[];
        currentDay: number;
        currentNight: number;
        executedToday: boolean;
        nominationHistory: Array<{ nomineeId: string; passed: boolean }>;
    }): Promise<GamePacingTip[]> {
        if (!this.isEnabled()) {
            return this.generateLocalPacingTips(gameState);
        }

        const aliveCount = gameState.players.filter(p => !p.isDead).length;
        const evilCount = gameState.players.filter(p => {
            if (!p.characterId || p.isDead) return false;
            const char = getCharacterById(p.characterId);
            return char && (char.team === Team.MINION || char.team === Team.DEMON);
        }).length;

        const prompt = `请分析当前游戏状态并提供节奏建议：

游戏进度：
- 当前：第 ${gameState.currentDay} 天
- 存活玩家：${aliveCount} 人
- 今日是否已处决：${gameState.executedToday ? '是' : '否'}
- 今日提名次数：${gameState.nominationHistory.length}

请返回 JSON 数组格式的建议，每个建议包含：
1. type: 'warning' | 'suggestion' | 'info'
2. message: 提示内容
3. relatedPlayers: 相关玩家ID数组（可选）`;

        try {
            const response = await this.session!.send(prompt);
            return this.parsePacingTipsResponse(response);
        } catch (error) {
            console.error('AI 节奏建议失败，使用本地生成:', error);
            return this.generateLocalPacingTips(gameState);
        }
    }

    // ============================================================
    // 本地生成方法（AI 不可用时的降级方案）
    // ============================================================

    private generateLocalRoleAssignment(
        players: Array<{ id: string; name: string }>,
        options?: {
            preferredCharacters?: CharacterId[];
            excludedCharacters?: CharacterId[];
        }
    ): RoleAssignmentSuggestion {
        const playerCount = players.length;

        // 根据人数计算角色配置
        const composition = this.getStandardComposition(playerCount);

        // 获取可用角色
        const available = {
            townsfolk: TROUBLE_BREWING_CHARACTERS.filter(c =>
                c.team === Team.TOWNSFOLK &&
                !options?.excludedCharacters?.includes(c.id as CharacterId)
            ),
            outsiders: TROUBLE_BREWING_CHARACTERS.filter(c =>
                c.team === Team.OUTSIDER &&
                !options?.excludedCharacters?.includes(c.id as CharacterId)
            ),
            minions: TROUBLE_BREWING_CHARACTERS.filter(c =>
                c.team === Team.MINION &&
                !options?.excludedCharacters?.includes(c.id as CharacterId)
            ),
            demons: TROUBLE_BREWING_CHARACTERS.filter(c =>
                c.team === Team.DEMON &&
                !options?.excludedCharacters?.includes(c.id as CharacterId)
            )
        };

        // 随机选择角色
        const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

        const selectedRoles: Character[] = [
            ...shuffle(available.townsfolk).slice(0, composition.townsfolk),
            ...shuffle(available.outsiders).slice(0, composition.outsiders),
            ...shuffle(available.minions).slice(0, composition.minions),
            ...shuffle(available.demons).slice(0, composition.demons)
        ];

        // 如果角色数量不足，补充更多镇民
        while (selectedRoles.length < playerCount && available.townsfolk.length > 0) {
            const unusedTownsfolk = available.townsfolk.filter(
                c => !selectedRoles.some(r => r.id === c.id)
            );
            if (unusedTownsfolk.length === 0) break;
            selectedRoles.push(unusedTownsfolk[0]);
        }

        // 打乱顺序后分配给玩家
        const shuffledRoles = shuffle(selectedRoles);
        const shuffledPlayers = shuffle([...players]);

        const assignments = shuffledPlayers.map((player, index) => {
            const role = shuffledRoles[index];
            if (!role) {
                // 安全处理：如果没有足够角色，使用默认值
                return {
                    playerId: player.id,
                    playerName: player.name,
                    characterId: 'washerwoman' as CharacterId,
                    characterName: '洗衣妇',
                    reason: '备用分配（角色不足）'
                };
            }
            return {
                playerId: player.id,
                playerName: player.name,
                characterId: role.id as CharacterId,
                characterName: role.name,
                reason: `随机分配 - ${role.team === Team.TOWNSFOLK ? '镇民' :
                    role.team === Team.OUTSIDER ? '外来者' :
                    role.team === Team.MINION ? '爪牙' : '恶魔'}`
            };
        });

        return {
            assignments,
            description: `${playerCount} 人标准配置：${composition.townsfolk}镇民 + ${composition.outsiders}外来者 + ${composition.minions}爪牙 + ${composition.demons}恶魔`,
            balance: {
                score: 7,
                analysis: '使用标准配置的随机分配，游戏平衡性良好'
            }
        };
    }

    private getStandardComposition(playerCount: number): {
        townsfolk: number;
        outsiders: number;
        minions: number;
        demons: number;
    } {
        // 标准人数配置表
        const compositions: Record<number, { townsfolk: number; outsiders: number; minions: number; demons: number }> = {
            5: { townsfolk: 3, outsiders: 0, minions: 1, demons: 1 },
            6: { townsfolk: 3, outsiders: 1, minions: 1, demons: 1 },
            7: { townsfolk: 5, outsiders: 0, minions: 1, demons: 1 },
            8: { townsfolk: 5, outsiders: 1, minions: 1, demons: 1 },
            9: { townsfolk: 5, outsiders: 2, minions: 1, demons: 1 },
            10: { townsfolk: 7, outsiders: 0, minions: 2, demons: 1 },
            11: { townsfolk: 7, outsiders: 1, minions: 2, demons: 1 },
            12: { townsfolk: 7, outsiders: 2, minions: 2, demons: 1 },
            13: { townsfolk: 9, outsiders: 0, minions: 3, demons: 1 },
            14: { townsfolk: 9, outsiders: 1, minions: 3, demons: 1 },
            15: { townsfolk: 9, outsiders: 2, minions: 3, demons: 1 }
        };

        return compositions[Math.min(Math.max(playerCount, 5), 15)] || compositions[7];
    }

    private generateLocalAbilityResult(
        characterId: CharacterId,
        actor: Player,
        targets: Player[] | undefined,
        gameState: {
            players: Player[];
            isPoisoned?: boolean;
        }
    ): AbilityResultSuggestion {
        const character = getCharacterById(characterId);

        // 默认结果
        let result: Record<string, unknown> = {};
        let explanation = '本地生成的默认结果';

        switch (characterId) {
            case 'empath': {
                // 共情者：计算邻居中的邪恶数量
                const seatIndex = actor.seatIndex;
                const playerCount = gameState.players.length;
                const leftIndex = (seatIndex - 1 + playerCount) % playerCount;
                const rightIndex = (seatIndex + 1) % playerCount;

                let evilCount = 0;
                gameState.players.forEach(p => {
                    if ((p.seatIndex === leftIndex || p.seatIndex === rightIndex) && !p.isDead) {
                        const char = p.characterId ? getCharacterById(p.characterId) : null;
                        if (char && (char.team === Team.MINION || char.team === Team.DEMON)) {
                            evilCount++;
                        }
                    }
                });

                if (gameState.isPoisoned) {
                    evilCount = Math.floor(Math.random() * 3); // 0-2 随机
                }

                result = { evilNeighborCount: evilCount };
                explanation = gameState.isPoisoned
                    ? '中毒状态下生成的随机错误信息'
                    : `检测到 ${evilCount} 个邪恶邻居`;
                break;
            }
            case 'fortune_teller': {
                // 占卜师：检查两个目标中是否有恶魔
                let hasDemon = false;
                targets?.forEach(t => {
                    const char = t.characterId ? getCharacterById(t.characterId) : null;
                    if (char?.team === Team.DEMON) hasDemon = true;
                });

                if (gameState.isPoisoned) {
                    hasDemon = Math.random() < 0.5;
                }

                result = { hasDemon };
                explanation = gameState.isPoisoned
                    ? '中毒状态下生成的随机结果'
                    : hasDemon ? '检测到恶魔' : '未检测到恶魔';
                break;
            }
            case 'chef': {
                // 厨师：计算相邻邪恶对数
                let evilPairs = 0;
                const players = gameState.players.filter(p => !p.isDead);

                for (let i = 0; i < players.length; i++) {
                    const current = players[i];
                    const next = players[(i + 1) % players.length];

                    const currentChar = current.characterId ? getCharacterById(current.characterId) : null;
                    const nextChar = next.characterId ? getCharacterById(next.characterId) : null;

                    const currentEvil = currentChar && (currentChar.team === Team.MINION || currentChar.team === Team.DEMON);
                    const nextEvil = nextChar && (nextChar.team === Team.MINION || nextChar.team === Team.DEMON);

                    if (currentEvil && nextEvil) evilPairs++;
                }

                if (gameState.isPoisoned) {
                    evilPairs = Math.floor(Math.random() * 3);
                }

                result = { evilPairs };
                explanation = `检测到 ${evilPairs} 对相邻邪恶玩家`;
                break;
            }
            default:
                result = { message: `${character?.name || characterId} 能力执行完成` };
                explanation = '使用默认能力处理';
        }

        return {
            characterId,
            result,
            explanation,
            isPoisonedInfo: gameState.isPoisoned || false
        };
    }

    private generateLocalPacingTips(gameState: {
        players: Player[];
        currentDay: number;
        executedToday: boolean;
        nominationHistory: Array<{ nomineeId: string; passed: boolean }>;
    }): GamePacingTip[] {
        const tips: GamePacingTip[] = [];
        const aliveCount = gameState.players.filter(p => !p.isDead).length;

        // 检查是否接近游戏结束
        if (aliveCount <= 3) {
            tips.push({
                type: 'warning',
                message: '游戏即将结束！只剩 3 人或更少，请注意最终投票'
            });
        }

        // 检查是否今天还没有处决
        if (!gameState.executedToday && gameState.currentDay > 0) {
            tips.push({
                type: 'suggestion',
                message: '今天还没有处决任何人，考虑推进投票'
            });
        }

        // 检查提名情况
        if (gameState.nominationHistory.length === 0 && gameState.currentDay > 0) {
            tips.push({
                type: 'info',
                message: '今天还没有提名，鼓励玩家开始讨论和提名'
            });
        }

        // 首日提示
        if (gameState.currentDay === 1) {
            tips.push({
                type: 'info',
                message: '第一天通常信息较少，建议谨慎处决'
            });
        }

        return tips;
    }

    // ============================================================
    // 响应解析方法
    // ============================================================

    private parseRoleAssignmentResponse(
        response: string,
        players: Array<{ id: string; name: string }>
    ): RoleAssignmentSuggestion {
        try {
            // 尝试从响应中提取 JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('解析 AI 响应失败:', error);
        }

        // 解析失败时使用本地生成
        return this.generateLocalRoleAssignment(players);
    }

    private parseAbilityResultResponse(
        response: string,
        characterId: CharacterId,
        isPoisoned?: boolean
    ): AbilityResultSuggestion {
        try {
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('解析 AI 响应失败:', error);
        }

        return {
            characterId,
            result: {},
            explanation: '解析 AI 响应失败',
            isPoisonedInfo: isPoisoned || false
        };
    }

    private parsePacingTipsResponse(response: string): GamePacingTip[] {
        try {
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.error('解析 AI 响应失败:', error);
        }

        return [];
    }
}

// ============================================================
// 导出默认实例
// ============================================================

let defaultAssistant: AIStorytellerAssistant | null = null;

export function getStorytellerAssistant(config?: StorytellerAssistantConfig): AIStorytellerAssistant {
    if (!defaultAssistant) {
        defaultAssistant = new AIStorytellerAssistant(config);
    }
    return defaultAssistant;
}

export function resetStorytellerAssistant(): void {
    defaultAssistant = null;
}
