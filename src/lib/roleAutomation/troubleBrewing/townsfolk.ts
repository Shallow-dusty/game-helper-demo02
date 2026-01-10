/**
 * Trouble Brewing - Townsfolk Role Implementations
 *
 * 暗流涌动剧本 - 镇民角色自动化实现
 */

import type { GameState, Seat } from '../../../types';
import type {
  AbilityContext,
  AbilityResult,
  AutomationSuggestion
} from '../types';
import {
  isTainted,
  getRealRoleId,
  isEvil,
  getAliveNeighbors,
  getAlivePlayers,
  getTeamFromRoleId,
  generateId,
  formatSeatName,
  formatRoleName,
  findDemon,
  countEvilPairs
} from '../utils';

// ==================== 洗衣妇 (Washerwoman) ====================

/**
 * 洗衣妇能力处理
 * 首夜获得信息：你能得知一名镇民和一位玩家
 */
export function processWasherwoman(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);

  // 找到所有镇民
  const townsfolk = gameState.seats.filter(s => {
    const role = getRealRoleId(s);
    return role && getTeamFromRoleId(role) === 'TOWNSFOLK' && !s.isDead && s.id !== seatId;
  });

  if (townsfolk.length === 0) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'washerwoman',
        seatId,
        type: 'info',
        title: '洗衣妇信息',
        description: '场上没有其他镇民',
        suggestedResult: '无法获取信息',
        priority: 80,
        requiresConfirmation: false
      }]
    };
  }

  // 选择一个真实镇民 - 已检查长度大于0
  const realTarget = townsfolk[Math.floor(Math.random() * townsfolk.length)];
  if (!realTarget) {
    return { success: false, suggestions: [], error: '无法选择镇民' };
  }
  const realRoleId = getRealRoleId(realTarget) ?? 'unknown';

  // 选择另一个玩家（可以是任何人，包括邪恶方）
  const others = gameState.seats.filter(s =>
    !s.isDead && s.id !== seatId && s.id !== realTarget.id && s.userId
  );
  const decoyCandidate = others[Math.floor(Math.random() * others.length)];
  const decoy = decoyCandidate ?? realTarget;

  // 打乱顺序
  const [player1, player2] = Math.random() > 0.5
    ? [realTarget, decoy]
    : [decoy, realTarget];

  const realInfo = `${formatSeatName(player1)} 或 ${formatSeatName(player2)} 是 ${formatRoleName(realRoleId)}`;

  let suggestedInfo = realInfo;
  if (tainted) {
    // 中毒时给假信息：随机选一个角色
    const fakeRoles = ['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller', 'undertaker', 'monk', 'slayer', 'soldier', 'mayor'];
    const fakeRole = fakeRoles[Math.floor(Math.random() * fakeRoles.length)] ?? 'washerwoman';
    const fakePlayers = gameState.seats.filter(s => !s.isDead && s.id !== seatId && s.userId);
    if (fakePlayers.length >= 2) {
      const fp1 = fakePlayers[Math.floor(Math.random() * fakePlayers.length)];
      const remainingPlayers = fakePlayers.filter(p => p.id !== fp1?.id);
      const fp2 = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      if (fp1 && fp2) {
        suggestedInfo = `${formatSeatName(fp1)} 或 ${formatSeatName(fp2)} 是 ${formatRoleName(fakeRole)}`;
      }
    }
  }

  const suggestion: AutomationSuggestion = {
    id: generateId(),
    roleId: 'washerwoman',
    seatId,
    type: 'info',
    title: '洗衣妇信息',
    description: tainted ? '玩家中毒/醉酒，给予假信息' : '正常信息',
    suggestedResult: suggestedInfo,
    realResult: realInfo,
    isTainted: tainted,
    priority: 70,
    requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
    targetSeatIds: [player1.id, player2.id],
    options: context.automationLevel === 'GUIDED' ? [
      {
        id: 'recommended',
        label: '使用建议信息',
        description: suggestedInfo,
        isRecommended: true,
        result: suggestedInfo
      },
      {
        id: 'custom',
        label: '自定义信息',
        description: 'ST手动输入信息',
        result: '',
        requiresInput: { type: 'text', prompt: '请输入要告知玩家的信息' }
      }
    ] : undefined
  };

  return { success: true, suggestions: [suggestion] };
}

// ==================== 图书管理员 (Librarian) ====================

/**
 * 图书管理员能力处理
 * 首夜获得信息：你能得知一名外来者和一位玩家（或没有外来者）
 */
export function processLibrarian(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);

  // 找到所有外来者
  const outsiders = gameState.seats.filter(s => {
    const role = getRealRoleId(s);
    return role && getTeamFromRoleId(role) === 'OUTSIDER' && !s.isDead && s.id !== seatId;
  });

  if (outsiders.length === 0 && !tainted) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'librarian',
        seatId,
        type: 'info',
        title: '图书管理员信息',
        description: '场上没有外来者',
        suggestedResult: '场上没有外来者',
        priority: 70,
        requiresConfirmation: context.automationLevel !== 'FULL_AUTO'
      }]
    };
  }

  let realInfo: string;
  let targetIds: number[] = [];

  if (outsiders.length > 0) {
    const realTarget = outsiders[Math.floor(Math.random() * outsiders.length)];
    if (!realTarget) {
      return { success: false, suggestions: [], error: '无法选择外来者' };
    }
    const realRoleId = getRealRoleId(realTarget) ?? 'unknown';

    const others = gameState.seats.filter(s =>
      !s.isDead && s.id !== seatId && s.id !== realTarget.id && s.userId
    );
    const decoyCandidate = others[Math.floor(Math.random() * others.length)];
    const decoy = decoyCandidate ?? realTarget;

    const [player1, player2] = Math.random() > 0.5
      ? [realTarget, decoy]
      : [decoy, realTarget];

    realInfo = `${formatSeatName(player1)} 或 ${formatSeatName(player2)} 是 ${formatRoleName(realRoleId)}`;
    targetIds = [player1.id, player2.id];
  } else {
    realInfo = '场上没有外来者';
  }

  let suggestedInfo = realInfo;
  if (tainted) {
    // 中毒时给假信息
    const fakeRoles = ['butler', 'drunk', 'recluse', 'saint'];
    const fakeRole = fakeRoles[Math.floor(Math.random() * fakeRoles.length)] ?? 'butler';
    const fakePlayers = gameState.seats.filter(s => !s.isDead && s.id !== seatId && s.userId);

    if (Math.random() > 0.3 && fakePlayers.length >= 2) {
      // 70% 概率给假外来者
      const fp1 = fakePlayers[Math.floor(Math.random() * fakePlayers.length)];
      const remainingPlayers = fakePlayers.filter(p => p.id !== fp1?.id);
      const fp2 = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      if (fp1 && fp2) {
        suggestedInfo = `${formatSeatName(fp1)} 或 ${formatSeatName(fp2)} 是 ${formatRoleName(fakeRole)}`;
      }
    } else {
      // 30% 概率说没有外来者
      suggestedInfo = '场上没有外来者';
    }
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'librarian',
      seatId,
      type: 'info',
      title: '图书管理员信息',
      description: tainted ? '玩家中毒/醉酒，给予假信息' : '正常信息',
      suggestedResult: suggestedInfo,
      realResult: realInfo,
      isTainted: tainted,
      priority: 70,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
      targetSeatIds: targetIds.length > 0 ? targetIds : undefined
    }]
  };
}

// ==================== 调查员 (Investigator) ====================

/**
 * 调查员能力处理
 * 首夜获得信息：你能得知一名爪牙和一位玩家
 */
export function processInvestigator(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);

  // 找到所有爪牙
  const minions = gameState.seats.filter(s => {
    const role = getRealRoleId(s);
    return role && getTeamFromRoleId(role) === 'MINION' && !s.isDead && s.id !== seatId;
  });

  if (minions.length === 0 && !tainted) {
    // 理论上TB总有爪牙，但以防万一
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'investigator',
        seatId,
        type: 'info',
        title: '调查员信息',
        description: '场上没有爪牙',
        suggestedResult: '无法获取信息',
        priority: 75,
        requiresConfirmation: context.automationLevel !== 'FULL_AUTO'
      }]
    };
  }

  let realInfo: string;
  let targetIds: number[] = [];

  if (minions.length > 0) {
    const realTarget = minions[Math.floor(Math.random() * minions.length)];
    if (!realTarget) {
      return { success: false, suggestions: [], error: '无法选择爪牙' };
    }
    const realRoleId = getRealRoleId(realTarget) ?? 'unknown';

    const others = gameState.seats.filter(s =>
      !s.isDead && s.id !== seatId && s.id !== realTarget.id && s.userId
    );
    const decoyCandidate = others[Math.floor(Math.random() * others.length)];
    const decoy = decoyCandidate ?? realTarget;

    const [player1, player2] = Math.random() > 0.5
      ? [realTarget, decoy]
      : [decoy, realTarget];

    realInfo = `${formatSeatName(player1)} 或 ${formatSeatName(player2)} 是 ${formatRoleName(realRoleId)}`;
    targetIds = [player1.id, player2.id];
  } else {
    realInfo = '无爪牙信息';
  }

  let suggestedInfo = realInfo;
  if (tainted) {
    const fakeRoles = ['poisoner', 'spy', 'scarlet_woman', 'baron'];
    const fakeRole = fakeRoles[Math.floor(Math.random() * fakeRoles.length)] ?? 'poisoner';
    const fakePlayers = gameState.seats.filter(s => !s.isDead && s.id !== seatId && s.userId);

    if (fakePlayers.length >= 2) {
      const fp1 = fakePlayers[Math.floor(Math.random() * fakePlayers.length)];
      const remainingPlayers = fakePlayers.filter(p => p.id !== fp1?.id);
      const fp2 = remainingPlayers[Math.floor(Math.random() * remainingPlayers.length)];
      if (fp1 && fp2) {
        suggestedInfo = `${formatSeatName(fp1)} 或 ${formatSeatName(fp2)} 是 ${formatRoleName(fakeRole)}`;
      }
    }
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'investigator',
      seatId,
      type: 'info',
      title: '调查员信息',
      description: tainted ? '玩家中毒/醉酒，给予假信息' : '正常信息',
      suggestedResult: suggestedInfo,
      realResult: realInfo,
      isTainted: tainted,
      priority: 75,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
      targetSeatIds: targetIds.length > 0 ? targetIds : undefined
    }]
  };
}

// ==================== 厨师 (Chef) ====================

/**
 * 厨师能力处理
 * 首夜获得信息：场上有多少对邪恶玩家相邻
 */
export function processChef(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);
  const realCount = countEvilPairs(gameState);
  const realInfo = realCount === 0
    ? '场上没有邪恶玩家相邻'
    : `场上有 ${String(realCount)} 对邪恶玩家相邻`;

  let suggestedInfo = realInfo;
  if (tainted) {
    // 给假数字（0-3之间随机，但不等于真实值）
    let fakeCount: number;
    do {
      fakeCount = Math.floor(Math.random() * 4);
    } while (fakeCount === realCount);

    suggestedInfo = fakeCount === 0
      ? '场上没有邪恶玩家相邻'
      : `场上有 ${String(fakeCount)} 对邪恶玩家相邻`;
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'chef',
      seatId,
      type: 'info',
      title: '厨师信息',
      description: tainted ? '玩家中毒/醉酒，给予假信息' : '正常信息',
      suggestedResult: suggestedInfo,
      realResult: realInfo,
      isTainted: tainted,
      priority: 70,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO'
    }]
  };
}

// ==================== 共情者 (Empath) ====================

/**
 * 共情者能力处理
 * 每夜获得信息：你的存活邻居中有多少个邪恶玩家
 */
export function processEmpath(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);
  const [left, right] = getAliveNeighbors(seatId, gameState.seats);

  let evilCount = 0;
  if (left && isEvil(left, gameState)) evilCount++;
  if (right && isEvil(right, gameState)) evilCount++;

  const realInfo = evilCount === 0
    ? '你的邻居中没有邪恶玩家'
    : `你的邻居中有 ${String(evilCount)} 个邪恶玩家`;

  let suggestedInfo = realInfo;
  if (tainted) {
    let fakeCount: number;
    do {
      fakeCount = Math.floor(Math.random() * 3);
    } while (fakeCount === evilCount);

    suggestedInfo = fakeCount === 0
      ? '你的邻居中没有邪恶玩家'
      : `你的邻居中有 ${String(fakeCount)} 个邪恶玩家`;
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'empath',
      seatId,
      type: 'info',
      title: '共情者信息',
      description: tainted ? '玩家中毒/醉酒，给予假信息' : '正常信息',
      suggestedResult: suggestedInfo,
      realResult: realInfo,
      isTainted: tainted,
      priority: 65,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO'
    }]
  };
}

// ==================== 占卜师 (Fortune Teller) ====================

/**
 * 占卜师能力处理
 * 每夜选择两名玩家，得知其中是否有恶魔
 * 需要处理红鲱鱼
 */
export function processFortuneTeller(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);
  const { targetSeatIds, redHerringId } = context;

  // 如果没有选择目标，返回需要选择的建议
  if (targetSeatIds?.length !== 2) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'fortune_teller',
        seatId,
        type: 'action',
        title: '占卜师查验',
        description: '请选择两名玩家进行查验',
        priority: 85,
        requiresConfirmation: true,
        options: [
          {
            id: 'select_targets',
            label: '选择查验目标',
            description: '选择两名玩家',
            result: '',
            requiresInput: { type: 'players', prompt: '选择两名玩家', min: 2, max: 2 }
          },
          {
            id: 'random',
            label: '随机选择',
            description: '系统随机选择两名玩家',
            isRecommended: context.automationLevel === 'FULL_AUTO',
            result: 'random'
          }
        ]
      }]
    };
  }

  // 检查目标中是否有恶魔或红鲱鱼
  const target1 = gameState.seats.find(s => s.id === targetSeatIds[0]);
  const target2 = gameState.seats.find(s => s.id === targetSeatIds[1]);

  if (!target1 || !target2) {
    return { success: false, suggestions: [], error: '目标座位不存在' };
  }

  const demon = findDemon(gameState);
  const isDemonInTargets = targetSeatIds.includes(demon?.id ?? -1);
  const isRedHerringInTargets = redHerringId !== undefined && targetSeatIds.includes(redHerringId);

  // 真实结果
  const realResult = isDemonInTargets || isRedHerringInTargets;
  const realInfo = realResult ? '是' : '否';

  let suggestedInfo = realInfo;
  if (tainted) {
    // 中毒时随机给是/否
    suggestedInfo = Math.random() > 0.5 ? '是' : '否';
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'fortune_teller',
      seatId,
      type: 'info',
      title: '占卜师结果',
      description: `查验 ${formatSeatName(target1)} 和 ${formatSeatName(target2)}${tainted ? ' (中毒/醉酒)' : ''}`,
      suggestedResult: suggestedInfo,
      realResult: realInfo,
      isTainted: tainted,
      priority: 80,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
      targetSeatIds
    }]
  };
}

// ==================== 殓葬师 (Undertaker) ====================

/**
 * 殓葬师能力处理
 * 每夜得知昨天被处决的玩家的角色
 */
export function processUndertaker(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const { executedSeatId } = context;

  // 首夜没有处决
  if (context.isFirstNight) {
    return { success: true, suggestions: [] };
  }

  if (executedSeatId === undefined) {
    // 昨天没有处决
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'undertaker',
        seatId,
        type: 'info',
        title: '殓葬师信息',
        description: '昨天没有处决',
        suggestedResult: '昨天没有处决',
        priority: 60,
        requiresConfirmation: false
      }]
    };
  }

  const tainted = isTainted(seat);
  const executedSeat = gameState.seats.find(s => s.id === executedSeatId);

  if (!executedSeat) {
    return { success: false, suggestions: [], error: '被处决座位不存在' };
  }

  const realRoleId = getRealRoleId(executedSeat);
  const realInfo = realRoleId
    ? `被处决的是 ${formatRoleName(realRoleId)}`
    : '无法确定角色';

  let suggestedInfo = realInfo;
  if (tainted) {
    // 随机给一个假角色
    const allRoles = [
      'washerwoman', 'librarian', 'investigator', 'chef', 'empath',
      'fortune_teller', 'undertaker', 'monk', 'ravenkeeper', 'virgin',
      'slayer', 'soldier', 'mayor', 'butler', 'drunk', 'recluse', 'saint',
      'poisoner', 'spy', 'scarlet_woman', 'baron', 'imp'
    ];
    const fakeRole = allRoles[Math.floor(Math.random() * allRoles.length)] ?? 'washerwoman';
    suggestedInfo = `被处决的是 ${formatRoleName(fakeRole)}`;
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'undertaker',
      seatId,
      type: 'info',
      title: '殓葬师信息',
      description: `${formatSeatName(executedSeat)} 的角色${tainted ? ' (中毒/醉酒)' : ''}`,
      suggestedResult: suggestedInfo,
      realResult: realInfo,
      isTainted: tainted,
      priority: 65,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
      targetSeatIds: [executedSeatId]
    }]
  };
}

// ==================== 僧侣 (Monk) ====================

/**
 * 僧侣能力处理
 * 每夜（非首夜）选择一名玩家保护
 */
export function processMonk(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  // 首夜僧侣不行动
  if (context.isFirstNight) {
    return { success: true, suggestions: [] };
  }

  const tainted = isTainted(seat);
  const { targetSeatIds } = context;

  // 如果没有选择目标
  if (!targetSeatIds || targetSeatIds.length === 0) {
    const alivePlayers = getAlivePlayers(gameState).filter(s => s.id !== seatId);

    // 在FULL_AUTO模式下，推荐一个目标
    let recommendedTarget: Seat | null = null;
    if (context.automationLevel === 'FULL_AUTO') {
      // 优先保护可能重要的角色（如占卜师、共情者等）
      const infoRoles = ['fortune_teller', 'empath', 'slayer', 'mayor'];
      recommendedTarget = alivePlayers.find(s => {
        const role = getRealRoleId(s);
        return role && infoRoles.includes(role);
      }) ?? alivePlayers[0] ?? null;
    }

    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'monk',
        seatId,
        type: 'action',
        title: '僧侣保护',
        description: '选择一名玩家保护（不能选择自己）',
        priority: 90,
        requiresConfirmation: true,
        options: [
          {
            id: 'select_target',
            label: '选择保护目标',
            description: '手动选择',
            result: '',
            requiresInput: { type: 'player', prompt: '选择要保护的玩家' }
          },
          ...(recommendedTarget ? [{
            id: 'recommended',
            label: `推荐：保护 ${formatSeatName(recommendedTarget)}`,
            isRecommended: true,
            result: String(recommendedTarget.id)
          }] : [])
        ]
      }]
    };
  }

  const targetSeatId = targetSeatIds[0];
  if (targetSeatId === undefined) {
    return { success: false, suggestions: [], error: '未指定目标' };
  }
  const targetSeat = gameState.seats.find(s => s.id === targetSeatId);

  if (!targetSeat) {
    return { success: false, suggestions: [], error: '目标座位不存在' };
  }

  // 如果僧侣中毒，保护无效
  const protectionEffective = !tainted;

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'monk',
      seatId,
      type: 'effect',
      title: '僧侣保护',
      description: tainted
        ? `保护 ${formatSeatName(targetSeat)}（无效，僧侣中毒）`
        : `保护 ${formatSeatName(targetSeat)}`,
      suggestedResult: protectionEffective ? '保护生效' : '保护无效（中毒）',
      isTainted: tainted,
      priority: 90,
      requiresConfirmation: false,
      targetSeatIds: [targetSeatId]
    }],
    statusChanges: protectionEffective ? [{
      seatId: targetSeatId,
      status: 'PROTECTED',
      action: 'add',
      source: 'monk',
      duration: 'night'
    }] : []
  };
}

// ==================== 守鸦人 (Ravenkeeper) ====================

/**
 * 守鸦人能力处理
 * 死亡时，选择一名玩家得知其角色
 */
export function processRavenkeeper(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat?.isDead) {
    // 守鸦人没死，不触发
    return { success: true, suggestions: [] };
  }

  const tainted = isTainted(seat);
  const { targetSeatIds } = context;

  if (!targetSeatIds || targetSeatIds.length === 0) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'ravenkeeper',
        seatId,
        type: 'action',
        title: '守鸦人能力',
        description: '守鸦人死亡，选择一名玩家得知其角色',
        priority: 95,
        requiresConfirmation: true,
        options: [
          {
            id: 'select_target',
            label: '选择查看目标',
            result: '',
            requiresInput: { type: 'player', prompt: '选择要查看角色的玩家' }
          }
        ]
      }]
    };
  }

  const targetSeatId = targetSeatIds[0];
  if (targetSeatId === undefined) {
    return { success: false, suggestions: [], error: '未指定目标' };
  }
  const targetSeat = gameState.seats.find(s => s.id === targetSeatId);

  if (!targetSeat) {
    return { success: false, suggestions: [], error: '目标座位不存在' };
  }

  const realRoleId = getRealRoleId(targetSeat);
  const realInfo = realRoleId ? formatRoleName(realRoleId) : '未知';

  let suggestedInfo = realInfo;
  if (tainted) {
    const allRoles = [
      'washerwoman', 'librarian', 'investigator', 'chef', 'empath',
      'fortune_teller', 'undertaker', 'monk', 'ravenkeeper', 'virgin',
      'slayer', 'soldier', 'mayor', 'butler', 'drunk', 'recluse', 'saint',
      'poisoner', 'spy', 'scarlet_woman', 'baron', 'imp'
    ];
    suggestedInfo = formatRoleName(allRoles[Math.floor(Math.random() * allRoles.length)] ?? 'washerwoman');
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'ravenkeeper',
      seatId,
      type: 'info',
      title: '守鸦人信息',
      description: `${formatSeatName(targetSeat)} 的角色${tainted ? ' (中毒/醉酒)' : ''}`,
      suggestedResult: suggestedInfo,
      realResult: realInfo,
      isTainted: tainted,
      priority: 95,
      requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
      targetSeatIds: [targetSeatId]
    }]
  };
}

// ==================== 圣女 (Virgin) ====================

/**
 * 圣女能力处理
 * 第一次被提名时，如果提名者是镇民，提名者立即死亡
 */
export function processVirgin(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  // 检查是否已使用能力
  if (seat.hasUsedAbility) {
    return { success: true, suggestions: [] };
  }

  const tainted = isTainted(seat);
  const { additionalData } = context;
  const nominatorSeatId = additionalData?.nominatorSeatId as number | undefined;

  if (nominatorSeatId === undefined) {
    return { success: true, suggestions: [] };
  }

  const nominator = gameState.seats.find(s => s.id === nominatorSeatId);
  if (!nominator) {
    return { success: false, suggestions: [], error: '提名者座位不存在' };
  }

  const nominatorRole = getRealRoleId(nominator);
  const isTownsfolk = nominatorRole && getTeamFromRoleId(nominatorRole) === 'TOWNSFOLK';

  // 如果圣女中毒，能力无效
  if (tainted) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'virgin',
        seatId,
        type: 'info',
        title: '圣女能力',
        description: '圣女中毒，能力无效',
        suggestedResult: '无效果',
        isTainted: true,
        priority: 100,
        requiresConfirmation: false
      }]
    };
  }

  if (isTownsfolk) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'virgin',
        seatId,
        type: 'effect',
        title: '圣女能力触发',
        description: `${formatSeatName(nominator)} 是镇民，立即死亡！`,
        suggestedResult: `${formatSeatName(nominator)} 死亡`,
        priority: 100,
        requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
        targetSeatIds: [nominatorSeatId]
      }],
      deaths: [{
        seatId: nominatorSeatId,
        cause: 'ability',
        killerRoleId: 'virgin',
        isPreventable: false
      }]
    };
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'virgin',
      seatId,
      type: 'info',
      title: '圣女能力',
      description: `${formatSeatName(nominator)} 不是镇民，圣女能力未触发`,
      suggestedResult: '无效果',
      priority: 80,
      requiresConfirmation: false
    }]
  };
}

// ==================== 杀手 (Slayer) ====================

/**
 * 杀手能力处理
 * 白天可以公开声称杀死一名玩家（一次性）
 */
export function processSlayer(
  gameState: GameState,
  seatId: number,
  context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  if (seat.hasUsedAbility) {
    return {
      success: false,
      suggestions: [],
      error: '杀手已使用能力'
    };
  }

  const tainted = isTainted(seat);
  const { targetSeatIds } = context;

  if (!targetSeatIds || targetSeatIds.length === 0) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'slayer',
        seatId,
        type: 'action',
        title: '杀手能力',
        description: '选择一名玩家尝试击杀（一次性能力）',
        priority: 95,
        requiresConfirmation: true,
        options: [
          {
            id: 'select_target',
            label: '选择目标',
            result: '',
            requiresInput: { type: 'player', prompt: '选择要尝试击杀的玩家' }
          }
        ]
      }]
    };
  }

  const targetSeatId = targetSeatIds[0];
  if (targetSeatId === undefined) {
    return { success: false, suggestions: [], error: '未指定目标' };
  }
  const targetSeat = gameState.seats.find(s => s.id === targetSeatId);

  if (!targetSeat) {
    return { success: false, suggestions: [], error: '目标座位不存在' };
  }

  const targetRole = getRealRoleId(targetSeat);
  const isDemon = targetRole && getTeamFromRoleId(targetRole) === 'DEMON';

  // 如果杀手中毒，能力无效
  if (tainted) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'slayer',
        seatId,
        type: 'effect',
        title: '杀手能力',
        description: `尝试击杀 ${formatSeatName(targetSeat)}（无效，杀手中毒）`,
        suggestedResult: '未命中',
        isTainted: true,
        priority: 95,
        requiresConfirmation: false,
        targetSeatIds: [targetSeatId]
      }]
    };
  }

  if (isDemon) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'slayer',
        seatId,
        type: 'effect',
        title: '杀手能力命中！',
        description: `${formatSeatName(targetSeat)} 是恶魔，立即死亡！`,
        suggestedResult: `${formatSeatName(targetSeat)} 死亡`,
        priority: 100,
        requiresConfirmation: context.automationLevel !== 'FULL_AUTO',
        targetSeatIds: [targetSeatId]
      }],
      deaths: [{
        seatId: targetSeatId,
        cause: 'slayer',
        killerRoleId: 'slayer',
        isPreventable: false
      }]
    };
  }

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'slayer',
      seatId,
      type: 'effect',
      title: '杀手能力',
      description: `尝试击杀 ${formatSeatName(targetSeat)}`,
      suggestedResult: '未命中（目标不是恶魔）',
      priority: 80,
      requiresConfirmation: false,
      targetSeatIds: [targetSeatId]
    }]
  };
}

// ==================== 士兵 (Soldier) ====================

/**
 * 士兵能力处理（被动）
 * 恶魔无法杀死士兵
 */
export function processSoldier(
  gameState: GameState,
  seatId: number,
  _context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  // 士兵是被动能力，在处理恶魔击杀时检查
  // 这里只返回一个提示
  const tainted = isTainted(seat);

  return {
    success: true,
    suggestions: [{
      id: generateId(),
      roleId: 'soldier',
      seatId,
      type: 'info',
      title: '士兵状态',
      description: tainted ? '士兵中毒，保护失效' : '士兵保护有效',
      suggestedResult: tainted ? '可被恶魔击杀' : '免疫恶魔击杀',
      isTainted: tainted,
      priority: 50,
      requiresConfirmation: false
    }]
  };
}

// ==================== 市长 (Mayor) ====================

/**
 * 市长能力处理（被动）
 * 如果只剩3人且没有处决，好人获胜
 * 被恶魔杀死时可能选择另一人死亡
 */
export function processMayor(
  gameState: GameState,
  seatId: number,
  _context: AbilityContext
): AbilityResult {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat) {
    return { success: false, suggestions: [], error: '座位不存在' };
  }

  const tainted = isTainted(seat);
  const alivePlayers = getAlivePlayers(gameState);

  // 检查3人胜利条件
  if (alivePlayers.length === 3 && !tainted) {
    return {
      success: true,
      suggestions: [{
        id: generateId(),
        roleId: 'mayor',
        seatId,
        type: 'warning',
        title: '市长胜利条件',
        description: '场上只剩3人，如果今天不处决，好人获胜！',
        suggestedResult: '注意：不处决则好人胜',
        priority: 100,
        requiresConfirmation: true
      }]
    };
  }

  return { success: true, suggestions: [] };
}

// ==================== 导出所有角色处理函数 ====================

export const TOWNSFOLK_PROCESSORS: Record<string, typeof processWasherwoman> = {
  washerwoman: processWasherwoman,
  librarian: processLibrarian,
  investigator: processInvestigator,
  chef: processChef,
  empath: processEmpath,
  fortune_teller: processFortuneTeller,
  undertaker: processUndertaker,
  monk: processMonk,
  ravenkeeper: processRavenkeeper,
  virgin: processVirgin,
  slayer: processSlayer,
  soldier: processSoldier,
  mayor: processMayor
};
