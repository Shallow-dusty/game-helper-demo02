/**
 * Store Slices - Barrel Export
 * 
 * 新命名规范:
 * - ai.ts (原 createAISlice.ts)
 * - ui.ts (原 createUISlice.ts)
 * - connection.ts (原 createConnectionSlice.ts)
 * - game.ts (原 createGameSlice.ts)
 * 
 * 同时保持向后兼容的旧命名导出
 */

// 新命名导出
export { aiSlice, AISlice } from './ai';
export { uiSlice, UISlice } from './ui';
export { connectionSlice, ConnectionSlice, supabase } from './connection';
export { gameSlice } from './game';

// 向后兼容导出 (deprecated, 建议使用新命名)
export { createAISlice } from './ai';
export { createUISlice } from './ui';
export { createConnectionSlice } from './connection';
export { createGameSlice } from './game';

// Game 子 slice 导出
export * from './game/core';
export * from './game/flow';
export * from './game/roles';
export * from './game/chat';
export * from './game/scripts';
export * from './game/audio';
export * from './game/notes';
export * from './game/night';
export * from './game/history';
export * from './game/seatSwap';
