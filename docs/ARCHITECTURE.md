# 项目架构文档 | Architecture

> **版本**: v0.8.0 | **代码规模**: ~52,000 行 | **测试覆盖率**: 80%+

本文档描述 Grimoire Web（血染钟楼魔典）的技术架构、目录结构和核心设计决策。

---

## 📁 目录结构

```
src/
├── components/           # React 组件
│   ├── game/            # 游戏核心组件
│   │   ├── core/        # 核心渲染 (TownSquare, SeatNode)
│   │   ├── night/       # 夜间阶段组件
│   │   ├── voting/      # 投票系统组件
│   │   ├── player/      # 玩家相关组件
│   │   ├── modals/      # 游戏内弹窗
│   │   └── overlay/     # 覆盖层效果
│   ├── lobby/           # 大厅/房间组件
│   ├── modals/          # 通用弹窗组件
│   ├── controls/        # 控制面板组件
│   ├── effects/         # 视觉特效组件
│   ├── settings/        # 设置页面组件
│   ├── ui/              # 基础 UI 组件 (Button, Card, Input...)
│   ├── script/          # 剧本编辑器组件
│   ├── sandbox/         # 沙盒/测试组件
│   └── history/         # 历史记录组件
├── store/               # Zustand 状态管理
│   ├── slices/          # 状态切片
│   │   ├── game/        # 游戏状态 (核心)
│   │   │   └── flow/    # 游戏流程状态
│   │   ├── ai.ts        # AI 配置状态
│   │   ├── connection.ts # 连接状态
│   │   └── ui.ts        # UI 状态
│   └── index.ts         # Store 入口
├── hooks/               # 自定义 Hooks
├── lib/                 # 工具库
│   ├── roleAutomation/  # 角色自动化逻辑
│   │   └── troubleBrewing/ # 暗流涌动剧本
│   └── machines/        # 状态机 (XState)
├── services/            # 外部服务
├── constants/           # 常量定义
├── styles/              # 全局样式
└── types/               # TypeScript 类型
```

---

## 🏗️ 技术栈

| 层级 | 技术 | 用途 |
|------|------|------|
| **框架** | React 18 + TypeScript | UI 构建 |
| **构建** | Vite | 开发/打包 |
| **状态** | Zustand + Immer | 全局状态管理 |
| **样式** | Tailwind CSS + CSS Variables | 样式系统 |
| **画布** | React Konva | 座位圆桌渲染 |
| **动画** | Framer Motion | UI 动画 |
| **后端** | Supabase (Realtime) | 实时同步 |
| **测试** | Vitest + Testing Library | 单元/集成测试 |

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
