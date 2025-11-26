# Grimoire Web - 染钟楼谜团线上魔典

Grimoire Web 是一个为《染钟楼谜团》(Blood on the Clocktower) 设计的现代化说书人助手工具。它支持实时在线多人同步、AI 规则助手以及自定义剧本导入，旨在提供流畅的线上和线下游戏体验。

## ✨ 主要功能

- **实时同步**: 基于 Supabase Realtime，说书人的操作会实时同步给所有连接的玩家（魔典状态、投票、座位信息）。
- **AI 规则助手 (Oracle)**: 集成 **DeepSeek** 和 **Kimi (Moonshot)** 大模型，随时解答规则疑问、生成台词或提供判例。
- **自定义剧本**: 支持导入 JSON 格式的自定义剧本，无限扩展游戏板子。
- **移动端适配**: 针对手机和平板优化的响应式布局，随时随地开局。
- **自动化流程**: 夜晚行动顺序提醒、投票时钟模拟、自动音效管理。

## 🛠️ 技术栈

- **前端**: React 19, Vite, TypeScript
- **样式**: Tailwind CSS (Vanilla CSS for custom animations)
- **状态管理**: Zustand
- **后端/同步**: Supabase (PostgreSQL + Realtime)
- **AI**: OpenAI SDK (Compatible with DeepSeek/Moonshot)

## 🚀 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` (如果不存在请手动创建) 到 `.env.local` 并填入以下密钥：

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# AI Providers (Optional)
VITE_DEEPSEEK_KEY=your_deepseek_key
VITE_KIMI_KEY=your_kimi_key
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:3000` 即可开始使用。

## 📖 剧本导入指南

在“说书人”控制面板的“剧本”栏目，点击 **📥 导入** 按钮即可上传自定义剧本。
支持的标准 JSON 格式示例：

```json
[
  {
    "id": "custom_role_id",
    "name": "角色名称",
    "team": "TOWNSFOLK",
    "ability": "角色技能描述..."
  }
]
```

## 📄 许可证

MIT License
