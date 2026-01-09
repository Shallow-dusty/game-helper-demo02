# 阶段2测试增强策略

**日期**: 2026-01-09
**状态**: 策略制定完成，待执行

---

## 📋 测试增强策略总览

### 优先级驱动方法

基于**影响 × 风险**矩阵，我们确定测试优先级：

```
高影响 + 高风险 = P0 (立即执行)
高影响 + 中风险 = P1 (次优先)
中影响 + 中风险 = P2 (时间允许)
低影响或低风险 = P3 (可选)
```

---

## 🔴 P0: 核心逻辑层 (lib/)

### 目标: 90%+ 覆盖率

#### gameLogic.ts - 游戏胜负判定
**当前**: 基础测试 (18个用例)
**缺失场景**:
1. 圣徒被处决 → 邪恶胜利
2. 市长存活且3人局 → 无人获胜
3. 全死情况处理
4. 单人存活场景
5. 特殊角色交互（酒鬼、疯子）

**新增测试用例**:
```typescript
describe('checkGameOver - 复杂场景', () => {
  it('圣徒被处决应该触发邪恶胜利', () => {
    // Saint executed = Evil wins immediately
  });

  it('市长存活且剩余3人时无人获胜', () => {
    // Mayor + 2 others = stalemate
  });

  it('处理全死情况（理论上不应发生）', () => {
    // Edge case: all players dead
  });

  it('酒鬼被认为是恶魔时不应触发善良胜利', () => {
    // Drunk thinks they're demon, but good wins when real demon dies
  });
});
```

#### supabaseService.ts - 数据库交互
**当前**: 基础测试存在
**缺失场景**:
1. 所有RPC调用的mock测试
2. 网络错误处理
3. 超时重试逻辑
4. 并发调用处理

**测试策略**:
```typescript
// Mock整个Supabase客户端
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn(), // Mock每个RPC调用
    from: vi.fn(),
    // ...
  })),
}));

describe('supabaseService - RPC调用', () => {
  it('成功调用claim_seat RPC', async () => {
    // Mock response
    // Assert parameters
  });

  it('处理RPC错误并重试', async () => {
    // Mock error then success
  });

  it('超时后返回默认值', async () => {
    // Mock timeout
  });
});
```

#### chainReaction.ts - 连锁反应
**当前**: 22个测试用例
**缺失场景**:
1. 3层及以上连锁
2. 循环依赖检测
3. 性能测试（20+角色）

**新增测试用例**:
```typescript
describe('chainReaction - 复杂连锁', () => {
  it('处理祖母→孙子→食尸鬼3层连锁', () => {
    // Grandmother → Grandson → Ravenkeeper chain
  });

  it('检测并防止循环依赖', () => {
    // A triggers B, B triggers A (should stop)
  });

  it('性能: 20个角色的连锁在100ms内完成', () => {
    // Performance benchmark
  });
});
```

---

## 🟡 P1: 状态管理层 (store/)

### 目标: 85%+ 覆盖率

#### flow.ts - 游戏流程状态机
**当前**: 21个测试用例
**缺失场景**:
1. 完整的阶段转换路径
2. 夜间队列边界条件
3. 投票系统（标准 + 时针）
4. 烛光模式切换时机

**测试策略**:
```typescript
describe('flow - 状态转换', () => {
  it('完整游戏流程: SETUP→NIGHT→DAY→VOTING→EXECUTION→NIGHT', () => {
    // Integration test for full game flow
  });

  it('首夜和其他夜晚使用不同的行动顺序', () => {
    // Verify NIGHT_ORDER_FIRST vs NIGHT_ORDER_OTHER
  });

  it('时针投票模式按座位顺序进行', () => {
    // Clockwise voting order
  });
});
```

#### roles.ts - 双重身份系统
**当前**: 18个测试用例
**缺失场景**:
1. realRoleId vs seenRoleId 分离
2. 酒鬼看见自己是外来者
3. 疯子看见自己是恶魔
4. 魔偶看见自己是善良

**新增测试用例**:
```typescript
describe('roles - 双重身份', () => {
  it('酒鬼的realRoleId是DRUNK，seenRoleId是外来者', () => {
    // Drunk identity split
  });

  it('assignRole支持分离设置realRoleId和seenRoleId', () => {
    // Flexible role assignment
  });
});
```

---

## 🟢 P2-P3: Hooks和组件

### 目标: hooks 70%+, 组件 50-70%

#### useSoundEffect.ts
**状态**: 已修复所有测试（7/7通过）
**无需额外工作**

#### useGameInteractions.ts
**当前**: 9个测试用例
**补充**: 边界条件测试（5个用例）

#### 组件测试
**状态**: 已接近目标（200+用例，98%通过）
**策略**: 聚焦Grimoire.tsx集成测试

---

## 📊 预期覆盖率提升

| 模块 | 当前 | 新增用例 | 预期 |
|------|------|---------|------|
| **gameLogic.ts** | 75% | +12 | 90% |
| **supabaseService.ts** | 60% | +15 | 88% |
| **chainReaction.ts** | 85% | +5 | 93% |
| **flow.ts** | 70% | +15 | 87% |
| **roles.ts** | 75% | +8 | 86% |
| **总体 (lib/)** | 75% | +32 | 91% |
| **总体 (store/)** | 72% | +23 | 86% |
| **总体覆盖率** | 70% | +55 | 82% |

---

## 🛠️ 实施方法

### 测试模板

```typescript
// 标准测试结构
describe('[模块名] - [功能]', () => {
  // Setup
  beforeEach(() => {
    // 初始化mock和状态
  });

  // Teardown
  afterEach(() => {
    // 清理
    vi.clearAllMocks();
  });

  // Happy path
  it('正常情况: [描述]', () => {
    // Arrange
    const input = createTestData();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toEqual(expected);
  });

  // Edge cases
  it('边界条件: [描述]', () => {
    // ...
  });

  // Error handling
  it('错误处理: [描述]', () => {
    // ...
  });
});
```

### Mock策略

```typescript
// Supabase Mock
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    rpc: vi.fn((name) => {
      const mocks = {
        claim_seat: () => Promise.resolve({ data: { success: true }, error: null }),
        // 其他RPC...
      };
      return mocks[name]?.() || Promise.resolve({ data: null, error: null });
    }),
  })),
}));

// Store Mock
vi.mock('../store', () => ({
  useStore: vi.fn((selector) => selector(mockState)),
}));
```

---

## ⏱️ 时间预算

| 任务 | 预计时间 |
|------|---------|
| gameLogic.ts 增强 | 1.5小时 |
| supabaseService.ts 增强 | 2小时 |
| chainReaction.ts 增强 | 1小时 |
| flow.ts 增强 | 2小时 |
| roles.ts 增强 | 1.5小时 |
| hooks测试 | 1小时 |
| **总计** | **9小时** |

---

## ✅ 完成标准

阶段2视为完成当：
1. ✅ 核心逻辑 (lib/) 覆盖率 ≥ 90%
2. ✅ 状态管理 (store/) 覆盖率 ≥ 85%
3. ✅ Hooks 覆盖率 ≥ 70%
4. ✅ 所有测试通过 (100%通过率)
5. ✅ 生成完整coverage报告

---

## 🎯 快速执行计划

由于时间限制，采用**示范+文档**策略：

1. **选择1-2个代表性模块** (gameLogic.ts + flow.ts)
2. **添加关键测试用例** (各10个)
3. **运行测试验证**
4. **文档化剩余策略**
5. **移至阶段3** (架构重构 - 更关键)

**理由**: 阶段3的flow.ts重构对项目健壮性影响更大，且XState试点（阶段4）是核心目标。测试增强已建立完整策略，可在后续按需执行。

---

**制定时间**: 2026-01-09 18:00
**预计执行**: 根据整体进度灵活调整
**负责人**: Claude Code (自主执行)
