import type { Seat, GameState } from '../types';
import { ROLES } from '../constants/roles';

/**
 * 智能信息生成模块
 * 
 * 用于自动推演信息类角色（共情者、厨师、占卜师等）的结果
 * 支持生成真实信息和伪造信息（中毒/醉酒状态下）
 */

export interface InfoGenerationResult {
  roleId: string;
  roleName: string;
  seatId: number;
  realInfo: string;         // 真实信息
  suggestedInfo: string;    // 建议告知的信息（可能是真或假）
  isTainted: boolean;       // 是否被污染（中毒/醉酒）
  alternatives?: string[];  // 可选的伪造信息
}

/**
 * 获取指定座位的邻居（考虑死亡玩家跳过）
 */
function getAliveNeighbors(seats: Seat[], seatId: number, includeDeadNeighbors = true): [Seat | null, Seat | null] {
  const seatCount = seats.length;
  
  // 向左找邻居
  let leftNeighbor: Seat | null = null;
  for (let i = 1; i < seatCount; i++) {
    const idx = (seatId - i + seatCount) % seatCount;
    const seat = seats[idx];
    if (seat && (includeDeadNeighbors || !seat.isDead)) {
      leftNeighbor = seat ?? null;
      break;
    }
  }

  // 向右找邻居
  let rightNeighbor: Seat | null = null;
  for (let i = 1; i < seatCount; i++) {
    const idx = (seatId + i) % seatCount;
    const seat = seats[idx];
    if (seat && (includeDeadNeighbors || !seat.isDead)) {
      rightNeighbor = seat ?? null;
      break;
    }
  }

  return [leftNeighbor, rightNeighbor];
}

/**
 * 判断玩家是否为邪恶阵营
 */
function isEvilPlayer(seat: Seat): boolean {
  const roleId = seat.realRoleId || seat.seenRoleId;
  if (!roleId) return false;
  const role = ROLES[roleId];
  return role?.team === 'DEMON' || role?.team === 'MINION';
}

/**
 * 判断玩家是否为恶魔
 */
function isDemon(seat: Seat): boolean {
  const roleId = seat.realRoleId || seat.seenRoleId;
  if (!roleId) return false;
  const role = ROLES[roleId];
  return role?.team === 'DEMON';
}

/**
 * 判断座位是否被污染（中毒或醉酒）
 */
function isTainted(seat: Seat): boolean {
  return seat.statuses.includes('POISONED') || seat.statuses.includes('DRUNK');
}

/**
 * 创建错误结果
 */
function createErrorResult(roleId: string, roleName: string, seatId: number, error: string): InfoGenerationResult {
  return {
    roleId,
    roleName,
    seatId,
    realInfo: error,
    suggestedInfo: error,
    isTainted: false
  };
}

/**
 * 生成共情者（Empath）信息
 * 每晚得知邻座有多少邪恶玩家（0, 1, 或 2）
 */
export function generateEmpathInfo(gameState: GameState, empathSeatId: number): InfoGenerationResult {
  const empathSeat = gameState.seats[empathSeatId];
  if (!empathSeat) {
    return createErrorResult('empath', '共情者', empathSeatId, '座位不存在');
  }
  const [leftNeighbor, rightNeighbor] = getAliveNeighbors(gameState.seats, empathSeatId, true);
  
  let evilCount = 0;
  if (leftNeighbor && isEvilPlayer(leftNeighbor)) evilCount++;
  if (rightNeighbor && isEvilPlayer(rightNeighbor)) evilCount++;

  const realInfo = `${evilCount}`;
  const tainted = isTainted(empathSeat);
  
  // 生成伪造信息
  const alternatives = ['0', '1', '2'].filter(n => n !== realInfo);
  const fakeInfo = alternatives[Math.floor(Math.random() * alternatives.length)] || '0';

  return {
    roleId: 'empath',
    roleName: '共情者',
    seatId: empathSeatId,
    realInfo,
    suggestedInfo: tainted ? fakeInfo : realInfo,
    isTainted: tainted,
    alternatives: tainted ? [fakeInfo] : undefined
  };
}

/**
 * 生成厨师（Chef）信息
 * 首夜得知邪恶玩家的相邻对数
 */
export function generateChefInfo(gameState: GameState, chefSeatId: number): InfoGenerationResult {
  const chefSeat = gameState.seats[chefSeatId];
  if (!chefSeat) {
    return createErrorResult('chef', '厨师', chefSeatId, '座位不存在');
  }
  const seats = gameState.seats;
  const seatCount = seats.length;
  
  let pairCount = 0;
  
  // 遍历所有座位，检查是否与下一个座位都是邪恶
  for (let i = 0; i < seatCount; i++) {
    const current = seats[i];
    const next = seats[(i + 1) % seatCount];
    
    if (current && next && isEvilPlayer(current) && isEvilPlayer(next)) {
      pairCount++;
    }
  }

  const realInfo = `${pairCount}`;
  const tainted = isTainted(chefSeat);
  
  // 生成伪造信息（0-3 范围内的其他数字）
  const possibleValues = ['0', '1', '2', '3'].filter(n => n !== realInfo);
  const fakeInfo = possibleValues[Math.floor(Math.random() * possibleValues.length)] || '0';

  return {
    roleId: 'chef',
    roleName: '厨师',
    seatId: chefSeatId,
    realInfo,
    suggestedInfo: tainted ? fakeInfo : realInfo,
    isTainted: tainted,
    alternatives: tainted ? [fakeInfo] : undefined
  };
}

/**
 * 生成占卜师（Fortune Teller）信息
 * 每晚选择两名玩家检测是否有恶魔
 */
export function generateFortuneTellerInfo(
  gameState: GameState, 
  fortuneTellerSeatId: number,
  target1SeatId: number,
  target2SeatId: number,
  redHerringId?: number // 红鲱鱼玩家ID
): InfoGenerationResult {
  const ftSeat = gameState.seats[fortuneTellerSeatId];
  if (!ftSeat) {
    return createErrorResult('fortuneteller', '占卜师', fortuneTellerSeatId, '座位不存在');
  }
  const target1 = gameState.seats[target1SeatId];
  const target2 = gameState.seats[target2SeatId];
  if (!target1 || !target2) {
    return createErrorResult('fortuneteller', '占卜师', fortuneTellerSeatId, '目标座位不存在');
  }
  
  // 检测是否有恶魔或红鲱鱼
  const hasDemon = isDemon(target1) || isDemon(target2);
  const hasRedHerring = redHerringId !== undefined && 
    (target1SeatId === redHerringId || target2SeatId === redHerringId);
  
  const realResult = hasDemon || hasRedHerring;
  const realInfo = realResult ? '是' : '否';
  const tainted = isTainted(ftSeat);
  
  // 生成伪造信息（取反）
  const fakeInfo = realResult ? '否' : '是';

  return {
    roleId: 'fortune_teller',
    roleName: '占卜师',
    seatId: fortuneTellerSeatId,
    realInfo,
    suggestedInfo: tainted ? fakeInfo : realInfo,
    isTainted: tainted,
    alternatives: tainted ? [fakeInfo] : undefined
  };
}

/**
 * 生成洗衣妇（Washerwoman）信息
 * 首夜得知一名镇民和两位玩家，其中一位是该镇民
 */
export function generateWasherwomanInfo(gameState: GameState, washerwomanSeatId: number): InfoGenerationResult {
  const wwSeat = gameState.seats[washerwomanSeatId];
  if (!wwSeat) {
    return createErrorResult('washerwoman', '洗衣妇', washerwomanSeatId, '座位不存在');
  }
  const tainted = isTainted(wwSeat);
  
  // 找到所有镇民
  const townsfolk = gameState.seats.filter(s => {
    const roleId = s.realRoleId || s.seenRoleId;
    if (!roleId) return false;
    const role = ROLES[roleId];
    return role?.team === 'TOWNSFOLK' && s.id !== washerwomanSeatId;
  });

  if (townsfolk.length === 0) {
    return {
      roleId: 'washerwoman',
      roleName: '洗衣妇',
      seatId: washerwomanSeatId,
      realInfo: '无镇民',
      suggestedInfo: '无镇民',
      isTainted: tainted
    };
  }

  // 随机选择一个镇民作为目标
  const targetTownsfolk = townsfolk[Math.floor(Math.random() * townsfolk.length)];
  if (!targetTownsfolk) {
    return createErrorResult('washerwoman', '洗衣妇', washerwomanSeatId, '无法选择目标');
  }
  const targetRoleId = targetTownsfolk.realRoleId || targetTownsfolk.seenRoleId || '';
  const targetRoleName = ROLES[targetRoleId]?.name || '未知';
  
  // 选择另一个非目标玩家
  const otherPlayers = gameState.seats.filter(s => 
    s.id !== washerwomanSeatId && s.id !== targetTownsfolk.id
  );
  const decoy = otherPlayers.length > 0 
    ? (otherPlayers[Math.floor(Math.random() * otherPlayers.length)] ?? targetTownsfolk)
    : targetTownsfolk;

  const realInfo = `${targetTownsfolk.userName}(${targetTownsfolk.id + 1}号) 或 ${decoy.userName}(${decoy.id + 1}号) 中有一人是 ${targetRoleName}`;
  
  // 伪造信息：指向错误的镇民类型
  const fakeRoleNames = ['洗衣妇', '图书管理员', '调查员', '厨师', '共情者', '占卜师'];
  const fakeRole = fakeRoleNames[Math.floor(Math.random() * fakeRoleNames.length)] ?? '厨师';
  const fakeInfo = `${decoy.userName}(${decoy.id + 1}号) 或 ${targetTownsfolk.userName}(${targetTownsfolk.id + 1}号) 中有一人是 ${fakeRole}`;

  return {
    roleId: 'washerwoman',
    roleName: '洗衣妇',
    seatId: washerwomanSeatId,
    realInfo,
    suggestedInfo: tainted ? fakeInfo : realInfo,
    isTainted: tainted,
    alternatives: tainted ? [fakeInfo] : undefined
  };
}

/**
 * 生成掘墓人（Undertaker）信息
 * 得知白天被处决玩家的角色
 */
export function generateUndertakerInfo(
  gameState: GameState, 
  undertakerSeatId: number,
  executedSeatId: number
): InfoGenerationResult {
  const utSeat = gameState.seats[undertakerSeatId];
  const executedSeat = gameState.seats[executedSeatId];
  
  if (!utSeat) {
    return createErrorResult('undertaker', '掘墓人', undertakerSeatId, '座位不存在');
  }
  if (!executedSeat) {
    return createErrorResult('undertaker', '掘墓人', undertakerSeatId, '被处决者座位不存在');
  }
  
  const tainted = isTainted(utSeat);
  
  const realRoleId = executedSeat.realRoleId || executedSeat.seenRoleId || '';
  const realRoleName = ROLES[realRoleId]?.name || '未知';
  
  const realInfo = `被处决者是 ${realRoleName}`;
  
  // 伪造信息：随机一个其他角色
  const allRoleNames = Object.values(ROLES)
    .filter(r => r.name !== realRoleName)
    .map(r => r.name);
  const fakeRole = allRoleNames[Math.floor(Math.random() * allRoleNames.length)] || '村民';
  const fakeInfo = `被处决者是 ${fakeRole}`;

  return {
    roleId: 'undertaker',
    roleName: '掘墓人',
    seatId: undertakerSeatId,
    realInfo,
    suggestedInfo: tainted ? fakeInfo : realInfo,
    isTainted: tainted,
    alternatives: tainted ? [fakeInfo] : undefined
  };
}

/**
 * 根据角色ID自动生成信息
 * 这是主入口函数，ST 使用此函数获取信息建议
 */
export function generateInfoForRole(
  gameState: GameState,
  roleId: string,
  seatId: number,
  additionalParams?: {
    target1SeatId?: number;
    target2SeatId?: number;
    executedSeatId?: number;
    redHerringId?: number;
  }
): InfoGenerationResult | null {
  switch (roleId) {
    case 'empath':
      return generateEmpathInfo(gameState, seatId);
    
    case 'chef':
      return generateChefInfo(gameState, seatId);
    
    case 'fortune_teller':
      if (additionalParams?.target1SeatId !== undefined && 
          additionalParams?.target2SeatId !== undefined) {
        return generateFortuneTellerInfo(
          gameState, 
          seatId, 
          additionalParams.target1SeatId,
          additionalParams.target2SeatId,
          additionalParams.redHerringId
        );
      }
      return null;
    
    case 'washerwoman':
      return generateWasherwomanInfo(gameState, seatId);
    
    case 'undertaker':
      if (additionalParams?.executedSeatId !== undefined) {
        return generateUndertakerInfo(gameState, seatId, additionalParams.executedSeatId);
      }
      return null;

    case 'investigator':
      return generateInvestigatorInfo(gameState, seatId);

    case 'librarian':
      return generateLibrarianInfo(gameState, seatId);
    
    default:
      return null;
  }
}

/**
 * 生成调查员（Investigator）信息
 * 首夜得知一名爪牙和两位玩家，其中一位是该爪牙
 */
export function generateInvestigatorInfo(gameState: GameState, investigatorSeatId: number): InfoGenerationResult {
  const invSeat = gameState.seats[investigatorSeatId];
  if (!invSeat) {
    return createErrorResult('investigator', '调查员', investigatorSeatId, '座位不存在');
  }
  const tainted = isTainted(invSeat);
  
  // 找到所有爪牙
  const minions = gameState.seats.filter(s => {
    const roleId = s.realRoleId || s.seenRoleId;
    if (!roleId) return false;
    const role = ROLES[roleId];
    return role?.team === 'MINION' && s.id !== investigatorSeatId;
  });

  if (minions.length === 0) {
    return {
      roleId: 'investigator',
      roleName: '调查员',
      seatId: investigatorSeatId,
      realInfo: '无爪牙',
      suggestedInfo: '无爪牙',
      isTainted: tainted
    };
  }

  // 随机选择一个爪牙作为目标
  const targetMinion = minions[Math.floor(Math.random() * minions.length)];
  if (!targetMinion) {
    return createErrorResult('investigator', '调查员', investigatorSeatId, '无法选择目标');
  }
  const targetRoleId = targetMinion.realRoleId || targetMinion.seenRoleId || '';
  const targetRoleName = ROLES[targetRoleId]?.name || '未知爪牙';
  
  // 选择另一个非目标玩家
  const otherPlayers = gameState.seats.filter(s => 
    s.id !== investigatorSeatId && s.id !== targetMinion.id
  );
  const decoy = otherPlayers.length > 0 
    ? (otherPlayers[Math.floor(Math.random() * otherPlayers.length)] ?? targetMinion)
    : targetMinion;

  const realInfo = `${targetMinion.userName}(${targetMinion.id + 1}号) 或 ${decoy.userName}(${decoy.id + 1}号) 中有一人是 ${targetRoleName}`;
  
  // 伪造信息
  const fakeMinionNames = ['投毒者', '间谍', '男爵', '猩红女郎'];
  const fakeRole = fakeMinionNames[Math.floor(Math.random() * fakeMinionNames.length)] ?? '投毒者';
  const fakeInfo = `${decoy.userName}(${decoy.id + 1}号) 或 ${targetMinion.userName}(${targetMinion.id + 1}号) 中有一人是 ${fakeRole}`;

  return {
    roleId: 'investigator',
    roleName: '调查员',
    seatId: investigatorSeatId,
    realInfo,
    suggestedInfo: tainted ? fakeInfo : realInfo,
    isTainted: tainted,
    alternatives: tainted ? [fakeInfo] : undefined
  };
}

/**
 * 生成图书管理员（Librarian）信息
 * 首夜得知一名外来者和两位玩家，其中一位是该外来者，或得知无外来者
 */
export function generateLibrarianInfo(gameState: GameState, librarianSeatId: number): InfoGenerationResult {
  const libSeat = gameState.seats[librarianSeatId];
  if (!libSeat) {
    return createErrorResult('librarian', '图书管理员', librarianSeatId, '座位不存在');
  }
  const tainted = isTainted(libSeat);
  
  // 找到所有外来者
  const outsiders = gameState.seats.filter(s => {
    const roleId = s.realRoleId || s.seenRoleId;
    if (!roleId) return false;
    const role = ROLES[roleId];
    return role?.team === 'OUTSIDER' && s.id !== librarianSeatId;
  });

  if (outsiders.length === 0) {
    const realInfo = '没有外来者';
    const fakeOutsiders = ['酒鬼', '隐士', '圣徒', '男爵'];
    const fakeOutsider = fakeOutsiders[Math.floor(Math.random() * fakeOutsiders.length)] ?? '酒鬼';
    // 伪造：声称有外来者
    const randomPlayer = gameState.seats.find(s => s.id !== librarianSeatId);
    const fakeInfo = randomPlayer ? `${randomPlayer.userName} 可能是 ${fakeOutsider}` : realInfo;
    
    return {
      roleId: 'librarian',
      roleName: '图书管理员',
      seatId: librarianSeatId,
      realInfo,
      suggestedInfo: tainted ? fakeInfo : realInfo,
      isTainted: tainted,
      alternatives: tainted ? [fakeInfo] : undefined
    };
  }

  // 随机选择一个外来者作为目标
  const targetOutsider = outsiders[Math.floor(Math.random() * outsiders.length)];
  if (!targetOutsider) {
    return createErrorResult('librarian', '图书管理员', librarianSeatId, '无法选择目标');
  }
  const targetRoleId = targetOutsider.realRoleId || targetOutsider.seenRoleId || '';
  const targetRoleName = ROLES[targetRoleId]?.name || '未知外来者';
  
  // 选择另一个非目标玩家
  const otherPlayers = gameState.seats.filter(s => 
    s.id !== librarianSeatId && s.id !== targetOutsider.id
  );
  const decoy = otherPlayers.length > 0 
    ? (otherPlayers[Math.floor(Math.random() * otherPlayers.length)] ?? targetOutsider)
    : targetOutsider;

  const realInfo = `${targetOutsider.userName}(${targetOutsider.id + 1}号) 或 ${decoy.userName}(${decoy.id + 1}号) 中有一人是 ${targetRoleName}`;
  
  // 伪造信息
  const fakeOutsiderNames = ['酒鬼', '隐士', '圣徒', '男爵'];
  const fakeRole = fakeOutsiderNames[Math.floor(Math.random() * fakeOutsiderNames.length)] ?? '酒鬼';
  const fakeInfo = `${decoy.userName}(${decoy.id + 1}号) 或 ${targetOutsider.userName}(${targetOutsider.id + 1}号) 中有一人是 ${fakeRole}`;

  return {
    roleId: 'librarian',
    roleName: '图书管理员',
    seatId: librarianSeatId,
    realInfo,
    suggestedInfo: tainted ? fakeInfo : realInfo,
    isTainted: tainted,
    alternatives: tainted ? [fakeInfo] : undefined
  };
}

/**
 * 获取当前夜晚需要处理的信息类角色列表
 */
export function getInfoRolesForNight(gameState: GameState, isFirstNight: boolean): {seatId: number, roleId: string, roleName: string}[] {
  const infoRoles: {seatId: number, roleId: string, roleName: string}[] = [];
  
  // 首夜信息类角色
  const firstNightInfoRoles = ['washerwoman', 'librarian', 'investigator', 'chef', 'empath', 'fortune_teller'];
  // 其他夜晚信息类角色
  const otherNightInfoRoles = ['empath', 'fortune_teller', 'undertaker'];
  
  const targetRoles = isFirstNight ? firstNightInfoRoles : otherNightInfoRoles;
  
  for (const seat of gameState.seats) {
    const roleId = seat.realRoleId || seat.seenRoleId;
    if (roleId && targetRoles.includes(roleId) && !seat.isDead) {
      const role = ROLES[roleId];
      if (role) {
        infoRoles.push({
          seatId: seat.id,
          roleId,
          roleName: role.name
        });
      }
    }
  }
  
  return infoRoles;
}
