/**
 * Store Slices - Barrel Export
 */

export { aiSlice, createAISlice, AISlice } from './ai';
export { uiSlice, UISlice, createUISlice } from './ui';
export { connectionSlice, ConnectionSlice, supabase, createConnectionSlice } from './connection';
export { gameSlice, createGameSlice } from './game';

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
export * from './game/phaseMachine';
