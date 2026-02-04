import { StoreSlice, GameSlice } from '@/store/types';
import { RuleAutomationLevel } from '@/types';
import { InteractionLogEntry } from '@/types';
import { generateShortId } from '@/lib/random';

export const createFeaturesSlice: StoreSlice<Pick<GameSlice, 'toggleCandlelight' | 'addInteractionLog' | 'setRuleAutomationLevel'>> = (set, get) => ({
    // v2.0: 烛光模式控制 (手动开关，需要同步)
    toggleCandlelight: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.candlelightEnabled = !state.gameState.candlelightEnabled;
            }
        });
        get().sync();
    },

    // v2.0: 添加交互日志
    addInteractionLog: (entry: Omit<InteractionLogEntry, 'id' | 'timestamp'>) => {
        set((state) => {
            if (state.gameState) {
                const logEntry: InteractionLogEntry = {
                    ...entry,
                    id: `log-${generateShortId()}`,
                    timestamp: Date.now(),
                };
                state.gameState.interactionLog.push(logEntry);
            }
        });
    },

    setRuleAutomationLevel: (level: RuleAutomationLevel) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.ruleAutomationLevel = level;
            }
        });
        get().sync();
    }
});
