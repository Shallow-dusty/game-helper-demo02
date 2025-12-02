# 更新日志 (Changelog)

所有重要的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循
[语义化版本](https://semver.org/lang/zh-CN/)。

---

## [0.8.2] - 2025-12-02

### 🎨 视觉/音效特性完善 (Visual & Audio Features)

本版本修复了多个沉浸式视觉效果的实现缺失问题。

#### 🎰 物理审判 (Physics Judgment)

- **启用音效**: 取消注释 `playSound('chip_drop')`，筹码掉落时会触发音效
- **增强视觉**: 优化筹码边框颜色（存活玩家使用棕色边框 `#b45309`，死亡玩家使用深石色 `#44403c`）
- **新增音效定义**: 在 `FOLEY_SOUNDS` 中添加 `chip_drop` 音效

#### 🕯️ 烛光守夜 (Candlelight Night)

- **死亡座位音效**: 当烛光经过死亡玩家座位时触发 `ghost_whisper` 幽灵低语音效
- **新增 Props**: `CandlelightOverlay` 现在接受 `deadSeatPositions` 参数
- **距离检测**: 使用 80px 触发半径，离开 120px 后可再次触发
- **新增音效定义**: 在 `FOLEY_SOUNDS` 中添加 `ghost_whisper` 音效

#### 🩸 腐蚀蔓延 (Spreading Corruption)

- **创建专用组件**: 新建 `CorruptionOverlay.tsx` 替代 App.tsx 中的内联样式
- **SVG 噪点纹理**: 使用 `feTurbulence` filter 生成程序化噪点纹理
- **血脉效果**: Stage 2 时显示脉动的红色血脉斑点
- **边缘裂纹**: 使用 SVG 路径绘制角落裂纹装饰
- **音效触发**: Stage 2 激活时播放 `death_toll` 过渡音效

#### 💀 生命体征 (Living Tokens)

- **颜色修正**: 将死亡效果从红色主题 (`#dc2626`, `rgba(139,0,0)`) 改为灰烬色主题 (`#a8a29e`, `rgba(87,83,78)`)
- **影响组件**: 闪光遮罩、脉冲波纹、骷髅图标、玩家名称、边缘渐变全部采用 Stone 色调

### 📦 文件变更

**新增文件**:
- `src/components/game/CorruptionOverlay.tsx` - 腐蚀蔓延独立组件

**修改文件**:
- `src/components/game/JudgmentZone.tsx` - 启用音效和导入
- `src/components/game/CandlelightOverlay.tsx` - 添加死亡座位检测逻辑
- `src/components/game/DeathEchoEffect.tsx` - 颜色主题更改
- `src/components/game/Grimoire.tsx` - 传递死亡座位位置到 CandlelightOverlay
- `src/components/game/overlay/index.ts` - 导出 CorruptionOverlay
- `src/hooks/useSoundEffect.ts` - 新增 chip_drop 和 ghost_whisper 音效
- `src/App.tsx` - 使用 CorruptionOverlay 组件

---

## [0.8.1] - 2025-12-02

### 🏗️ 代码结构优化 (Code Structure)

本版本重点优化了项目代码结构，提高可维护性和开发体验。

#### 📁 组件目录重构

将 `src/components/game/` 目录按功能分类到子目录：

- **`core/`**: 核心游戏视图 (Grimoire, TownSquare, PhaseIndicator 等)
- **`night/`**: 夜晚阶段组件 (NightActionPanel, DoomsdayClock 等)
- **`player/`**: 玩家相关组件 (RoleCard, ActiveAbilityButton)
- **`overlay/`**: 视觉效果组件 (CandlelightOverlay, Confetti 等)
- **`voting/`**: 投票组件 (VoteButton, VotingChart, FloatingVoteButton)
- **`modals/`**: 模态框组件 (RoleRevealModal, SwapRequestModal 等)

添加 barrel exports (`index.ts`)，简化导入：
```typescript
// 之前
import { Grimoire } from './components/game/Grimoire';
import { RoleCard } from './components/game/RoleCard';

// 之后
import { Grimoire, RoleCard } from './components/game';
```

#### 🏪 Store Slices 重命名

采用更简洁的命名规范，同时保持向后兼容：

| 旧命名 | 新命名 | 导出 |
|--------|--------|------|
| `createAISlice.ts` | `ai.ts` | `aiSlice` |
| `createUISlice.ts` | `ui.ts` | `uiSlice` |
| `createConnectionSlice.ts` | `connection.ts` | `connectionSlice` |
| `createGameSlice.ts` | `game.ts` | `gameSlice` |

添加 `slices/index.ts` barrel export，旧命名仍可使用。

#### 🎵 音频路径集中管理

创建 `src/assets/audioMap.ts`：

- **常量**: `BGM_PATHS`, `SFX_PATHS` 集中管理音频路径
- **辅助函数**: 
  - `getBgmForPhase()` - 根据游戏阶段获取 BGM
  - `getVictoryBgm()` - 获取胜利音乐
  - `getSfxPath()` - 获取音效路径
  - `getAvailableBgmList()` - 获取可用 BGM 列表

### 🐛 Bug 修复 (Bug Fixes)

#### 酒鬼假角色重复问题

- **问题**: 酒鬼/疑子/魔偶分配的假角色可能与其他已分配角色重复
- **修复**: `pickTownsfolk()` 现在使用 Set 收集所有已使用角色（包括 `realRoleId` 和 `seenRoleId`）
- **文件**: `src/store/slices/game/utils.ts`

#### 规则面板显示问题

- **问题**: 说书人在规则界面看不到酒鬼等"表里不一"角色
- **修复**: 添加规则 10 "MISLED_ROLES" 检测酒鬼/疑子/魔偶
- **文件**: `src/lib/distributionAnalysis.ts`

### 🧪 测试改进 (Testing)

#### 测试覆盖率提升

新增测试文件和测试用例：
- `src/store/slices/game/core.test.ts` (15 tests)
- `src/store/slices/game/audio.test.ts` (14 tests)
- `src/store/slices/game/chat.test.ts` (13 tests)
- 扩展 `supabaseService.test.ts` (+25 tests)
- 扩展 `useSoundEffect.test.ts` (+13 tests)

#### 测试基础设施

- 创建 `tests/factories.ts` - 测试数据工厂函数
- 创建 `tests/utils.tsx` - 自定义渲染工具

#### 测试类型修复

修复多个测试文件中的 TypeScript 类型错误：
- `useGameInteractions.test.ts` - InteractionLog 类型匹配
- `useLongPress.test.ts` - 可选链操作符
- `chainReaction.test.ts` - GameState 完整字段
- `infoGeneration.test.ts` - GameState 完整字段
- `reportGenerator.test.ts` - GameState 完整字段

### ✅ 测试状态

- 312/312 单元测试全部通过
- TypeScript 编译无错误
- 构建验证通过

---

## [0.8.0] - 2025-11-28

### 🐛 Bug 修复 (Bug Fixes)

本版本修复了 v0.7.5 架构优化后发现的多个关键问题。

#### 🔴 崩溃修复 (Crash Fixes)

- **AudioManager 内存泄漏**:
  - 添加 `timeoutRef` 跟踪 `setTimeout`
  - 在 `useEffect` 清理时正确取消定时器，防止组件卸载后回调执行导致崩溃

- **FloatingVoteButton 类型错误**:
  - 修复 `user?.odId` 拼写错误为 `user?.id`
  - 修复 `voting?.isActive` 错误属性为 `voting?.isOpen`

- **ControlsSTSection nightQueue 类型错误**:
  - 使用 IIFE 正确处理 `nightQueue` 数组索引的 `undefined` 可能性
  - 修复 TypeScript 严格模式下的类型推断问题

- **gameLogic.ts 返回类型**:
  - 修复 `getSetupRules` 函数可能返回 `undefined` 的问题
  - 添加空值合并保护

#### 🎨 Z-Index 层级修复 (Z-Index Fixes)

- **RoleReferenceSidebar**:
  - 将面板 z-index 从 `Z_INDEX.overlay` (20) 改为 `Z_INDEX.sidebar` (40)
  - 与切换按钮层级一致，解决层级冲突

- **Grimoire Context Menu**:
  - 将硬编码的 `z-50` 改为使用 `Z_INDEX.modal` 常量
  - 统一 z-index 管理

#### 📱 移动端适配修复 (Mobile Fixes)

- **SandboxView 座位大小**:
  - 座位大小从固定的 `w-16 h-16` 改为响应式的 `w-14 h-14 md:w-16 md:h-16`
  - 添加 `active:scale-95` 触摸反馈

#### 🧹 代码清理 (Code Cleanup)

- **App.tsx**:
  - 移除未使用的 `React` 和 `NotificationSystem` 导入
  - 修复 `useEffect` 未显式返回 `undefined` 的 lint 警告
  - 使用类型谓词过滤确保 `scriptRoles` 返回正确类型

- **ControlsSTSection.tsx**:
  - 移除未使用的 `PHASE_LABELS` 导入
  - 添加音轨名称空值保护 (`?.name || '未知音轨'`)

#### 🗑️ 项目清理 (Project Cleanup)

- **文件移除**:
  - 删除冗余日志文件: `ai_test_log.txt`, `lint_output.txt`
  - 删除过时文档: `CODEBASE_REVIEW.md`, `OPTIMIZATION_CHECKLIST.md`,
    `PROJECT_REVIEW_REPORT.md`
  - 删除未使用的工具脚本: `scrape_audio.py` 及 `downloaded_audio/` 目录
  - 删除旧版补丁: `supabase_v0.7.3_patch.sql`

#### 🔐 安全审查 (Security Review)

- **关键发现**: 确认了客户端数据同步存在的安全隐患（全量 GameState 同步）。
- **建议方案**: 建议实施 Supabase Edge Function 中转或 RLS
  策略升级以实现服务端数据过滤。

### ✅ 测试状态

- 25/25 单元测试全部通过
- 构建验证通过

---

## [0.7.5] - 2025-11-28

### 🏗️ 架构优化与新功能 (Architecture Optimization & New Features)

本版本进行了全面的代码架构优化，包括基础设施升级、组件拆分、性能优化和新功能添加。

#### 🔧 基础设施升级 (Infrastructure)

- **ESLint 9 + TypeScript 严格模式**:
  - 添加 `eslint.config.js` 使用 flat config
  - 启用 `@typescript-eslint/recommended-type-checked` 规则
  - `tsconfig.json` 启用 `strict: true`

- **Vitest 测试框架**:
  - 添加 `vitest.config.ts` 配置
  - 创建 `tests/store.test.ts` 包含 25 个单元测试
  - 覆盖用户管理、游戏状态、阶段管理、角色分配、座位管理、死亡投票、聊天、虚拟玩家、状态提醒等

- **Husky + lint-staged**:
  - Git pre-commit hooks 自动检查
  - 提交前自动运行 ESLint

- **immer 中间件集成**:
  - `store.ts` 集成 Zustand immer 中间件
  - 支持不可变状态更新

#### 🧩 组件拆分 (Component Extraction)

- **ActiveAbilityButton.tsx**: 从 Controls.tsx 提取主动技能按钮组件
- **VoteButton.tsx**: 提取投票按钮组件（含加载状态和锁定处理）
- **ControlsGameTab.tsx**: 说书人游戏控制选项卡
- **ControlsAITab.tsx**: AI 助手聊天选项卡
- **hooks/useLongPress.ts**: 从 Grimoire.tsx 提取长按检测 Hook

#### ⚡ 性能优化 (Performance)

- **Konva 图层分离**:
  - `Grimoire.tsx` 分离装饰层和交互层
  - 装饰层设置 `listening={false}` 减少事件处理开销

#### ✨ 新功能 (New Features)

- **🧪 沙盒模式 (Sandbox Mode)**:
  - 新增 `sandboxStore.ts` 独立本地状态管理
  - 新增 `SandboxView.tsx` 沙盒模式视图
  - `RoomSelection.tsx` 添加沙盒模式入口
  - 完全离线运行，无需 Supabase 连接
  - 适合学习规则、测试剧本配置、熟悉说书人操作

- **🔊 AudioEnableOverlay.tsx**: 浏览器音频激活引导覆盖层

- **🔗 VoiceRoomLink.tsx**: 外部语音房间链接管理组件
  - `types.ts` 添加 `voiceRoomUrl` 字段

#### 📦 新增依赖 (New Dependencies)

- `immer@11.0.1` - 不可变状态更新
- `react-window@2.2.3` - 虚拟滚动（待集成）
- `eslint@9.39.1` - 代码检查
- `@typescript-eslint/eslint-plugin@8.48.0` - TS ESLint 插件
- `vitest@4.0.14` - 测试框架
- `husky@9.1.7` - Git hooks
- `lint-staged@16.2.7` - 提交前检查

---

## [0.7.4] - 2025-11-27

### 🔍 全面代码审查 (Comprehensive Code Review)

本版本完成了对整个代码库的最终全面审查，覆盖 26 个源文件、4 个文档文件和 3 个
SQL 文件。

#### 🔴 严重修复 (Critical Fixes)

- **VotingChart.tsx 类型错误**: 修复 `votes` 字段类型不匹配问题
  - `votes` 定义为 `number[]`（投票者座位ID数组）
  - 代码中错误使用 `Object.keys()` 和 `Object.entries()`
  - 已修正为正确的数组操作 `.length` 和 `.map()`

#### ✅ 验证通过 (Verified)

- **constants.ts 夜间顺序**: 经脚本验证，所有角色ID均已正确定义
- **NightActionPayload 类型**: 已在 types.ts 中完整定义
- **roleId 弃用标记**: `@deprecated` JSDoc 注释已添加

#### 📝 文档更新 (Documentation)

- **OPTIMIZATION_CHECKLIST.md**:
  - 更新至 v0.7.4 审查结果
  - 新增 SQL 文件审查结论
  - 扩展优化建议至 18 项
  - 添加移动端优化建议

#### ⚠️ 已识别待处理 (Identified for Future)

- `store.ts` joinSeat 竞态条件风险（模块级锁变量）
- `Grimoire.tsx` 长按与双指缩放可能冲突
- `AudioManager.tsx` play promise 取消逻辑
- `Controls.tsx` 700+ 行代码待拆分

---

## [0.7.3] - 2025-11-27

### 🐛 座位系统关键修复 (Seat System Critical Fix)

#### 🔴 严重修复 (Critical Fixes)

- **座位占用失败**: 修复 SQL RPC 使用 `player` 字段但前端使用
  `userId`/`userName` 的数据结构不匹配问题
- **黑屏问题**: 修复进入游戏时 seats 数组无效导致的黑屏问题
- **座位弹出问题**: 添加互斥锁防止重复点击座位导致的竞态条件

#### ✨ 改进 (Improvements)

- **WaitingArea 组件**:
  - 添加 `seats` 数组有效性检查
  - 添加加入座位时的加载状态 (joiningId)
  - 防止重复点击导致的并发请求
  - 显示 "JOINING..." 状态指示

- **Grimoire 组件**:
  - 添加 seats 数组无效时的友好提示界面
  - 防止空 seats 导致的渲染崩溃

- **joinSeat 函数 (store.ts)**:
  - 添加 `_isJoiningSeat` 互斥锁
  - 失败时调用 `refreshFromCloud()` 重新同步状态
  - 增强错误处理和用户反馈

#### 📦 SQL 更新 (Database Schema)

- **claim_seat RPC**:
  - 新增 `p_user_id` 参数
  - 使用 `userId`/`userName` 替代 `player` 字段
  - 添加重复座位检测（同一用户不能占多个座位）
  - 保留现有座位属性（不覆盖 roleId 等）

- **leave_seat RPC**:
  - 正确清空 `userId`/`userName` 字段
  - 保留座位其他属性

⚠️ **重要**: 需要在 Supabase 中执行 `supabase_migration.sql` 或
`supabase_schema.sql` 以更新函数

---

## [0.7.2] - 2025-11-27

### 🎵 音效系统重构 (Audio System)

#### 🐛 修复 (Fixed)

- **音频资源 403 错误**: 替换失效的 Pixabay CDN 链接为可靠的 Mixkit 免费音源
- **音频加载错误处理**: 添加完整的错误监听和用户友好的错误提示

#### ✨ 新增 (Added)

- **阶段自动音乐切换**: 切换游戏阶段时自动播放对应的背景音乐
  - SETUP → 神秘大厅
  - DAY → 热闘讨论
  - NIGHT → 静谧夜晚
  - NOMINATION → 提名阶段
  - VOTING → 紧张投票
- **胜利音乐**: 游戏结束时自动播放对应阵营的胜利音乐
  - 好人胜利 → 欢快音乐
  - 邪恶胜利 → 神秘音乐
- **增强的音频控制面板**:
  - 显示当前播放状态指示器
  - 分组显示阶段音乐和特殊音乐
  - 音量滑块带视觉指示

#### 🔧 改进 (Changed)

- **AUDIO_TRACKS 结构**: 新增 `phase` 字段标识阶段关联
- **PHASE_AUDIO_MAP**: 新增阶段到音轨的映射常量
- **AudioManager 组件**: 增强错误处理、添加 crossOrigin 支持

### 📦 技术细节 (Technical)

- 新增 `PHASE_AUDIO_MAP` 常量 (`constants.ts`)
- `setPhase()` 函数自动切换音轨
- `toggleDead()` 函数在游戏结束时播放胜利音乐

---

## [0.7.1] - 2025-11-27

### 🔍 代码审查 (Code Review)

本版本完成了全面的代码审查，识别并记录了以下问题：

#### 已识别问题 (Identified Issues)

**安全性与健壮性**:

- `VotingChart.tsx`: 座位查找可能返回 undefined，已使用可选链 (`?.`) 保护
- `NightActionManager.tsx`: 酒鬼/疯子检测逻辑需要非空检查
- `store.ts`: `NightActionRequest.payload` 类型为 `any`，建议定义具体类型

**内存管理**:

- `Chat.tsx`: `visualViewport` 事件监听器清理逻辑已正确实现
- `Grimoire.tsx`: `useLongPress` Hook 的 timeout 清理已正确实现

**代码质量**:

- `constants.ts`: `NIGHT_ORDER_FIRST/OTHER` 包含未定义的角色ID
- `types.ts`: `roleId` 字段标记为已弃用但仍在使用
- `Controls.tsx`: 700+ 行代码，建议拆分

### 📝 文档更新 (Documentation)

- 更新 `README.md` 版本号和功能描述
- 更新 `USER_GUIDE.md` 添加最新功能说明
- 更新 `STORYTELLER_MANUAL.md` 完善操作指南
- 生成完整优化建议清单

### 📦 技术细节 (Technical)

- **审查范围**: 26个源文件 + 4个文档文件
- **总代码行数**: 约 15,000+ 行
- **组件数量**: 24个 React 组件
- **类型定义**: 完整的 TypeScript 类型覆盖

---

## [0.7.0] - 2025-01-15

### ✨ 新增 (Added)

#### 🔐 安全架构重构 (P0)

- **双重身份系统**:
  - 新增 `realRoleId` (真实身份，仅ST可见) 和 `seenRoleId`
    (展示身份，玩家看到的)
  - 支持酒鬼/疯子/魔偶等特殊角色的身份错位
  - 向后兼容旧版 `roleId` 字段
- **seat_secrets 表**: 存储敏感信息（真实角色、中毒状态等），仅ST可访问
- **原子入座 RPC**: `claim_seat()` 函数确保并发安全，防止座位抢占
- **game_messages 表**: 独立消息表支持私聊过滤和审计

#### 📝 角色详细描述 (P0)

- **Bad Moon Rising**: 为所有25个角色添加 `detailedDescription`
- **Sects & Violets**: 为所有25个角色添加 `detailedDescription`
- 包含官方完整规则说明、中文翻译和特殊交互提示

#### 🎮 玩家技能交互 (P2)

- **主动技能按钮**:
  - 杀手 (Slayer): 选择目标发动技能
  - 处女 (Virgin): 声明身份
  - 艺术家 (Artist): 向ST提问
  - 杂耍艺人 (Juggler): 猜测角色
  - 造谣者 (Gossip): 发表公开陈述
- **技能使用追踪**: `hasUsedAbility` 字段防止重复使用
- **目标选择模态框**: 需要目标的技能支持输入目标名称

#### 📱 移动端优化 (P2)

- **长按上下文菜单**: 说书人长按座位500ms弹出操作菜单
- **触觉反馈**: 长按时触发振动反馈 (navigator.vibrate)
- **锁定状态优化**: 移动端锁定按钮文案更新

#### 🔄 连接状态指示 (P2)

- **ConnectionStatus 类型**: 'connecting' | 'connected' | 'reconnecting' |
  'disconnected'
- **PhaseIndicator 集成**: 顶部显示实时连接状态
- **视觉反馈**: 不同状态对应不同颜色（绿/黄/红）和脉冲动画

### 🔧 改进 (Changed)

- **PhaseIndicator 增强**:
  - 显示第X夜/第X天信息
  - 投票状态详情（提名人→被提名人）
  - 连接状态徽章

- **依赖更新**:
  - React 19.2.0 → 18.3.1 (稳定性提升)
  - react-dom 19.2.0 → 18.3.1
  - react-konva 19.0.3 → 18.2.10

### 📦 技术细节 (Technical)

- **types.ts**:
  - Seat: 新增 `realRoleId`, `seenRoleId`, `hasUsedAbility` 字段
  - RoleDef: 新增 `detailedDescription` 可选字段

- **store.ts**:
  - 新增 `connectionStatus` 状态和管理
  - `assignRole()` 增强支持 drunk/lunatic/marionette 逻辑
  - `filterGameStateForUser()` 支持双重身份过滤

- **supabase_schema.sql**:
  - 新增 `seat_secrets` 表
  - 新增 `game_messages` 表
  - 新增 `claim_seat()` 和 `leave_seat()` RPC 函数
  - 完整 RLS 策略

- **新增组件**:
  - `ActiveAbilityButton` (Controls.tsx内)
  - `ConnectionStatusBadge` (PhaseIndicator.tsx内)
  - `useLongPress` Hook (Grimoire.tsx内)

---

## [0.6.2] - 2025-11-27

### 🐛 修复 (Fixed)

**右键菜单子菜单显示问题**:

- 修复状态和标记按键hover无反应的问题
- 使用 `opacity + pointer-events` 替代 `hidden + group-hover:flex`
- 添加平滑过渡动画

**虚拟玩家保护**:

- 修复真实玩家点击虚拟玩家座位时静默覆盖的问题
- 添加接管提示："接管了虚拟玩家的座位"
- 真实玩家座位被保护，显示占用提示

### 🎨 优化 (Improved)

**板子参考UI优化**:

- 默认仅显示简要信息（策略名、难度、配比）
- 详细tips和生成按钮仅在选中策略后显示
- 界面更简洁易读

**游戏规则显示优化**:

- 移除header小按钮，改为Game Tab顶部大面板
- 使用金色渐变背景和双层边框
- 大图标📖和双行文字提示
- 折叠/展开显示快速参考

### ✅ 验证 (Verified)

**权限安全检查**:

- 审查所有说书人专属功能权限包裹
- 确认无权限泄露问题

---

## [0.6.1] - 2025-11-27

### 🐛 修复 (Fixed)

**夜间执行Bug**:

- 修复夜间行动面板完成后未自动推进到下一个角色的问题
- 在 `Controls.tsx` 的 `NightActionPanel` 完成回调中添加 `nightNext()` 调用

### ✨ 新增 (Added)

**描述切换按钮**:

- 在玩家角色卡片添加"详细/简略"切换按钮
- 支持查看官方完整描述或简短概要

**折叠式游戏规则面板**:

- 在游戏Tab顶部添加可展开/折叠的游戏规则摘要
- 提供基础规则和投票规则快速参考

### 🎨 优化 (Improved)

**板子参考功能增强**:

- 添加"生成具体配置"按钮
- 点击后展开显示随机生成的具体角色列表
- 根据策略优先选择推荐角色

### 🗑️ 移除 (Removed)

**旧版ScriptReference**:

- 移除旧的板子参考组件和相关导入
- 统一使用新的 `ScriptCompositionGuide`

---

## [0.6.0] - 2025-11-27

### ✨ 新增 (Added)

#### 📊 说书人板子参考系统

- **ScriptCompositionGuide 组件**: 提供基于玩家人数的配比建议
  - 自动显示标准配比 (镇民/外来者/爪牙/恶魔)
  - 4种配置策略：
    - 🔄 平衡打法 - 40-50%信息角色，适合常规游戏
    - ⚔️ 邪恶优势 - 减少首夜信息，适合经验玩家
    - ✨ 好人优势 - 增加信息角色，适合新手或熟人局
    - 🌀 混乱模式 - 信息过载+下毒，高不确定性
  - 角色强度分级参考 (Strong/Medium-Strong/Medium)
  - 说书人建议和技巧提示

#### 📱 UI/UX改进

- **移动端防误触**: Grimoire中新增锁定/解锁按钮 (🔒/🔓)
  - 锁定状态下禁用所有点击事件
  - 防止移动端误触操作

#### 🎮 游戏逻辑优化

- **虚拟玩家支持**: 虚拟玩家现在可以被自动分配角色
  - 修复 `assignRoles` 逻辑，正确统计虚拟玩家
  - 虚拟玩家享受与真实玩家相同的角色分配流程

### 🐛 修复 (Fixed)

#### UI Bug修复

- **右键菜单显示**: 修复Grimoire右键菜单底部被截断问题
  - 增加菜单高度估计从320px到480px
  - 优化定位逻辑，添加顶部和底部安全间距
- **标记功能**: 修复标记子菜单无法触发的hover问题
  - 优化CSS类名，确保 `group-hover:flex` 正常工作
  - 添加 `z-50` 确保子菜单在最上层

#### 核心功能修复

- **角色发放验证**: 添加验证逻辑，未完全分配角色时无法发放
  - 检查所有占用座位（含虚拟玩家）的角色分配状态
  - 未完成时显示错误提示，列出未分配座位号
- **GameRules组件**: 修复JSX结构，添加缺失的closing div

---

## [0.5.0] - 2025-11-27

## [0.5.0] - 2025-11-27

### ✨ 新增 (Added)

#### 🎨 UI/UX 全面优化

- **界面中文化**: 核心组件 (`Controls`, `Lobby`, `Grimoire`)
  全面汉化，统一游戏术语。
- **全局通知系统**:
  - 角色出局提示 (☠️)
  - 技能使用反馈 (🚫)
  - 系统消息弹窗 (📢)
- **技能描述切换**: 游戏设置中新增 "简单/详细模式" 切换，支持查看完整技能文本。
- **说书人指引**: 新增帮助模态框，提供操作指南和快捷键说明。

#### 🛠️ 说书人工具增强

- **说书人笔记本**: 专属笔记记录功能，支持增删改查。
- **虚拟玩家系统**: 支持添加虚拟玩家填补空位，方便测试和非满员局。
- **等待区域 (WaitingArea)**: 优化未入座玩家体验，提供全屏选座界面。

#### 📊 状态与反馈

- **轮次追踪**: PhaseIndicator 集成详细轮次信息（第几夜/天，提名次数）。
- **视觉优化**:
  - 优化 Grimoire 右键菜单位置和样式。
  - 修复长用户名显示问题（截断+Tooltip）。
  - 优化 PhaseIndicator 层级，防止遮挡。

### 🐛 修复 (Fixed)

- **音效系统**: 修复浏览器自动播放策略导致的音效阻塞问题，添加自动重试逻辑。
- **Controls 组件**: 修复 JSX 结构错误和重复渲染问题。
- **类型定义**: 修复 `skillDescriptionMode` 类型不匹配问题。

---

## [0.4.0] - 2025-11-27

### ✨ 新增 (Added)

#### 🎭 游戏流程优化系统

- **阶段指示器 (PhaseIndicator)**:
  - 顶部Banner组件实时显示当前游戏阶段
  - 准备阶段: "🎭 正在分配角色..." / "✅ 角色已发放"
  - 游戏阶段: "🌙 夜间阶段" / "☀️ 白天阶段" / "📊 投票中"
  - 游戏结束: "🎉 好人胜利！" / "💀 邪恶胜利！"
  - 响应式颜色主题（琥珀/绿/蓝/黄/红）

- **智能角色分配系统**:
  - 🎲 一键自动分配（基于TB官方规则，支持5-15人）
  - 自动角色组成算法：镇民+外来者+爪牙+恶魔
  - 系统消息反馈分配结果
  - 分配前后可随时调整角色

- **角色发放机制**:
  - ✅ 统一发放：说书人点击"发放角色"后玩家可查看规则手册
  - 🔙 收回功能：发放前可随时收回重新调整
  - rolesRevealed状态控制玩家可见性
  - 三阶段流程: ASSIGNING（分配中）→ READY（已发放）→ STARTED（游戏中）

- **游戏开始简化**:
  - 🎮 一键开始游戏按钮（带动画效果）
  - 自动从READY过渡到STARTED
  - 自动进入首夜阶段
  - 系统消息提示游戏开始

### 🐛 修复 (Fixed)

- **角色卡片显示 Bug**:
  - 修复82个角色ability字段不显示的问题
  - 统一constants.ts和types.ts字段名(description → ability)
  - 修复RoleCard.tsx和Controls.tsx类型错误
  - 修复RoleCard.tsx的otherNights字段名(改为otherNight)
  - 修复Tailwind动态类名问题（使用完整类名映射）

### 🔧 改进 (Changed)

- **说书人控制面板**:
  - 新增"🎭 游戏设置"区域
  - 集成自动分配、发放、开始游戏三大按钮
  - 按钮根据setupPhase状态动态显示
  - 改进视觉反馈（脉冲动画、颜色编码）

- **玩家体验**:
  - 清晰的阶段提示（等待/准备/游戏中）
  - 发放后可自由查看规则手册
  - 实时同步游戏状态变化

### 📦 技术细节 (Technical)

- **types.ts**:
  - 新增 `SetupPhase` 类型: 'ASSIGNING' | 'READY' | 'STARTED'
  - GameState扩展: `setupPhase`, `rolesRevealed` 字段
  - GamePhase扩展: 'SETUP' | 'DAY' | 'NIGHT' | 'VOTE' | 'END'

- **store.ts**:
  - 新增4个actions: `revealRoles()`, `hideRoles()`, `startGame()`,
    `autoAssignRoles()`
  - 添加TB规则配置表(5-15人组成)
  - 添加shuffle工具函数
  - 更新getInitialState初始化逻辑

- **新增组件**:
  - `PhaseIndicator.tsx` - 阶段指示器组件(67行)

- **修改组件**:
  - `App.tsx` - 集成PhaseIndicator
  - `Controls.tsx` - 添加游戏设置面板(+34行)
  - `RoleCard.tsx` - 修复Tailwind类名和字段名

---

## [0.3.0] - 2025-11-26

### ✨ 新增功能 (Added)

#### 🌙 Smart Night Helper (智能夜间助手)

- **交互式夜间操作面板** (`NightActionPanel.tsx`):
  为说书人提供引导式UI，快速执行各角色的夜间能力
- **4种交互类型支持**:
  - `choose_player`: 选择单个玩家（如小恶魔杀人）
  - `choose_two_players`: 选择两个玩家（如占卜师查验）
  - `binary`: 二选一决策（如守鸦人选择新角色）
  - `confirm`: 确认类操作（如初夜信息）
- **角色配置扩展**: 为占卜师、僧侣、守鸦人、投毒者、小恶魔等角色添加了
  `nightAction` 配置
- **自动日志记录**: 夜间操作会自动记录到系统消息中
- **集成到夜间队列**: 在 Night Order 旁显示 "🌙 执行夜间动作" 按钮

#### 📋 Structured Info Cards (结构化信息卡片)

- **4种卡片类型**:
  - `role_info` (蓝色): 角色查验、身份信息
  - `ability` (紫色): 能力使用提示、技能说明
  - `hint` (琥珀色): 游戏提示、规则说明
  - `custom` (灰色): 自定义内容
- **卡片组件** (`InfoCard.tsx`):
  支持标题、图标、颜色主题、可折叠长内容（>150字符自动折叠）
- **Store Action** (`sendInfoCard`): 便捷API发送结构化卡片给指定玩家或全体
- **Chat集成**: 自动检测 `message.card` 字段并渲染为卡片样式
- **类型标签**: 卡片底部显示类型名称（角色信息/能力提示/游戏提示/自定义）

#### 📊 Visual Voting History (可视化投票历史)

- **投票数据记录**: `closeVote` 时自动记录每轮投票数据到 `voteHistory`
- **VoteRecord类型**:
  包含轮次、提名人、被提名人、投票者列表、结果（处决/存活/取消）、时间戳
- **Recharts图表组件** (`VotingChart.tsx`):
  - 折线图展示投票数趋势
  - 详细表格列出每轮数据
  - 颜色编码结果（红色=处决，绿色=存活，灰色=取消）
- **HistoryViewer集成**: 新增 "Voting History" 标签页查看当前游戏的投票历史

#### 📚 角色规则手册 (Phase 4)

- **RoleCard组件**: 展示角色能力、夜间顺序、阵营信息
- **RoleReferencePanel**: 模态面板模式，Hero Card高亮玩家角色
- **RoleReferenceSidebar**: 可选侧边栏模式（桌面端）
- **双模式切换**: 支持modal/sidebar切换
- **完整规则查阅**: 所有角色信息一目了然

### 🔧 改进 (Changed)

- **AI模型扩展**: 新增 6 个 SiliconFlow 模型（DeepSeek R1 系列、MiniMax M2、Kimi
  K2 Thinking）
- **AI UI优化**:
  - 模型选择器按类别分组（DeepSeek R1 / 其他高性能 / 官方/遗留）
  - `<think>` 标签内容以可折叠块显示
- **聊天管理**: 新增 "清空所有消息" 和 "删除单条消息" 功能
- **Control Panel**: 支持宽度调节，拖动边缘调整面板大小
- **Type System**: 扩展 `ChatMessage` 支持 `card` 字段，`GameState` 新增
  `voteHistory` 字段

### 📦 依赖更新 (Dependencies)

- ➕ 新增 `recharts@^3.5.0` - 用于投票历史图表可视化

### 🐛 修复 (Fixed)

- 修复了可能的类型安全问题（`VoteRecord`、`InfoCard`、`NightActionDef`
  类型定义）

### 📝 文档 (Documentation)

- 更新 `README.md` 包含 Phase 2-4 所有功能说明
- 创建 `STORYTELLER_MANUAL.md` - 说书人完整操作手册
- 创建 `USER_GUIDE.md` - 玩家和说书人快速上手指南
- 更新 `CHANGELOG.md` (本文件) 记录详细变更

---

## [0.2.0] - 2025-11-24

### ✨ 新增功能 (Added)

- **自定义剧本导入**: 支持上传 JSON 文件动态加载剧本和角色
- **AI 双模型集成**: 接入 DeepSeek V3 和 Kimi (Moonshot)
  模型，提供更智能的规则咨询
- **AI 切换器**: 在 UI 中添加了切换 AI 服务商的下拉菜单

### 🐛 修复 (Fixed)

- **移动端布局**: 修复了手机端"加入房间"和"大厅"页面无法滚动的问题
- **React Hooks**: 修复了 `Controls.tsx` 中因条件渲染导致的 Hook 调用错误

### ♻️ 重构 (Refactor)

- **后端迁移**: 从 LeanCloud 迁移至 Supabase，提升了国内访问速度和稳定性
- **AI SDK**: 移除 Google GenAI SDK，统一使用 OpenAI SDK 适配多模型

---

## [0.1.0] - 2025-11-20 (Initial Release)

### ✨ 新增功能 (Added)

- **基础魔典功能**: 座位管理、角色分配、状态标记（中毒/喝醉/死亡/幽灵票）
- **投票系统**: 完整的提名与投票流程，支持举手发言
- **实时同步**: 基于 LeanCloud Realtime 的多人同步
- **氛围音效**: 自动化音效播放器，支持白天/夜晚/投票/结束音效
- **移动端适配**: 响应式布局，支持手机和平板操作
- **Trouble Brewing 剧本**: 内置基础剧本

---

## 版本说明

### 版本号规则

- **Major (X.0.0)**: 重大架构调整或不兼容更新
- **Minor (0.X.0)**: 新增功能或重要改进
- **Patch (0.0.X)**: Bug 修复和小优化

### 变更类型

- `Added`: 新增功能
- `Changed`: 现有功能改进
- `Deprecated`: 即将废弃的功能
- `Removed`: 已移除功能
- `Fixed`: Bug 修复
- `Security`: 安全漏洞修复
