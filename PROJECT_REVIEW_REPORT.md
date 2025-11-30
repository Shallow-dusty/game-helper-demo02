# 项目全面审查报告

**日期**: 2025-11-30 **审查者**: Antigravity AI

## 1. 摘要

本项目 (`game-helper-demo02`) 是一个基于 React + Vite + Supabase
的"血染钟楼"游戏辅助工具。整体架构清晰，组件化程度高，UI
设计精美。但在**安全性**方面存在严重漏洞，需优先修复。构建和 Lint
检查通过，但存在大量 Lint 警告。

## 2. 关键发现

### 🚨 安全性 (高危)

- **客户端数据过滤失效**: 游戏状态 (`GameState`) 包含所有玩家的真实身份
  (`realRoleId`)，虽然前端代码 (`store.ts`, `Grimoire.tsx`)
  尝试根据用户身份隐藏这些信息，但**完整数据实际上已同步到每个客户端**。
  - **证据**: `store.ts` 中直接订阅 `game_rooms` 表并将 `payload.new.data`
    设置为状态。
  - **风险**:
    任何懂技术的玩家都可以通过浏览器控制台或网络抓包查看所有人的真实身份，严重破坏游戏公平性。
- **RLS 策略过于宽松**: `supabase_schema.sql` 显示 `game_rooms`
  表对所有用户（包括匿名用户）开放读写权限。
- **AI Edge Function 鉴权薄弱**: `ask-ai` 函数仅检查 Authorization
  头是否存在，未验证 Token 有效性。

### 🛠️ 配置与构建

- **Vite 配置**: 已修复 `vite.config.ts` 中在 ESM 模式下使用 `__dirname`
  的错误。
- **ESLint**: 已修复 `package.json` 中使用已废弃的 `--ext` 参数问题。目前存在
  **674 个警告**，主要是 `any` 类型使用和非空断言。
- **构建状态**: `npm run build` **成功**。

### 💻 代码质量

- **状态管理**: 使用 Zustand + Immer，结构合理但对象过于庞大。建议后续拆分
  Store。
- **组件**: `Grimoire.tsx` 使用 Konva 渲染，性能良好。组件复用性较高。
- **UI**: 使用 Tailwind CSS 和 Shadcn UI，视觉效果优秀。

## 3. 改进建议

### 立即行动 (P0)

1. **修复数据泄露**:
   - **方案 A (推荐)**: 修改后端逻辑，使用 Supabase Edge Function
     作为中转，根据请求用户的身份过滤 `GameState` JSON，然后再返回给客户端。
   - **方案 B**: 将敏感数据（如 `realRoleId`, `reminders`）移至 `seat_secrets`
     表，并严格配置 RLS，仅允许 ST 读取。客户端仅订阅公共 `game_rooms`
     和自己的私有数据。
2. **加强 RLS**: 限制 `game_rooms` 的写入权限，仅允许房间创建者或 ST
   修改关键数据。

### 后续优化 (P1)

1. **清理 Lint 警告**: 逐步解决 600+ 个 Lint 警告，特别是
   `no-explicit-any`，以提高代码健壮性。
2. **AI 函数鉴权**: 在 Edge Function 中使用 `supabase.auth.getUser()` 验证用户
   Token。
3. **性能优化**: `GameState`
   对象较大，频繁的全量更新可能会导致带宽浪费和渲染卡顿。考虑使用 Patch
   更新或拆分数据结构。

## 4. 结论

项目功能完整，体验优秀，但目前**不适合在非信任环境下（如公网路人局）使用**，仅限于完全信任的朋友间娱乐。建议在正式发布前必须修复数据安全问题。
