/**
 * Design Tokens - 设计令牌
 *
 * 统一的设计系统常量，与 tailwind.config.ts 和 CSS 变量保持同步
 */

// ===== 颜色令牌 =====
export const colors = {
  gothic: {
    bg: '#0a0505',
    bgDark: '#050303',
    surface: '#12121a',
    card: '#1a1a24',
    border: '#2a2a3a',
    text: '#e0d0b0',
    muted: '#8a7040',
    accent: '#c0a060',
    accentDim: '#8a7040',
    blood: '#991b1b',
    bloodBright: '#dc2626',
    holy: '#fbbf24',
    evil: '#7c3aed',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayRed: 'rgba(40, 10, 10, 0.6)'
  }
} as const

// ===== 间距令牌 =====
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64
} as const

// ===== 圆角令牌 =====
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999
} as const

// ===== 阴影令牌 =====
export const shadows = {
  card: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
  glass: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(0, 0, 0, 0.2)',
  glassHover: '0 12px 40px rgba(0, 0, 0, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.2), 0 0 15px rgba(192, 160, 96, 0.1)',
  glow: '0 0 20px rgba(192, 160, 96, 0.3)',
  glowStrong: '0 0 30px rgba(192, 160, 96, 0.5)',
  blood: '0 0 15px rgba(220, 38, 38, 0.4)',
  bloodStrong: '0 0 25px rgba(220, 38, 38, 0.6)'
} as const

// ===== Z-Index 层级 =====
export const zIndex = {
  base: 0,
  card: 10,
  dropdown: 20,
  sticky: 25,
  modal: 30,
  toast: 40,
  tooltip: 50,
  overlay: 100
} as const

// ===== 动画时长 =====
export const durations = {
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800
} as const

// ===== 缓动函数 =====
export const easings = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
} as const

// ===== 断点 =====
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const

// ===== 字体 =====
export const fonts = {
  display: 'Cinzel, serif',
  body: 'Inter, sans-serif'
} as const

// ===== 字体大小 =====
export const fontSizes = {
  xs: '0.75rem',   // 12px
  sm: '0.875rem',  // 14px
  base: '1rem',    // 16px
  lg: '1.125rem',  // 18px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem'   // 36px
} as const

// ===== 状态颜色 (用于角色状态徽章) =====
export const statusColors = {
  alive: {
    bg: 'rgba(34, 197, 94, 0.2)',
    text: '#22c55e',
    border: 'rgba(34, 197, 94, 0.3)'
  },
  dead: {
    bg: 'rgba(107, 114, 128, 0.2)',
    text: '#6b7280',
    border: 'rgba(107, 114, 128, 0.3)'
  },
  poisoned: {
    bg: 'rgba(139, 92, 246, 0.2)',
    text: '#a78bfa',
    border: 'rgba(139, 92, 246, 0.3)'
  },
  protected: {
    bg: 'rgba(251, 191, 36, 0.2)',
    text: '#fbbf24',
    border: 'rgba(251, 191, 36, 0.3)'
  },
  nominated: {
    bg: 'rgba(220, 38, 38, 0.2)',
    text: '#f87171',
    border: 'rgba(220, 38, 38, 0.3)'
  },
  drunk: {
    bg: 'rgba(168, 85, 247, 0.2)',
    text: '#c084fc',
    border: 'rgba(168, 85, 247, 0.3)'
  }
} as const

// ===== 阵营颜色 =====
export const teamColors = {
  TOWNSFOLK: {
    bg: 'rgba(59, 130, 246, 0.2)',
    text: '#60a5fa',
    border: 'rgba(59, 130, 246, 0.3)'
  },
  OUTSIDER: {
    bg: 'rgba(34, 197, 94, 0.2)',
    text: '#4ade80',
    border: 'rgba(34, 197, 94, 0.3)'
  },
  MINION: {
    bg: 'rgba(168, 85, 247, 0.2)',
    text: '#c084fc',
    border: 'rgba(168, 85, 247, 0.3)'
  },
  DEMON: {
    bg: 'rgba(220, 38, 38, 0.2)',
    text: '#f87171',
    border: 'rgba(220, 38, 38, 0.3)'
  },
  TRAVELLER: {
    bg: 'rgba(251, 191, 36, 0.2)',
    text: '#fbbf24',
    border: 'rgba(251, 191, 36, 0.3)'
  }
} as const

// ===== 导出类型 =====
export type GothicColor = keyof typeof colors.gothic
export type StatusType = keyof typeof statusColors
export type TeamType = keyof typeof teamColors
