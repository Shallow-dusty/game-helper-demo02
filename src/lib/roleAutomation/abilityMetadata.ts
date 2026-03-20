/**
 * Ability Metadata Registry
 *
 * Decoupled metadata for each role's night ability: target type, filters, hints.
 * Adapted from Grimoire-Aether's AbilityTargetSelector pattern.
 *
 * Used by NightActionPanel / PlayerNightAction to determine UI behavior
 * without hardcoding role-specific logic in components.
 */
import type { Seat } from '../../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TargetType = 'none' | 'single' | 'double' | 'choice';

export interface AbilityMeta {
    /** How many targets the ability needs */
    targetType: TargetType;
    /** Override target count (e.g. 2 for fortune_teller) */
    targetCount?: number;
    /** Filter for valid targets (return true = selectable) */
    targetFilter?: (seat: Seat) => boolean;
    /** Instruction shown to the ST */
    hint: string;
}

// ---------------------------------------------------------------------------
// Filters (reusable predicates)
// ---------------------------------------------------------------------------

const alive = (s: Seat) => !s.isDead;
const aliveNotSelf = (selfSeatId: number) => (s: Seat) => !s.isDead && s.id !== selfSeatId;

// ---------------------------------------------------------------------------
// Trouble Brewing ability metadata
// ---------------------------------------------------------------------------

export const TROUBLE_BREWING_ABILITIES: Record<string, AbilityMeta> = {
    // === Demons ===
    imp: {
        targetType: 'single',
        hint: '选择一名玩家进行击杀',
        targetFilter: alive,
    },

    // === Townsfolk ===
    empath: {
        targetType: 'none',
        hint: '自动查看邻居中的邪恶玩家数量',
    },
    fortune_teller: {
        targetType: 'double',
        targetCount: 2,
        hint: '选择两名玩家，查看其中是否有恶魔',
    },
    investigator: {
        targetType: 'none',
        hint: '首夜自动获取信息（说书人提供）',
    },
    librarian: {
        targetType: 'none',
        hint: '首夜自动获取信息（说书人提供）',
    },
    washerwoman: {
        targetType: 'none',
        hint: '首夜自动获取信息（说书人提供）',
    },
    monk: {
        targetType: 'single',
        hint: '选择一名玩家进行保护（不能选择自己）',
        targetFilter: alive, // ideally aliveNotSelf, but self-id not available at definition time
    },
    ravenkeeper: {
        targetType: 'single',
        hint: '选择一名玩家，查看其角色',
        targetFilter: alive,
    },
    undertaker: {
        targetType: 'none',
        hint: '自动获知当天处决玩家的角色',
    },
    chef: {
        targetType: 'none',
        hint: '自动获知邪恶玩家邻座数量',
    },
    virgin: {
        targetType: 'none',
        hint: '被动触发能力',
    },
    slayer: {
        targetType: 'single',
        hint: '白天使用：选择一名玩家尝试屠魔',
        targetFilter: alive,
    },
    soldier: {
        targetType: 'none',
        hint: '被动能力：免疫恶魔击杀',
    },
    mayor: {
        targetType: 'none',
        hint: '被动能力：特殊胜利条件',
    },

    // === Outsiders ===
    butler: {
        targetType: 'single',
        hint: '选择一名存活玩家作为主人',
        targetFilter: alive,
    },
    drunk: {
        targetType: 'none',
        hint: '醉鬼没有能力（认为自己是其他角色）',
    },
    recluse: {
        targetType: 'none',
        hint: '被动能力：可能被视为邪恶/爪牙/恶魔',
    },
    saint: {
        targetType: 'none',
        hint: '被动能力：被处决则邪恶获胜',
    },

    // === Minions ===
    poisoner: {
        targetType: 'single',
        hint: '选择一名玩家进行中毒',
        targetFilter: alive,
    },
    spy: {
        targetType: 'none',
        hint: '查看魔典中的所有信息',
    },
    scarlet_woman: {
        targetType: 'none',
        hint: '被动能力：恶魔死亡时可能变成恶魔',
    },
    baron: {
        targetType: 'none',
        hint: '设置阶段生效：增加外来者数量',
    },
};

// ---------------------------------------------------------------------------
// Lookup
// ---------------------------------------------------------------------------

/**
 * Get ability metadata for a role. Returns undefined if role has no metadata.
 */
export function getAbilityMeta(roleId: string): AbilityMeta | undefined {
    return TROUBLE_BREWING_ABILITIES[roleId];
}

/**
 * Check if a role requires target selection for its night ability.
 */
export function needsTargetSelection(roleId: string): boolean {
    const meta = getAbilityMeta(roleId);
    return !!meta && meta.targetType !== 'none';
}

/** Re-export the self-excluding filter factory for runtime use */
export { aliveNotSelf };
