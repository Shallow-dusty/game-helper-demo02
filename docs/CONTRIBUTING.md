# 贡献指南 | Contributing Guide

> 感谢你对 Grimoire Web 的关注！本文档帮助你快速上手贡献代码。

---

## 🚀 快速开始

### 1. Fork 并克隆

```bash
# Fork 仓库后克隆到本地
git clone https://github.com/YOUR_USERNAME/game-helper-demo02.git
cd game-helper-demo02

# 添加上游仓库
git remote add upstream https://github.com/ORIGINAL_OWNER/game-helper-demo02.git
```

### 2. 安装依赖

```bash
npm install
```

### 3. 创建分支

```bash
git checkout -b feature/your-feature-name
```

### 4. 开发

```bash
npm run dev
```

---

## 📝 代码规范

### TypeScript

- 使用严格模式 (`strict: true`)
- 避免 `any`，优先使用具体类型
- 接口优于类型别名（除非需要联合类型）

```typescript
// ✅ Good
interface Seat {
  id: number;
  userName: string;
}

// ❌ Avoid
type Seat = any;
```

### React

- 函数组件优于类组件
- 使用 `React.memo` 优化渲染性能
- Props 解构在函数签名中

```typescript
// ✅ Good
function SeatNode({ seat, onClick }: SeatNodeProps) {
  return <div onClick={onClick}>{seat.userName}</div>;
}

// ❌ Avoid
function SeatNode(props: SeatNodeProps) {
  return <div onClick={props.onClick}>{props.seat.userName}</div>;
}
```

### 命名规范

| 类型 | 规范 | 示例 |
|------|------|------|
| 组件 | PascalCase | `SeatNode.tsx` |
| Hook | camelCase + use 前缀 | `useLongPress.ts` |
| 工具函数 | camelCase | `toRomanNumeral.ts` |
| 常量 | SCREAMING_SNAKE | `MAX_PLAYERS` |
| 类型/接口 | PascalCase | `interface Seat` |

### 文件组织

```
src/components/game/
├── SeatNode.tsx           # 组件
├── SeatNode.test.tsx      # 测试
├── SeatNode.types.ts      # 类型 (可选)
└── index.ts               # 导出
```

---

## 🔄 Git 工作流

### 分支命名

```
feature/add-dark-mode      # 新功能
fix/seat-render-bug        # Bug 修复
refactor/store-cleanup     # 重构
docs/update-readme         # 文档
test/add-voting-tests      # 测试
```

### Commit 规范

使用 [Conventional Commits](https://www.conventionalcommits.org/)：

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**类型**:

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式 (不影响功能) |
| `refactor` | 重构 |
| `test` | 测试相关 |
| `perf` | 性能优化 |
| `chore` | 构建/工具变更 |

**示例**:

```bash
feat(voting): 添加投票倒计时功能

- 新增 VoteTimer 组件
- 集成到投票流程中
- 添加音效提示

Closes #123
```

---

## ✅ 提交 PR 前检查

### 必须通过

```bash
# 1. Lint 检查
npm run lint

# 2. 类型检查
npx tsc --noEmit

# 3. 测试通过
npm test

# 4. 构建成功
npm run build
```

### PR 模板

```markdown
## 变更说明

简要描述你的更改...

## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 重构
- [ ] 文档更新
- [ ] 测试

## 测试

描述如何测试这些更改...

## 截图 (如适用)

添加截图...

## 检查清单

- [ ] 代码遵循项目规范
- [ ] 已添加/更新测试
- [ ] 所有测试通过
- [ ] 已更新相关文档
```

---

## 🧪 测试要求

### 新功能

- 必须包含单元测试
- 覆盖主要使用场景
- 覆盖边界情况

### Bug 修复

- 必须包含回归测试
- 测试应能复现原 Bug

### 覆盖率

- 新代码覆盖率 > 80%
- 不降低整体覆盖率

```bash
# 查看覆盖率
npm run test:coverage
```

---

## 📁 项目结构

```
src/
├── components/     # React 组件
│   ├── ui/        # 基础 UI 组件
│   ├── game/      # 游戏组件
│   └── ...
├── store/         # Zustand 状态
├── hooks/         # 自定义 Hooks
├── lib/           # 工具函数
├── constants/     # 常量
├── types/         # 类型定义
└── styles/        # 全局样式

docs/              # 文档
tests/             # 集成/E2E 测试
```

---

## 🎯 贡献方向

### 欢迎的贡献

- 🐛 Bug 修复
- ✨ 新角色/剧本支持
- 🌐 国际化 (i18n)
- ♿ 无障碍改进
- 📝 文档完善
- 🧪 测试覆盖

### 需要讨论

- 🏗️ 架构变更
- 🔧 依赖升级
- 🎨 UI 大改动

请先创建 Issue 讨论。

---

## 💬 获取帮助

- **Issue**: 报告 Bug 或提出建议
- **Discussion**: 一般性讨论
- **PR Review**: 代码审查反馈

---

## 📜 行为准则

- 尊重所有贡献者
- 建设性的反馈
- 保持专业和友善

---

## 📄 许可证

贡献的代码将采用与项目相同的许可证。

---

感谢你的贡献！🎉
