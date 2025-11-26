# 更新日志 (Changelog)

所有重要的项目变更都将记录在此文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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
  - 新增4个actions: `revealRoles()`, `hideRoles()`, `startGame()`, `autoAssignRoles()`
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
- **交互式夜间操作面板** (`NightActionPanel.tsx`): 为说书人提供引导式UI，快速执行各角色的夜间能力
- **4种交互类型支持**: 
  - `choose_player`: 选择单个玩家（如小恶魔杀人）
  - `choose_two_players`: 选择两个玩家（如占卜师查验）
  - `binary`: 二选一决策（如守鸦人选择新角色）
  - `confirm`: 确认类操作（如初夜信息）
- **角色配置扩展**: 为占卜师、僧侣、守鸦人、投毒者、小恶魔等角色添加了 `nightAction` 配置
- **自动日志记录**: 夜间操作会自动记录到系统消息中
- **集成到夜间队列**: 在 Night Order 旁显示 "🌙 执行夜间动作" 按钮

#### 📋 Structured Info Cards (结构化信息卡片)
- **4种卡片类型**: 
  - `role_info` (蓝色): 角色查验、身份信息
  - `ability` (紫色): 能力使用提示、技能说明
  - `hint` (琥珀色): 游戏提示、规则说明
  - `custom` (灰色): 自定义内容
- **卡片组件** (`InfoCard.tsx`): 支持标题、图标、颜色主题、可折叠长内容（>150字符自动折叠）
- **Store Action** (`sendInfoCard`): 便捷API发送结构化卡片给指定玩家或全体
- **Chat集成**: 自动检测 `message.card` 字段并渲染为卡片样式
- **类型标签**: 卡片底部显示类型名称（角色信息/能力提示/游戏提示/自定义）

#### 📊 Visual Voting History (可视化投票历史)
- **投票数据记录**: `closeVote` 时自动记录每轮投票数据到 `voteHistory`
- **VoteRecord类型**: 包含轮次、提名人、被提名人、投票者列表、结果（处决/存活/取消）、时间戳
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
- **AI模型扩展**: 新增 6 个 SiliconFlow 模型（DeepSeek R1 系列、MiniMax M2、Kimi K2 Thinking）
- **AI UI优化**: 
  - 模型选择器按类别分组（DeepSeek R1 / 其他高性能 / 官方/遗留）
  - `<think>` 标签内容以可折叠块显示
- **聊天管理**: 新增 "清空所有消息" 和 "删除单条消息" 功能
- **Control Panel**: 支持宽度调节，拖动边缘调整面板大小
- **Type System**: 扩展 `ChatMessage` 支持 `card` 字段，`GameState` 新增 `voteHistory` 字段

### 📦 依赖更新 (Dependencies)
- ➕ 新增 `recharts@^3.5.0` - 用于投票历史图表可视化

### 🐛 修复 (Fixed)
- 修复了可能的类型安全问题（`VoteRecord`、`InfoCard`、`NightActionDef` 类型定义）

### 📝 文档 (Documentation)
- 更新 `README.md` 包含 Phase 2-4 所有功能说明
- 创建 `STORYTELLER_MANUAL.md` - 说书人完整操作手册
- 创建 `USER_GUIDE.md` - 玩家和说书人快速上手指南
- 更新 `CHANGELOG.md` (本文件) 记录详细变更

---

## [0.2.0] - 2025-11-24

### ✨ 新增功能 (Added)
- **自定义剧本导入**: 支持上传 JSON 文件动态加载剧本和角色
- **AI 双模型集成**: 接入 DeepSeek V3 和 Kimi (Moonshot) 模型，提供更智能的规则咨询
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
