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
├── components/             # React 组件
│   ├── Controls.tsx        # 主控制面板 (说书人/玩家操作)
│   ├── Grimoire.tsx        # 游戏魔典 (Konva 画布, 座位显示)
│   ├── Lobby.tsx           # 游戏大厅 (登录, 创建/加入房间)
│   ├── Chat.tsx            # 聊天组件
│   ├── ...                 # 其他 UI 组件
├── hooks/                  # 自定义 React Hooks
│   └── useLongPress.ts     # 长按检测 Hook
├── lib/                    # 核心逻辑库
│   ├── gameLogic.ts        # 纯游戏规则逻辑 (无状态)
│   └── utils.ts            # 通用工具函数
├── store/                  # 状态管理 (Zustand)
│   ├── store.ts            # Store 入口及类型定义
│   ├── slices/             # 状态切片
│   │   ├── createGameSlice.ts       # 游戏核心状态 (角色, 阶段, 投票)
│   │   ├── createConnectionSlice.ts # 连接与同步 (Supabase)
│   │   ├── createUISlice.ts         # UI 状态 (模态框, 侧边栏)
│   │   └── createAISlice.ts         # AI 助手状态
│   ├── utils.ts            # Store 内部工具 (数据过滤)
│   └── aiConfig.ts         # AI 服务商配置
├── App.tsx                 # 根组件 (路由与全局布局)
├── main.tsx                # 入口文件
├── constants.ts            # 全局常量 (角色定义, 音频配置, Z-Index)
├── types.ts                # TypeScript 类型定义
└── index.css               # 全局样式 (Tailwind 指令)
```

### 关键文件详解

#### 1. 状态管理 (`src/store/`)

本项目使用 **Zustand** + **Immer** 进行状态管理，并采用 **Slice 模式**
拆分逻辑。

- **`store.ts`**: 组合所有切片，创建全局 Store。
- **`createGameSlice.ts`**:
  最核心的切片，处理所有游戏规则（如分配角色、切换阶段、处理夜间行动）。
- **`createConnectionSlice.ts`**: 负责与 Supabase Realtime
  的交互，处理数据同步、心跳检测和房间管理。

#### 2. 核心组件 (`src/components/`)

- **`Grimoire.tsx`**: 游戏的核心界面。使用 `react-konva`
  绘制交互式魔典，支持拖拽、缩放和点击交互。
- **`Controls.tsx`**: 功能控制中心。包含多个 Tab (Game, Chat, AI,
  Audio)，根据用户角色（说书人/玩家）动态展示不同内容。

#### 3. 游戏逻辑 (`src/lib/gameLogic.ts`)

将纯粹的游戏规则计算从 Store 中剥离出来，便于测试和复用。包含：

- `generateRoleAssignment`: 角色随机分配算法
- `checkGameOver`: 胜利条件判断
- `buildNightQueue`: 夜间行动顺序构建

#### 4. 常量定义 (`src/constants.ts`)

存储了游戏中所有的静态数据：

- **`ROLES`**: 所有角色的详细定义（能力、阵营、图标）。
- **`SCRIPTS`**: 预设剧本配置（如 Trouble Brewing）。
- **`AUDIO_TRACKS`**: 音频文件路径映射。

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
