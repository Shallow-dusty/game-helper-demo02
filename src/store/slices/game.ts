/**
 * Game Slice - 组合所有游戏相关的子 slice
 * 
 * 重命名自 createGameSlice.ts，遵循新的命名规范
 */
import { StoreSlice, GameSlice } from '../types';
import { createGameCoreSlice } from './game/core';
import { createGameFlowSlice } from './game/flow';
import { createGameRolesSlice } from './game/roles';
import { createGameChatSlice } from './game/chat';
import { createGameScriptsSlice } from './game/scripts';
import { createGameAudioSlice } from './game/audio';
import { createGameNotesSlice } from './game/notes';
import { createGameNightSlice } from './game/night';
import { createGameHistorySlice } from './game/history';
import { createGameSeatSwapSlice } from './game/seatSwap';

export const gameSlice: StoreSlice<GameSlice> = (set, get, api) => ({
    gameState: null,
    isAudioBlocked: false,

    ...createGameCoreSlice(set, get, api),
    ...createGameFlowSlice(set, get, api),
    ...createGameRolesSlice(set, get, api),
    ...createGameChatSlice(set, get, api),
    ...createGameScriptsSlice(set, get, api),
    ...createGameAudioSlice(set, get, api),
    ...createGameNotesSlice(set, get, api),
    ...createGameNightSlice(set, get, api),
    ...createGameHistorySlice(set, get, api),
    ...createGameSeatSwapSlice(set, get, api),
});

// 向后兼容导出
export const createGameSlice = gameSlice;
