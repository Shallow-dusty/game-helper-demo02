# 部署指南 | Deployment Guide

> **当前部署**: Cloudflare Pages + Supabase | **版本**: v0.9.0

本文档介绍如何部署 Grimoire Web（血染钟楼魔典）到生产环境。

---

## 📋 部署架构

```
用户浏览器
    ↓ HTTPS
Cloudflare Pages (前端静态资源)
    ↓ API 请求
Supabase (后端 + 实时数据库 + 认证)
```

---

## 🔧 前置要求

- Node.js 18+
- npm 或 pnpm
- Git
- Cloudflare 账号 (免费)
- Supabase 账号 (免费)

---

## 1️⃣ Supabase 配置

### 1.1 创建项目

1. 访问 [supabase.com](https://supabase.com) 并登录
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: `grimoire-web` (或自定义)
   - **Database Password**: 记录此密码
   - **Region**: 选择最近的区域

### 1.2 获取 API 密钥

项目创建后，进入 **Settings > API**：

| 密钥 | 用途 | 环境变量名 |
|------|------|-----------|
| Project URL | API 基础地址 | `VITE_SUPABASE_URL` |
| anon public | 前端公开密钥 | `VITE_SUPABASE_ANON_KEY` |

### 1.3 创建数据库表

进入 **SQL Editor**，执行以下 SQL：

```sql
-- 游戏房间表
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  name TEXT NOT NULL,
  host_id UUID NOT NULL,
  state JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用实时功能
ALTER TABLE rooms REPLICA IDENTITY FULL;

-- 行级安全策略
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read rooms" ON rooms
  FOR SELECT USING (true);

CREATE POLICY "Host can update room" ON rooms
  FOR UPDATE USING (auth.uid() = host_id);
```

### 1.4 启用 Realtime

1. 进入 **Database > Replication**
2. 启用 `rooms` 表的 Realtime

---

## 2️⃣ Cloudflare Pages 部署

### 2.1 连接 Git 仓库

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 点击 **Create Application > Pages > Connect to Git**
4. 选择你的 GitHub/GitLab 仓库

### 2.2 配置构建设置

| 设置项 | 值 |
|--------|-----|
| Framework preset | Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` |

### 2.3 配置环境变量

在 **Settings > Environment variables** 添加：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_GUEST_AUTH_FALLBACK=true

# 可选：生产错误监控
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 2.4 触发部署

推送代码到 `main` 分支即可自动部署。

---

## 3️⃣ 本地开发

### 3.1 克隆项目

```bash
git clone https://github.com/your-username/game-helper-demo02.git
cd game-helper-demo02
npm install
```

### 3.2 配置环境变量

创建 `.env.local` 文件：

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_ENABLE_GUEST_AUTH_FALLBACK=true

# 可选（建议线上开启）
VITE_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1
```

### 3.3 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:5173

---

## 4️⃣ 构建生产版本

```bash
# 构建
npm run build

# 本地预览
npm run preview
```

### 构建产物

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      # 主 bundle
│   ├── index-[hash].css     # 样式
│   └── vendor-[hash].js     # 第三方库
├── manifest.json            # PWA manifest
└── service-worker.js        # Service Worker
```

---

## 5️⃣ 自定义域名

### Cloudflare Pages

1. 进入项目 **Custom domains**
2. 添加域名 (如 `grimoire.example.com`)
3. 按提示配置 DNS CNAME 记录

### DNS 配置示例

```
Type    Name       Content
CNAME   grimoire   game-helper-demo02.pages.dev
```

---

## 6️⃣ 部署检查清单

```bash
# 运行部署前检查脚本
node scripts/pre-deployment-check.js
```

### 手动检查项

- [ ] 环境变量已配置
- [ ] Supabase 表已创建
- [ ] Realtime 已启用
- [ ] 构建无错误 (`npm run build`)
- [ ] 测试通过 (`npm test`)

---

## 7️⃣ 监控与维护

### Cloudflare Analytics

- 访问量统计
- 性能指标
- 错误追踪

### Supabase Dashboard

- 数据库使用量
- 实时连接数
- API 请求统计

---

## 🔧 故障排查

### 常见问题

| 问题 | 解决方案 |
|------|----------|
| 白屏 | 检查环境变量是否正确配置 |
| 实时同步失败 | 确认 Supabase Realtime 已启用 |
| 构建失败 | 检查 Node.js 版本 (需 18+) |
| 样式丢失 | 清除缓存重新构建 |

### 查看日志

```bash
# Cloudflare Pages 构建日志
# 在 Dashboard > Deployments > 选择部署 > View logs

# 本地构建分析
npm run build:analyze
```

---

## 📚 相关链接

- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages)
- [Supabase 文档](https://supabase.com/docs)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)
