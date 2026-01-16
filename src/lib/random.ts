/**
 * 安全随机数工具模块
 *
 * 使用 Web Crypto API 生成密码学安全的随机数，
 * 用于替代 Math.random() 在游戏逻辑和 ID 生成中的使用。
 *
 * 注意：纯 UI 动画效果（粒子、背景等）可继续使用 Math.random()
 */

/**
 * 生成唯一 ID
 * 使用 crypto.randomUUID() 生成符合 RFC 4122 的 UUID v4
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * 生成短 ID（9 字符）
 * 用于替代 Math.random().toString(36).slice(2, 11)
 */
export function generateShortId(): string {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return Array.from(bytes)
        .map(b => b.toString(36).padStart(2, '0'))
        .join('')
        .slice(0, 9);
}

/**
 * 生成指定范围内的安全随机整数 [min, max)
 * 用于替代 Math.floor(Math.random() * n)
 */
export function randomInt(min: number, max: number): number {
    const range = max - min;
    if (range <= 0) return min;

    // 使用 rejection sampling 确保均匀分布
    const bytesNeeded = Math.ceil(Math.log2(range) / 8) || 1;
    const maxValid = Math.floor(256 ** bytesNeeded / range) * range;

    let value: number;
    const bytes = new Uint8Array(bytesNeeded);

    do {
        crypto.getRandomValues(bytes);
        value = bytes.reduce((acc, byte, i) => acc + byte * (256 ** i), 0);
    } while (value >= maxValid);

    return min + (value % range);
}

/**
 * 从数组中随机选择一个元素
 */
export function randomChoice<T>(array: readonly T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[randomInt(0, array.length)];
}

/**
 * Fisher-Yates 洗牌算法（原地修改）
 * 使用安全随机数，无偏差
 */
export function shuffleInPlace<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1);
        [array[i], array[j]] = [array[j]!, array[i]!];
    }
    return array;
}

/**
 * Fisher-Yates 洗牌算法（返回新数组）
 * 用于替代 [...arr].sort(() => Math.random() - 0.5)
 */
export function shuffle<T>(array: readonly T[]): T[] {
    const result = [...array];
    return shuffleInPlace(result);
}

/**
 * 生成 4 位房间码
 */
export function generateRoomCode(): string {
    return randomInt(1000, 10000).toString();
}

/**
 * 随机布尔值，指定概率
 */
export function randomBoolean(probability = 0.5): boolean {
    const bytes = new Uint8Array(4);
    crypto.getRandomValues(bytes);
    const value = new DataView(bytes.buffer).getUint32(0) / 0xFFFFFFFF;
    return value < probability;
}
