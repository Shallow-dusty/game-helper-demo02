# 更新日志 (Changelog)

## [Unreleased]

### 计划中
- 增强型标记系统 (Advanced Reminders)
- 游戏历史记录与战报 (Game History)

## [v0.2.0] - 2025-11-26

### ✨ 新增功能 (Features)
- **自定义剧本导入**: 支持上传 JSON 文件动态加载剧本和角色。
- **AI 双模型集成**: 接入 DeepSeek V3 和 Kimi (Moonshot) 模型，提供更智能的规则咨询。
- **AI 切换器**: 在 UI 中添加了切换 AI 服务商的下拉菜单。

### 🐛 修复 (Fixes)
- **移动端布局**: 修复了手机端“加入房间”和“大厅”页面无法滚动的问题。
- **React Hooks**: 修复了 `Controls.tsx` 中因条件渲染导致的 Hook 调用错误。

### ♻️ 重构 (Refactor)
- **后端迁移**: 从 LeanCloud 迁移至 Supabase，提升了国内访问速度和稳定性。
- **AI SDK**: 移除 Google GenAI SDK，统一使用 OpenAI SDK 适配多模型。

## [v0.1.0] - Initial Release
- 基础魔典功能（座位、角色分配、状态标记）。
- 基础投票系统。
- 氛围音效播放器。
