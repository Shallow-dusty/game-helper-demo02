// Z-Index 层级管理 - 统一管理所有 z-index 值
// 层级顺序: base < grimoire < overlay < tooltip < sidebar < sidebarBackdrop < modal < floatingPanel < toast
export const Z_INDEX = {
  base: 0,              // 基础层
  grimoire: 10,         // 魔典画布
  overlay: 20,          // 遮罩层
  tooltip: 30,          // 提示框
  phaseIndicator: 30,   // 阶段指示器
  dropdown: 40,         // 下拉菜单
  sidebar: 40,          // 侧边栏面板
  sidebarBackdrop: 35,  // 侧边栏背景遮罩（低于侧边栏）
  contextMenu: 45,      // 右键菜单
  modal: 50,            // 模态框
  floatingPanel: 49,    // 浮层面板（如夜间行动）低于模态框，避免遮挡
  toast: 60,            // Toast 通知
} as const;
