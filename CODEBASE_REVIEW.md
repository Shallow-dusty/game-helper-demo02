# 全面代码评测与审查报告

> [!NOTE]
> 本报告基于对项目代码库的静态分析，旨在识别架构、规范、性能和可扩展性方面的问题，并提供具体的优化建议。

## 1. 总体评分概览

| 模块                     | 评分 (1-10) | 简评                                                                  |
| :----------------------- | :---------: | :-------------------------------------------------------------------- |
| **核心状态 (Store)**     |   **6.5**   | 功能完整但过于臃肿 (Monolithic)，违反单一职责原则，难以维护。         |
| **UI 组件 (Components)** |   **8.5**   | 视觉效果出色，交互丰富，使用现代技术栈 (Tailwind, Framer Motion)。    |
| **业务逻辑 (Logic)**     |   **7.0**   | 逻辑分散在 Store 和组件中，部分硬编码 (Hardcoded)，缺乏独立的服务层。 |
| **基础设施 (Infra)**     |   **7.5**   | 依赖栈现代，但配置存在明显错误 (Path Alias 缺失)，目录结构扁平。      |
| **综合评分**             |   **7.4**   | **良** - 项目演示效果极佳，但架构亟需重构以支持长期维护。             |

---

## 2. 模块详细审查

### 2.1 核心状态管理 (Core State)

**文件**: `store.ts`, `types.ts`

- **语法 (9/10)**: TypeScript 类型定义清晰，使用了 `zustand` + `immer`
  的现代组合。
- **实现规范 (5/10)**:
  - **问题**: `store.ts` 单文件近 2500 行，是一个典型的 "God Object"。它混合了
    API 调用 (Supabase)、UI 状态 (Modals)、业务逻辑 (Game Rules) 和数据过滤。
  - **问题**: 存在全局变量 (`let realtimeChannel`)，这在 React
    生态中是不推荐的，不利于测试和 SSR。
- **现代性/可扩展性 (6/10)**: Zustand
  本身很现代，但目前的用法导致扩展新功能时必须修改这个巨型文件，冲突风险高。
- **可优化点**:
  - **拆分 Store**: 使用 Zustand 的 `StateCreator` 模式将 Store 拆分为
    `gameSlice`, `uiSlice`, `connectionSlice` 等。
  - **移除全局变量**: 将 WebSocket 连接状态移入 Store 或独立的 Context/Hook。

### 2.2 UI 组件 (UI Components)

**文件**: `Grimoire.tsx`, `Controls.tsx`, `App.tsx`

- **语法 (9/10)**: React Hooks 使用熟练，组件结构清晰。
- **实现规范 (8/10)**:
  - **优点**: `Grimoire.tsx` 使用 `react-konva`
    处理复杂图形，性能和交互都不错。`SeatNode` 使用了 `React.memo` 优化。
  - **问题**: `Controls.tsx` (430+行) 承担了过多职责 (Chat, AI, Audio,
    Notebook)，应进一步拆分。
  - **问题**: `App.tsx` 包含大量布局和 Resize 逻辑，应该提取为 `Layout` 组件。
- **现代性/可扩展性 (9/10)**: 视觉设计非常出色 (Glassmorphism,
  Animations)，响应式适配做得很好。
- **可优化点**:
  - **提取 Hooks**: `Grimoire.tsx` 中的手势逻辑 (Pinch Zoom) 和长按逻辑
    (`useLongPress`) 应提取为自定义 Hooks (`useZoom`, `useLongPress`)。
  - **减少重渲染**: `useStore(state => state.gameState)` 这种选择器会导致每次
    State 变化都触发组件重渲染。应使用更细粒度的选择器，例如
    `useStore(state => state.gameState.phase)`。

### 2.3 业务逻辑 (Business Logic)

**文件**: `NightActionManager.tsx`, `GameRules.tsx`, `store.ts` (Actions)

- **语法 (8/10)**: 逻辑清晰，使用了 TypeScript 的类型保护。
- **实现规范 (6/10)**:
  - **问题**: 业务逻辑与 UI 耦合紧密。例如 `NightActionManager`
    中包含了大量硬编码的 "快捷回复" 文本，这些应该配置化或来自数据源。
  - **问题**: 游戏规则逻辑主要散落在 `store.ts` 的 Actions 中，缺乏一个集中的
    `GameEngine` 或 `RuleService`。
- **现代性/可扩展性 (7/10)**:
  目前的结构支持简单的脚本扩展，但如果要支持复杂的自定义规则
  (Homebrew)，需要更灵活的规则引擎。
- **可优化点**:
  - **配置化**: 将硬编码的文本 (如 `quickReplies`) 移至常量文件或配置文件。
  - **逻辑抽离**: 将 `applyRoleAssignment`, `processNightAction` 等纯逻辑函数从
    Store 中抽离，变成纯函数以便单元测试。

### 2.4 基础设施与配置 (Infrastructure)

**文件**: `vite.config.ts`, `package.json`, `tsconfig.json`

- **语法 (8/10)**: 标准配置。
- **实现规范 (6/10)**:
  - **严重问题**: `vite.config.ts` 配置了 alias `@` 指向
    `./src`，但项目根目录下并没有 `src` 文件夹（所有代码都在根目录）。这意味着
    `@/components/...` 这样的导入会失败（如果代码中有使用的话）。
  - **问题**: `tsconfig.json` 缺少 `paths` 配置来配合 Vite 的 alias。
  - **目录结构**: 项目结构过于扁平，建议将源码移入 `src` 目录。
- **现代性/可扩展性 (8/10)**: 依赖项非常新 (React 18, Vite 6, Tailwind 3/4)。
- **可优化点**:
  - **重组目录**: 创建 `src` 目录，将代码移入其中。
  - **修复配置**: 修正 `vite.config.ts` 和 `tsconfig.json` 的路径映射。

---

## 3. 优化建议清单 (Action Plan)

### 高优先级 (High Priority)

1. **修复目录结构与配置**:
   - 创建 `src` 文件夹。
   - 移动 `components`, `hooks`, `lib`, `App.tsx`, `store.ts` 等到 `src`。
   - 更新 `vite.config.ts` 和 `tsconfig.json` 确保 `@` 别名正确工作。
2. **拆分 `store.ts`**:
   - 按功能域拆分 Slice (e.g., `createGameSlice`, `createUISlice`)。
   - 保持 `useStore` 作为统一入口，但内部组合多个 Slice。

### 中优先级 (Medium Priority)

3. **重构 `Controls.tsx`**:
   - 将 `Chat`, `Notebook`, `Audio` 等 Tab
     内容拆分为完全独立的组件文件，`Controls` 只负责 Tab 切换。
4. **优化选择器性能**:
   - 审查所有 `useStore` 调用，确保只选择需要的字段，避免全量 `gameState` 订阅。
5. **提取 `Grimoire` 逻辑**:
   - 将 Canvas 交互逻辑 (Zoom/Pan) 提取到 `hooks/useCanvasInteraction.ts`。

### 低优先级 (Low Priority)

6. **国际化 (i18n)**:
   - 目前大量中文硬编码，建议引入 `i18next` 为未来多语言支持做准备。
7. **单元测试**:
   - 为核心游戏逻辑 (如 `applyRoleAssignment`) 添加单元测试。

## 4. 总结

Antigravity 助手项目是一个视觉表现力极强的 Web 应用。它成功地利用了现代 Web 技术
(Canvas, WebSocket)
解决了复杂的桌游辅助需求。目前的瓶颈主要在于**代码组织结构**，随着功能增加，单文件
Store
和巨型组件将成为维护噩梦。通过实施上述的重构计划，可以显著提升项目的可维护性和开发效率。
