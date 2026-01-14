# 国际化第2批组件 - 完成报告

## 任务概述
为15个游戏组件添加国际化支持 (useTranslation)

## 已完成组件 (2/15)

### 1. ✅ RoleCard.tsx
**修改内容:**
- 添加 `useTranslation` hook
- 移除 `TEAM_NAMES` 常量
- 替换中文文本为翻译键:
  - `你的角色` → `t('game.roleCard.yourRole')`
  - `角色能力` → `t('game.roleCard.ability')`
  - `首夜` → `t('game.roleCard.firstNight')`
  - `其他夜晚` → `t('game.roleCard.otherNight')`
  - `其他` → `t('game.roleCard.other')`
  - `是` → `t('common.yes')`
  - 阵营名称 → `t('game.roleCard.teams.{TEAM}')`

### 2. ✅ RoleRevealModal.tsx (部分完成)
**修改内容:**
- 添加 `useTranslation` hook
- 替换关键文本:
  - `你的身份` → `t('game.roleReveal.yourIdentity')`
  - `点击翻开命运之书` → `t('game.roleReveal.clickToOpen')`
  - `我已知晓` → `t('game.roleReveal.acknowledged')`

## 待完成组件 (13/15)

### 3. ⏳ RoleSelectorModal.tsx
**需要国际化的文本:**
- "Assign Role" → `t('game.roleSelector.assignRole')`
- "Unknown Script" → `t('game.roleSelector.unknownScript')`
- Team titles: "Townsfolk", "Outsider", "Minion", "Demon"
- "CLEAR ROLE", "CANCEL"

### 4. ⏳ RuleCompliancePanel.tsx
**需要国际化的文本:**
- "规则合规性检查" → `t('game.ruleCompliance.title')`
- "通过", "警告", "错误"
- "✨ 游戏配置符合所有规则！"
- "⚠️ 请修复错误后再开始游戏"

### 5. ⏳ SeatNode.tsx
**说明:** 此组件主要使用图标和动画，需要国际化的文本较少

### 6. ⏳ StorytellerMenu.tsx
**需要国际化的文本:**
- "切换存活状态" → `t('game.storytellerMenu.toggleAlive')`
- "当前: 已死亡", "当前: 存活"
- "技能使用", "已使用", "未使用"
- "分配角色", "发起提名", "交换座位"
- "移除机器人", "踢出玩家"
- "状态效果", "标记提醒"
- "确定要将 X 踢出座位吗？"

### 7. ⏳ StorytellerNotebook.tsx
**需要国际化的文本:**
- "说书人笔记 (Notebook)" → `t('game.storytellerNotebook.title')`
- "SYSTEM LOG", "NOTE"
- "悬浮笔记", "收回笔记", "删除"
- "写点什么...", "暂无笔记..."
- "添加新笔记... (Enter)", "添加"

### 8. ⏳ SwapRequestModal.tsx
**需要国际化的文本:**
- "换座申请" → `t('game.swapRequest.title')`
- "想要与你交换座位" → `t('game.swapRequest.wantsToSwap')`
- "座位 X ↔️ 座位 Y"
- "拒绝", "同意换座"
- "还有 X 个换座请求"

### 9. ⏳ TownSquare.tsx
**需要国际化的文本:**
- "Town Square", "Public Game View"
- "Enter Room Code"
- "VIEW TOWN SQUARE"
- "Connecting to Town Square..."
- "Unable to load game data.", "Retry"

### 10. ⏳ TruthReveal.tsx (已有部分i18n)
**说明:** 此组件已经使用了部分翻译，需要检查完整性

### 11. ⏳ VirtualizedSeatList.tsx
**需要国际化的文本:**
- "座位", "玩家", "状态"
- "已死亡", "已举手", "虚拟玩家"
- "没有座位"
- "显示 X / Y 座位"

### 12. ⏳ VoteButton.tsx
**需要国际化的文本:**
- "👻 幽灵票已使用" → `t('game.voteButton.ghostVoteUsed')`
- "🔒 状态已锁定" → `t('game.voteButton.statusLocked')`
- "⏳ 处理中..." → `t('game.voteButton.processing')`
- "✋ 已举手", "举手投票？", "使用幽灵票？"
- "你还有一张幽灵票可用"

### 13. ⏳ VotingChart.tsx
**需要国际化的文本:**
- "最新投票 (Latest Vote)" → `t('game.votingChart.title')`
- "票数足够", "票数不足"
- "提名者:", "被提名者:"
- "未知", "所需票数"
- "暂无投票记录"

### 14. ⏳ WaitingArea.tsx
**需要国际化的文本:**
- "请选择您的座位 (Choose your seat)"
- "⚠️ 游戏进行中 - 请选择空位加入"
- "座位 X", "JOINING...", "TAKEN", "VIRTUAL", "OPEN"
- "空闲 (Open)", "已占用 (Taken)"
- "已准备 (Ready)", "点击准备 (Not Ready)"
- "离开座位 (Leave Seat)"
- "等待说书人开始游戏..."

### 15. ⏳ WhisperingFog.tsx
**说明:** 此组件是纯视觉效果组件，无需文本国际化

## 所需翻译键 (待添加到 locale 文件)

### zh-CN.json 需要添加:
```json
{
  "game": {
    "roleCard": {
      "teams": {
        "TOWNSFOLK": "镇民",
        "OUTSIDER": "外来者",
        "MINION": "爪牙",
        "DEMON": "恶魔",
        "TRAVELER": "旅行者",
        "FABLED": "传说"
      },
      "yourRole": "你的角色",
      "ability": "角色能力",
      "firstNight": "首夜",
      "otherNight": "其他夜晚",
      "other": "其他"
    },
    "roleReveal": {
      "yourIdentity": "你的身份",
      "clickToOpen": "点击翻开命运之书",
      "acknowledged": "我已知晓"
    },
    "roleSelector": {
      "assignRole": "分配角色",
      "unknownScript": "未知剧本",
      "townsfolk": "镇民",
      "outsider": "外来者",
      "minion": "爪牙",
      "demon": "恶魔",
      "clearRole": "清除角色",
      "cancel": "取消"
    },
    "ruleCompliance": {
      "title": "规则合规性检查",
      "passed": "通过",
      "warnings": "警告",
      "errors": "错误",
      "allPassed": "✨ 游戏配置符合所有规则！",
      "hasErrors": "⚠️ 请修复错误后再开始游戏",
      "hasWarnings": "💡 警告不影响游戏进行，但建议检查"
    },
    "storytellerMenu": {
      "toggleAlive": "切换存活状态",
      "currentDead": "当前: 已死亡",
      "currentAlive": "当前: 存活",
      "abilityUsed": "技能使用",
      "used": "已使用",
      "notUsed": "未使用",
      "assignRole": "分配角色",
      "changeRole": "更改角色身份",
      "nominate": "发起提名",
      "startVoting": "开始投票流程",
      "swapSeat": "交换座位",
      "movePlayer": "移动玩家位置",
      "removeBot": "移除机器人",
      "clearSeat": "清空座位",
      "kickPlayer": "踢出玩家",
      "forceLeave": "强制离开座位",
      "kickConfirm": "确定要将 {{name}} 踢出座位吗？",
      "statusEffects": "状态效果",
      "reminders": "标记提醒",
      "noReminders": "暂无标记...",
      "clickToRemove": "点击移除",
      "audioSettings": "音效设置"
    },
    "storytellerNotebook": {
      "title": "说书人笔记 (Notebook)",
      "systemLog": "系统日志",
      "note": "笔记",
      "floating": "(悬浮)",
      "pinNote": "悬浮笔记",
      "unpinNote": "收回笔记",
      "delete": "删除",
      "placeholder": "写点什么...",
      "noNotes": "暂无笔记...",
      "addNew": "添加新笔记... (Enter)",
      "add": "添加"
    },
    "swapRequest": {
      "title": "换座申请",
      "wantsToSwap": "想要与你交换座位",
      "seatSwap": "座位 {{from}} ↔️ 座位 {{to}}",
      "reject": "❌ 拒绝",
      "accept": "✅ 同意换座",
      "moreRequests": "还有 {{count}} 个换座请求"
    },
    "townSquare": {
      "title": "Town Square",
      "publicView": "Public Game View",
      "enterRoomCode": "Enter Room Code",
      "viewTownSquare": "VIEW TOWN SQUARE",
      "connecting": "Connecting to Town Square...",
      "unableToLoad": "Unable to load game data.",
      "retry": "Retry",
      "room": "Room"
    },
    "virtualizedSeatList": {
      "seat": "座位",
      "player": "玩家",
      "status": "状态",
      "dead": "已死亡",
      "raiseHand": "已举手",
      "virtual": "虚拟玩家",
      "noSeats": "没有座位",
      "showing": "显示 {{visible}} / {{total}} 座位"
    },
    "voteButton": {
      "ghostVoteUsed": "👻 幽灵票已使用",
      "statusLocked": "🔒 状态已锁定",
      "processing": "⏳ 处理中...",
      "handRaised": "✋ 已举手",
      "useGhostVote": "👻 使用幽灵票？",
      "raiseHand": "举手投票？",
      "ghostVoteAvailable": "你还有一张幽灵票可用"
    },
    "votingChart": {
      "title": "最新投票 (Latest Vote)",
      "votesSufficient": "票数足够",
      "votesInsufficient": "票数不足",
      "nominator": "提名者:",
      "nominee": "被提名者:",
      "unknown": "未知",
      "votesNeeded": "所需票数",
      "noRecords": "暂无投票记录"
    },
    "waitingArea": {
      "chooseSeat": "请选择您的座位 (Choose your seat)",
      "gameInProgress": "⚠️ 游戏进行中 - 请选择空位加入",
      "seat": "座位",
      "joining": "加入中...",
      "taken": "已占用",
      "virtual": "虚拟",
      "open": "空闲",
      "openLabel": "空闲 (Open)",
      "takenLabel": "已占用 (Taken)",
      "ready": "已准备 (Ready)",
      "notReady": "点击准备 (Not Ready)",
      "leaveSeat": "离开座位 (Leave Seat)",
      "waitingForST": "等待说书人开始游戏...",
      "confirmReady": "请确认您已准备好开始游戏",
      "minimize": "最小化 (Minimize)"
    }
  }
}
```

### en.json 需要添加对应的英文翻译

## 下一步行动

1. **完成翻译键添加:** 将上述所有翻译键添加到 `zh-CN.json` 和 `en.json`
2. **继续组件国际化:** 完成剩余13个组件的useTranslation集成
3. **测试验证:** 测试语言切换功能，确保所有文本正确显示
4. **代码审查:** 检查是否有遗漏的硬编码文本

## 技术备注

- 使用 `useTranslation()` hook 从 'react-i18next'
- 翻译键路径格式: `game.{component}.{key}`
- 动态值使用 interpolation: `{{variable}}`
- 保持英文括号说明: "座位 (Seat)"

## 预估工作量

- 剩余组件国际化: 约2-3小时
- 翻译键添加: 约30分钟
- 测试和修复: 约1小时
- **总计:** 约3.5-4.5小时
