# Grimoire-Aether 代码归档

从已删除的 `02.Grimoire-Aether` 项目中提取的有价值代码片段。
这些文件不可直接使用，需要适配 demo02 的数据模型后才能集成。

**原项目**: grimoire-aether v0.0.0 (2026-01-05 ~ 2026-01-10)
**归档日期**: 2026-03-20

## 文件索引

### 高优先级 — 功能性代码

| 文件 | 行数 | 价值 |
|------|------|------|
| `nightActions.ts` | ~1043 | 完整的夜晚能力处理器框架。`registerAbilityHandler()` 模式、毒酒系统（3种错误模式）、13个 Trouble Brewing 角色的完整实现（占卜师含红鲱鱼、掘墓人含处决历史、厨师含邻座计算） |
| `gameEnd.ts` | ~376 | 丰富的游戏结束判定：`getTeamBalance()`、`isGameInDanger()`、`estimateRemainingRounds()`、Saint/Mayor 特殊胜利条件、游戏状态摘要生成 |
| `ClockwiseVoting.tsx` | ~507 | SVG 圆形座位投票可视化，支持双模式（ST 控制/玩家视角）、投票历史时间线、幽灵投票指示、framer-motion 动画 |

### 中优先级 — 可复用组件

| 文件 | 价值 |
|------|------|
| `AbilityTargetSelector.tsx` | 夜晚能力目标选择 UI，适用于需要选择玩家的能力 |
| `VoteCounter.tsx` | 投票计数器组件，配合 ClockwiseVoting 使用 |
| `NightOrderDisplay.tsx` | 夜晚行动顺序可视化 |

### 低优先级 — 仅供参考

| 文件 | 价值 |
|------|------|
| `ai-storyteller.ts` | AI 辅助说书的 prompt 工程模板（角色分配建议、能力结果建议），不可直接用（绑定了 Aether 的 AI client） |

## 数据模型差异

集成时需要适配的关键类型映射：

```
Aether                          →  demo02
Player.characterId              →  Seat.realRoleId
GameContext.players              →  GameState.seats
GameContext.currentNight         →  GameState.roundInfo.nightCount
AbilityContext                   →  需新建适配层
```

## 建议集成顺序

1. `gameEnd.ts` 的辅助函数（`isGameInDanger` 等）→ 融入 `src/lib/gameLogic.ts`
2. `nightActions.ts` 的 handler 模式 → 参考改进 `src/lib/roleAutomation/`
3. `ClockwiseVoting.tsx` → 可作为新的投票 UI 模式
