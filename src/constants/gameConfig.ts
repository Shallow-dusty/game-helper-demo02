export const PRESET_REMINDERS = [
  { text: '中毒', icon: '🤢', color: 'text-green-400' },
  { text: '醉酒', icon: '🍺', color: 'text-amber-400' },
  { text: '保护', icon: '🛡️', color: 'text-blue-400' },
  { text: '死亡', icon: '💀', color: 'text-red-500' },
  { text: '疯狂', icon: '🤪', color: 'text-purple-400' },
  { text: '复活', icon: '🌅', color: 'text-yellow-200' },
  { text: '自定义', icon: '📝', color: 'text-stone-300' },
];

export const STATUS_OPTIONS = [
  { id: 'POISONED', label: '中毒 (Poison)', icon: '🤢' },
  { id: 'DRUNK', label: '醉酒 (Drunk)', icon: '🍺' },
  { id: 'PROTECTED', label: '保护 (Protect)', icon: '🛡️' },
  { id: 'MADNESS', label: '疯狂 (Madness)', icon: '🤪' },
];

export interface JinxDef {
  id: string;
  role1: string;
  role2: string;
  description: string;
}

export const JINX_DEFINITIONS: JinxDef[] = [
  {
    id: 'spy_virgin',
    role1: 'spy',
    role2: 'virgin',
    description: '💡 规则提示：间谍被视为镇民。若间谍提名处女，间谍将被处决。'
  },
  {
    id: 'drunk_librarian',
    role1: 'drunk',
    role2: 'librarian',
    description: '💡 规则提示：酒鬼被视为镇民。图书管理员不会看到酒鬼作为外来者。'
  }
];
