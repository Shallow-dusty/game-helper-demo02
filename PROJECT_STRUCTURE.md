# 项目结构说明 (Project Structure)

本文档详细说明了 `game-helper-demo02`
项目的目录结构和各个文件的作用，旨在帮助开发者快速理解项目架构。

## 📂 根目录结构

```
game-helper-demo02/
├── src/                    # 源代码目录
├── public/                 # 静态资源目录 (音频, 图标等)
├── supabase/               # Supabase 数据库配置和迁移文件
├── tests/                  # 测试文件目录
├── .env.local              # 本地环境变量配置 (不提交到 Git)
├── package.json            # 项目依赖和脚本配置
├── tsconfig.json           # TypeScript 配置文件
├── vite.config.ts          # Vite 构建配置文件
├── vitest.config.ts        # Vitest 测试配置文件
├── eslint.config.js        # ESLint 代码检查配置
├── index.html              # 应用入口 HTML 文件
├── README.md               # 项目主文档
├── CHANGELOG.md            # 变更日志
├── STORYTELLER_MANUAL.md   # 说书人手册
├── USER_GUIDE.md           # 用户指南
└── PROJECT_STRUCTURE.md    # 本文档
```

---

## 📂 源代码目录 (src/)

`src` 目录是项目的核心，包含了所有的前端逻辑和组件。

```
src/
├── assets/                 # 静态资源映射
│   └── audioMap.ts         # 音频路径常量和辅助函数
├── components/             # React 组件
│   ├── controls/           # 控制面板相关组件
│   ├── game/               # 游戏核心组件 (按功能分类)
│   │   ├── core/           # 核心视图 (Grimoire, TownSquare, PhaseIndicator)
│   │   ├── night/          # 夜晚阶段 (NightActionPanel, DoomsdayClock)
│   │   ├── player/         # 玩家相关 (RoleCard, ActiveAbilityButton)
│   │   ├── overlay/        # 视觉效果 (CandlelightOverlay, Confetti)
│   │   ├── voting/         # 投票组件 (VoteButton, VotingChart)
│   │   ├── modals/         # 模态框 (RoleRevealModal, SwapRequestModal)
│   │   └── index.ts        # Barrel export
│   ├── history/            # 历史记录组件
│   ├── lobby/              # 大厅组件
│   ├── settings/           # 设置组件 (AudioSettingsModal)
│   ├── sandbox/            # 沙盒模式组件
│   ├── script/             # 剧本相关组件
│   └── ui/                 # 通用 UI 组件
├── constants/              # 常量定义 (按功能模块化)
│   ├── audio.ts            # 音频配置
│   ├── gameConfig.ts       # 游戏配置
│   ├── nightOrder.ts       # 夜间行动顺序
│   ├── roles.ts            # 角色定义
│   ├── scripts.ts          # 剧本配置
│   ├── zIndex.ts           # Z-Index 层级
│   └── index.ts            # 统一导出
├── hooks/                  # 自定义 React Hooks
│   ├── useLongPress.ts     # 长按检测
│   ├── useNomination.ts    # 提名逻辑
│   ├── useSoundEffect.ts   # 音效管理
│   └── useGameInteractions.ts # 游戏交互记录
├── lib/                    # 核心逻辑库
│   ├── gameLogic.ts        # 游戏规则逻辑
│   ├── chainReaction.ts    # 连锁反应检测
│   ├── distributionAnalysis.ts # 角色分布分析
│   ├── infoGeneration.ts   # 信息生成
│   ├── reportGenerator.ts  # 复盘战报生成
│   ├── supabaseService.ts  # Supabase 服务层
│   └── utils.ts            # 通用工具函数
├── store/                  # 状态管理 (Zustand)
│   ├── slices/             # 状态切片
│   │   ├── ai.ts           # AI 助手状态 (新命名)
│   │   ├── ui.ts           # UI 状态 (新命名)
│   │   ├── connection.ts   # 连接与同步 (新命名)
│   │   ├── game.ts         # 游戏核心状态 (新命名)
│   │   ├── game/           # 游戏子切片
│   │   │   ├── core.ts     # 核心操作
│   │   │   ├── flow.ts     # 游戏流程
│   │   │   ├── roles.ts    # 角色分配
│   │   │   ├── chat.ts     # 聊天功能
│   │   │   ├── audio.ts    # 音频控制
│   │   │   └── ...
│   │   └── index.ts        # Barrel export
│   ├── types.ts            # Store 类型定义
│   ├── utils.ts            # Store 工具函数
│   └── aiConfig.ts         # AI 服务商配置
├── App.tsx                 # 根组件
├── store.ts                # Store 入口
├── types.ts                # 全局类型定义
└── index.css               # 全局样式
```

### 关键文件详解

#### 1. 状态管理 (`src/store/`)

本项目使用 **Zustand** + **Immer** 进行状态管理，并采用 **Slice 模式**
拆分逻辑。

- **`store.ts`**: 组合所有切片，创建全局 Store。
- **`slices/ai.ts`**: AI 助手状态 (原 `createAISlice.ts`)
- **`slices/ui.ts`**: UI 状态管理 (原 `createUISlice.ts`)
- **`slices/connection.ts`**: Supabase 连接与同步 (原
  `createConnectionSlice.ts`)
- **`slices/game.ts`**: 游戏核心状态 (原 `createGameSlice.ts`)

> 注意: 旧命名 (`createXSlice`) 仍保持向后兼容导出。

#### 2. 音频资源管理 (`src/assets/audioMap.ts`)

集中管理所有音频资源路径，避免硬编码：

- **`BGM_PATHS`**: 背景音乐路径常量
- **`SFX_PATHS`**: 音效路径常量
- **`getBgmForPhase()`**: 根据游戏阶段获取 BGM
- **`getVictoryBgm()`**: 获取胜利音乐
- **`getAvailableBgmList()`**: 获取可用 BGM 列表

#### 3. 核心组件 (`src/components/game/`)

按功能分类到子目录，通过 barrel export 统一导入：

```typescript
// 使用方式
import { Grimoire, NightActionPanel, RoleCard } from "./components/game";
```

- **`core/`**: Grimoire, TownSquare, PhaseIndicator 等核心视图
- **`night/`**: NightActionPanel, DoomsdayClock 等夜晚组件
- **`player/`**: RoleCard, ActiveAbilityButton 等玩家组件
- **`overlay/`**: CandlelightOverlay, Confetti 等视觉效果
- **`voting/`**: VoteButton, VotingChart 等投票组件
- **`modals/`**: RoleRevealModal, SwapRequestModal 等模态框

#### 4. 游戏逻辑 (`src/lib/`)

将纯粹的游戏规则计算从 Store 中剥离出来，便于测试和复用：

- `gameLogic.ts`: 角色分配、胜利判断、夜间队列
- `chainReaction.ts`: 连锁反应检测 (如祖母-孙子)
- `distributionAnalysis.ts`: 角色分布验证和规则检查
- `infoGeneration.ts`: 信息生成 (共情者、调查员等)
- `reportGenerator.ts`: 复盘战报生成

---

## 📂 数据库配置 (supabase/)

```
supabase/
├── config.toml              # Supabase 配置文件
├── functions/               # Edge Functions
│   └── ask-ai/             # AI 助手函数
├── migrations/              # 数据库迁移脚本
│   └── supabase_migration.sql
└── schema/                  # 数据库 Schema 定义
    ├── supabase_schema.sql         # 完整的表结构、RLS 策略、RPC 函数
    └── supabase_security_patch.sql # 安全补丁
```

关键表结构：

- **`game_rooms`**: 存储房间公共状态 (`gameState` JSON)，所有玩家可读。
- **`seat_secrets`**: 存储敏感数据 (真实角色 `realRoleId`,
  提醒标记)，仅说书人可读 (RLS)。
- **`game_messages`**: 存储聊天记录。

---

## 📂 静态资源 (public/)

```
public/
├── audio/                  # 音频文件
│   ├── sfx/                # 音效 (鼓点, 狼嚎等)
│   ├── day.mp3             # 白天背景乐
│   ├── night.mp3           # 夜晚背景乐
│   └── ...
└── ...
```

---

## 🛠️ 维护指南

### 添加新角色

1. 在 `src/constants.ts` 的 `ROLES` 对象中添加新角色定义。
2. 如果角色有夜间行动，在 `src/constants.ts` 的 `NIGHT_ORDER_*` 数组中添加其
   ID。
3. (可选) 在 `src/lib/gameLogic.ts` 中添加特定的逻辑处理（如果涉及特殊规则）。

### 修改数据库结构

1. 修改 `supabase/supabase_schema.sql`。
2. 在 Supabase Dashboard 的 SQL Editor 中执行更新语句。
3. 更新 `src/types.ts` 中的相关类型定义。

### 发布新版本

1. 更新 `package.json` 版本号。
2. 更新 `CHANGELOG.md`。
3. 更新 `README.md` 中的版本信息。
