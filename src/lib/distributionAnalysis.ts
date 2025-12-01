import { Seat, RoleDef } from '../types';
import { ROLES, SCRIPTS } from '../constants';

export interface DistributionAnalysisResult {
    isValid: boolean;
    playerCount: number;
    roleCount: number;
    warnings: string[];
    strategyEvaluation: {
        name: string;
        description: string;
        icon: string;
        confidence: number; // 0-1
    };
    composition: {
        townsfolk: number;
        outsider: number;
        minion: number;
        demon: number;
    };
    standardComposition: {
        townsfolk: number;
        outsider: number;
        minion: number;
        demon: number;
    } | null;
}

// 角色强度分类（基于暗流涌动剧本）
const ROLE_STRENGTH = {
    strong: ['fortune_teller', 'empath', 'virgin', 'monk', 'soldier'],
    mediumStrong: ['undertaker', 'ravenkeeper', 'investigator', 'chef', 'librarian'],
    medium: ['butler', 'recluse', 'washerwoman', 'saint'],
    misinformation: ['drunk', 'poisoner', 'spy', 'recluse', 'fortune_teller'] // 会产生假信息的角色
};

const STRATEGIES = [
    {
        id: 'balanced',
        name: '平衡打法',
        description: '善恶双方势均力敌，标准开局',
        icon: '⚖️',
        criteria: (roles: string[]) => {
            const strong = roles.filter(r => ROLE_STRENGTH.strong.includes(r)).length;
            const mediumStrong = roles.filter(r => ROLE_STRENGTH.mediumStrong.includes(r)).length;
            return (strong >= 1 && strong <= 2) && (mediumStrong >= 2 && mediumStrong <= 3);
        }
    },
    {
        id: 'evil_favored',
        name: '邪恶优势',
        description: '好人信息较少，邪恶方有强力爪牙',
        icon: '😈',
        criteria: (roles: string[]) => {
            const strong = roles.filter(r => ROLE_STRENGTH.strong.includes(r)).length;
            const misinformation = roles.filter(r => ROLE_STRENGTH.misinformation.includes(r)).length;
            return strong <= 1 && misinformation >= 2;
        }
    },
    {
        id: 'good_favored',
        name: '好人优势',
        description: '好人拥有强力信息位，适合新手',
        icon: '🛡️',
        criteria: (roles: string[]) => {
            const strong = roles.filter(r => ROLE_STRENGTH.strong.includes(r)).length;
            return strong >= 3;
        }
    },
    {
        id: 'chaotic',
        name: '混乱模式',
        description: '充满干扰信息和特殊规则',
        icon: '🌀',
        criteria: (roles: string[]) => {
            const misinformation = roles.filter(r => ROLE_STRENGTH.misinformation.includes(r)).length;
            return misinformation >= 3;
        }
    }
];

export const getStandardComposition = (players: number) => {
    const rules: Record<number, { townsfolk: number; outsider: number; minion: number; demon: number }> = {
        5: { townsfolk: 3, outsider: 0, minion: 1, demon: 1 },
        6: { townsfolk: 3, outsider: 1, minion: 1, demon: 1 },
        7: { townsfolk: 5, outsider: 0, minion: 1, demon: 1 },
        8: { townsfolk: 5, outsider: 1, minion: 1, demon: 1 },
        9: { townsfolk: 5, outsider: 2, minion: 1, demon: 1 },
        10: { townsfolk: 7, outsider: 0, minion: 2, demon: 1 },
        11: { townsfolk: 7, outsider: 1, minion: 2, demon: 1 },
        12: { townsfolk: 7, outsider: 2, minion: 2, demon: 1 },
        13: { townsfolk: 9, outsider: 0, minion: 3, demon: 1 },
        14: { townsfolk: 9, outsider: 1, minion: 3, demon: 1 },
        15: { townsfolk: 9, outsider: 2, minion: 3, demon: 1 }
    };
    return rules[players] || null;
};

export const analyzeDistribution = (seats: Seat[], playerCount: number): DistributionAnalysisResult => {
    const warnings: string[] = [];
    
    // 1. 角色数量检查
    // 统计已分配的角色（使用 realRoleId）
    const assignedRoles = seats
        .map(s => s.realRoleId)
        .filter((id): id is string => !!id);
        
    const roleCount = assignedRoles.length;

    if (roleCount !== playerCount) {
        warnings.push(`角色数量 (${roleCount}) 与玩家人数 (${playerCount}) 不匹配`);
    }

    // 2. 团队配比检查
    const composition = {
        townsfolk: 0,
        outsider: 0,
        minion: 0,
        demon: 0
    };

    assignedRoles.forEach(id => {
        const role = ROLES[id];
        if (role) {
            if (role.team === 'TOWNSFOLK') composition.townsfolk++;
            else if (role.team === 'OUTSIDER') composition.outsider++;
            else if (role.team === 'MINION') composition.minion++;
            else if (role.team === 'DEMON') composition.demon++;
        }
    });

    const standard = getStandardComposition(playerCount);
    if (standard) {
        if (composition.demon !== standard.demon) warnings.push(`恶魔数量异常: 当前 ${composition.demon} (建议 ${standard.demon})`);
        if (composition.minion !== standard.minion) warnings.push(`爪牙数量异常: 当前 ${composition.minion} (建议 ${standard.minion})`);
        if (composition.outsider !== standard.outsider) warnings.push(`外来者数量异常: 当前 ${composition.outsider} (建议 ${standard.outsider})`);
        // 镇民数量通常是填充位，如果其他都对，镇民不对可能是因为总数不对，已在上面提示
    } else if (playerCount >= 5 && playerCount <= 15) {
        // Should have standard composition but failed to get it? Unlikely with hardcoded map
    } else {
        warnings.push(`当前人数 (${playerCount}) 超出标准规则建议范围 (5-15人)`);
    }

    // 3. 策略评估
    let bestStrategy = STRATEGIES[0]; // Default to balanced
    const maxScore = -1;

    // 简单评分逻辑：满足条件得1分，否则0分。
    // 改进：可以计算匹配度。这里简化处理，按优先级匹配。
    // 优先级：混乱 > 邪恶 > 好人 > 平衡 (默认)
    
    if (STRATEGIES[3].criteria(assignedRoles)) bestStrategy = STRATEGIES[3]; // Chaotic
    else if (STRATEGIES[1].criteria(assignedRoles)) bestStrategy = STRATEGIES[1]; // Evil
    else if (STRATEGIES[2].criteria(assignedRoles)) bestStrategy = STRATEGIES[2]; // Good
    else bestStrategy = STRATEGIES[0]; // Balanced

    return {
        isValid: warnings.length === 0,
        playerCount,
        roleCount,
        warnings,
        strategyEvaluation: {
            name: bestStrategy.name,
            description: bestStrategy.description,
            icon: bestStrategy.icon,
            confidence: 0.8 // 模拟置信度
        },
        composition,
        standardComposition: standard
    };
};
