# 项目架构文档 | Architecture

> **版本**: v0.8.0 | **代码规模**: ~70,000 行 | **测试覆盖率**: 85%+

本文档描述 Grimoire Web（血染钟楼魔典）的技术架构、目录结构和核心设计决策。

---

## 📁 目录结构

```
src/
├── components/           # React 组件
│   ├── app/             # 应用外壳 (GameShell, StorytellerShell, PlayerShell)
│   ├── game/            # 游戏核心组件 (Grimoire, SeatNode, TownSquare, 投票, 夜晚等)
│   ├── lobby/           # 大厅/房间组件
│   ├── controls/        # 控制面板组件
│   │   └── sections/    # ST 控制子面板
│   ├── settings/        # 设置页面组件
│   ├── ui/              # 基础 UI 组件 (Button, Card, ConfirmModal...)
│   ├── script/          # 剧本编辑器组件
│   ├── sandbox/         # 沙盒/测试组件
│   └── history/         # 历史记录组件
├── store/               # Zustand 状态管理
│   ├── slices/          # 状态切片
│   │   ├── game/        # 游戏状态 (核心)
│   │   │   ├── flow/    # 游戏流程 (phase, night, voting, lifecycle)
│   │   │   └── phaseMachine.ts # XState 集成 (阶段转换权威)
│   │   ├── ai.ts        # AI 配置状态
│   │   ├── connection.ts # 连接状态 + Supabase Realtime
│   │   ├── connection.auth.ts # 认证逻辑 (匿名/访客)
│   │   └── ui.ts        # UI 状态
│   └── store.ts         # Store 入口 (根目录)
├── hooks/               # 自定义 Hooks
│   ├── useGameStateSelectors.ts # 细粒度 store selectors
│   └── useCanvasGestures.ts     # Konva 画布手势
├── lib/                 # 工具库
│   ├── roleAutomation/  # 角色自动化逻辑
│   │   ├── troubleBrewing/ # 暗流涌动剧本处理器
│   │   └── abilityMetadata.ts # 能力元数据注册表
│   ├── machines/        # XState 状态机
│   │   ├── phaseMachine.ts # 游戏阶段状态机定义
│   │   └── phaseMapping.ts # XState↔GamePhase 映射
│   └── gameLogic.ts     # 游戏核心逻辑 (胜负判定, 阵营分析)
├── config/              # 环境配置 (env.ts)
├── services/            # 外部服务 (离线队列, 推送通知)
├── constants/           # 常量定义 (角色, 剧本, 夜晚顺序)
├── i18n/                # 国际化 (zh-CN, en)
└── types/               # TypeScript 类型
```

---

## 🏗️ 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **框架** | React 18 + TypeScript | UI 构建 |
| **构建** | Vite | 开发/打包 |
| **状态** | Zustand + Immer + XState | 全局状态 + 阶段状态机 |
| **样式** | Tailwind CSS + CSS Variables | 样式系统 |
| **画布** | React Konva | 座位圆桌渲染 |
| **动画** | Framer Motion | UI 动画 |
| **后端** | Supabase (Realtime) | 实时同步 |
| **测试** | Vitest + Testing Library | 单元/集成测试 |

---

## 🔄 阶段管理架构 (XState + Zustand)

```
用户操作 → flow slice action
  → phaseActor.send(event)          # XState 验证转换合法性
    → guards 检查 (canStartVoting, isNightQueueComplete, ...)
    → 状态转换 (setup→night→day→voting→gameOver)
      → actor.subscribe() 回调
        → 同步 context 到 gameState (nightQueue, roundInfo, ...)
        → 执行副作用 (onEnterNight, onEnterDay, resolveDailyExecution)
        → 调用 sync() 推送到 Supabase
          → UI 读取 gameState.phase 更新
```

**回退机制**: 当 phaseActor 不可用时（测试、边缘场景），flow slices 自动回退到直接 Zustand mutation。

---

## 🔄 数据流架构

```
┌─────────────────────────────────────────────────────────────┐
│                        React Components                      │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ Lobby   │  │  Game   │  │ Voting  │  │ Effects │        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘        │
│       │            │            │            │              │
│       └────────────┴────────────┴────────────┘              │
│                          │                                   │
│                    useGameStore()                           │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    Zustand Store                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    gameSlice                         │    │
│  │  ├── seats[]        # 座位/玩家数据                  │    │
│  │  ├── phase          # 当前阶段 (day/night/voting)    │    │
│  │  ├── nominations[]  # 提名记录                       │    │
│  │  ├── votes[]        # 投票记录                       │    │
│  │  └── nightActions[] # 夜间行动                       │    │
│  └─────────────────────────────────────────────────────┘    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ connectionSlice│  │   uiSlice   │  │   aiSlice   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────┼──────────────────────────────────┘
                           │
                     Supabase Realtime
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                    其他客户端                                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎮 游戏状态机

游戏流程由 XState 状态机管理：

```
┌──────────┐     创建房间      ┌──────────┐
│  IDLE    │ ───────────────► │  SETUP   │
└──────────┘                   └────┬─────┘
                                    │ 开始游戏
                                    ▼
                              ┌──────────┐
                         ┌───►│  NIGHT   │◄───┐
                         │    └────┬─────┘    │
                         │         │ 天亮     │
                         │         ▼          │
                         │    ┌──────────┐    │
                         │    │   DAY    │    │
                         │    └────┬─────┘    │
                         │         │ 提名     │
                         │         ▼          │
                         │    ┌──────────┐    │ 继续
                         │    │  VOTING  │────┘
                         │    └────┬─────┘
                         │         │ 处决
                         │         ▼
                         │    ┌──────────┐
                         └────┤ EXECUTION│
                              └────┬─────┘
                                   │ 游戏结束
                                   ▼
                              ┌──────────┐
                              │   END    │
                              └──────────┘
```

---

## 🧩 核心模块说明

### 1. 座位系统 (`SeatNode.tsx`)

座位是游戏的核心 UI 单元，使用 React Konva 渲染：

```typescript
interface Seat {
  id: number;              // 座位 ID (0-indexed)
  userId: string;          // 玩家 ID
  userName: string;        // 玩家名称
  seenRoleId: string;      // 玩家看到的角色
  realRoleId: string;      // 真实角色 (说书人可见)
  isDead: boolean;         // 是否死亡
  hasGhostVote: boolean;   // 是否有幽灵票
  statuses: Status[];      // 状态标记 (中毒、醉酒等)
  reminders: Reminder[];   // 提醒标记
}
```

### 2. 角色自动化 (`roleAutomation/`)

每个角色的技能逻辑独立封装：

```typescript
// 示例: 洗衣妇
export const WASHERWOMAN: RoleAutomation = {
  id: 'WASHERWOMAN',
  nightOrder: 32,

  async execute(context) {
    // 选择一名村民和一名其他玩家
    const townsfolk = selectRandomTownsfolk(context);
    const other = selectRandomPlayer(context);

    return {
      type: 'INFO',
      targets: [townsfolk, other],
      message: `这两人中有一人是 ${townsfolk.role}`
    };
  }
};
```

### 3. 实时同步 (`connectionSlice.ts`)

使用 Supabase Realtime 实现多端同步：

```typescript
// 订阅游戏状态变更
supabase
  .channel(`game:${roomId}`)
  .on('broadcast', { event: 'state_update' }, (payload) => {
    store.getState().mergeRemoteState(payload);
  })
  .subscribe();
```

---

## 🎨 样式系统

### 设计令牌

```css
:root {
  /* 颜色 */
  --gothic-bg: #0a0a0f;
  --gothic-surface: #12121a;
  --gothic-accent: #8b5cf6;

  /* 间距 */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;

  /* 动画 */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
}
```

### 组件变体 (CVA)

```typescript
const buttonVariants = cva('base-button', {
  variants: {
    variant: {
      primary: 'bg-gothic-accent',
      ghost: 'bg-transparent',
      danger: 'bg-blood-red',
    },
    size: {
      sm: 'px-2 py-1 text-sm',
      md: 'px-4 py-2',
      lg: 'px-6 py-3 text-lg',
    },
  },
});
```

---

## 📊 性能优化

### Zustand 选择器优化

使用 `shallow` 比较减少不必要的重渲染：

```typescript
// ❌ 避免: 每次都返回新对象
const { seats, phase } = useGameStore();

// ✅ 推荐: 使用 shallow 比较
const { seats, phase } = useGameStore(
  (state) => ({ seats: state.seats, phase: state.phase }),
  shallow
);
```

### React Konva 优化

- 使用 `React.memo` 包装座位节点
- 动画使用 Konva 原生 Tween 而非 React 状态
- 大量元素使用 Layer 分离

---

## 🔐 安全考虑

1. **角色信息隔离**: 玩家只能看到 `seenRoleId`，真实角色由说书人控制
2. **房间权限**: 说书人操作需验证 `isStoryteller` 状态
3. **数据校验**: 所有 Supabase RPC 调用都有服务端校验

---

## 📚 相关文档

- [部署指南](./DEPLOYMENT.md)
- [测试指南](./TESTING.md)
- [贡献指南](./CONTRIBUTING.md)
- [用户指南](../USER_GUIDE.md)
- [说书人手册](../STORYTELLER_MANUAL.md)
