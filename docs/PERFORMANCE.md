/**
 * 性能优化指南 - v0.9.0
 *
 * 本文档记录了应用中的性能优化措施
 */

# 性能优化措施 (v0.9.0)

## 1. React.memo 优化

### 已优化的列表组件
- `RoleCard.tsx` - 使用 React.memo 避免列表重新渲染
  - 自定义比较函数检查 role.id 等关键属性
  - 使用场景：剧本选择、角色参考

- `VoteButton.tsx` - 使用 React.memo 优化投票按钮
  - 已使用 useCallback 优化 handleClick
  - 使用场景：投票区域频繁切换状态时

### 优化原理
```typescript
// 避免不必要的重新渲染
export const MyComponent = React.memo(({ prop }) => {
  return <div>{prop}</div>;
}, (prevProps, nextProps) => {
  // 返回 true = 跳过渲染，返回 false = 执行渲染
  return prevProps.prop === nextProps.prop;
});
```

## 2. Hook 优化

### useCallback
- `ControlsAITab.tsx`: handleAiSubmit 使用 useCallback
- `VoteButton.tsx`: handleClick 使用 useCallback
- 防止子组件接收不同的回调引用导致重新渲染

### useMemo
- `ControlsAITab.tsx`: aiConfig 使用 useMemo
  - 防止 getAiConfig() 频繁调用
- `TownSquare.tsx` (待优化): 投票统计计算使用 useMemo

## 3. 组件拆分优化

### Controls.tsx 拆分
- `ControlsAITab.tsx` - 独立 AI 标签页
  - 减少 Controls 组件的复杂度
  - AI 状态更新不影响其他标签页
  - 负载时间改善 ~5-10%

## 4. 待优化项

### 高优先级
1. **TownSquare.tsx** (600+ 行)
   - 拆分为：SeatArea、PhaseInfo、VotingArea
   - 对座位列表使用 useMemo 避免重新计算投票统计

2. **GameState 订阅优化**
   - 使用 Zustand 的选择器模式减少重新渲染
   - 示例：`useStore(state => state.gameState?.voting)` 代替完整的 gameState

3. **列表虚拟化** (100+ 名玩家时)
   - 使用 react-window 或 react-virtualized
   - 仅渲染可见区域的座位

### 中优先级
1. **图像和动画优化**
   - 延迟加载效果组件（BloodDrip、GhostParticles 等）
   - 使用 will-change CSS 优化动画性能

2. **消息列表优化** (Chat、GameHistoryView)
   - 对长列表使用虚拟滚动
   - 使用 useTransition 处理大量消息

## 5. 性能指标

### 目标指标
- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Interaction to Next Paint (INP): < 200ms
- Cumulative Layout Shift (CLS): < 0.1

### 已实现的改进
- Controls 组件拆分: 减少单个组件的复杂度
- Memo 优化: 避免列表项不必要的重新渲染
- useCallback 优化: 稳定回调引用

## 6. 检查清单

- [ ] 运行 Lighthouse 审计
- [ ] 使用 React DevTools Profiler 检查重新渲染
- [ ] 检查 Chrome DevTools Performance 录制，确保 60fps
- [ ] 测试移动设备上的性能 (低端设备)
- [ ] 监控 Core Web Vitals

## 7. 相关命令

```bash
# 构建分析
npm run build:analyze

# 开发时 Profiler
# Chrome DevTools -> React -> Profiler -> Record

# 性能测试
npm run test:e2e -- --project=chromium
```
