import { StoreSlice, GameSlice } from '../../types';
import { supabase } from '../connection';
import { addSystemMessage } from '../../utils';
import { logNightAction, getTeamFromRoleType } from '../../../lib/supabaseService';
import { ROLES } from '../../../constants';

// Type for night action payload used in this module
interface NightActionPayloadInternal {
    targetSeat?: number;
    [key: string]: unknown;
}

export const createGameNightSlice: StoreSlice<Pick<GameSlice, 'performNightAction' | 'submitNightAction' | 'resolveNightAction' | 'getPendingNightActions'>> = (set, get) => ({
    performNightAction: (_action) => {
        // Placeholder
    },

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    submitNightAction: async (action) => {
        const { user, gameState } = get();
        if (!user?.roomId || !gameState) return;

        const seat = gameState.seats.find(s => s.userId === user.id);
        if (!seat) return;

        try {
            const payload = action.payload as NightActionPayloadInternal | undefined;
            const { error } = await supabase.rpc('submit_night_action', {
                p_room_code: user.roomId,
                p_seat_id: seat.id,
                p_role_id: action.roleId,
                p_payload: payload as Record<string, unknown> | undefined
            });

            if (error) throw error;

            // v2.0: Log night action to database
            const roleData = ROLES[action.roleId];
            const targetSeatId = payload?.targetSeat;
            const targetSeat = targetSeatId !== undefined
                ? gameState.seats.find(s => s.id === targetSeatId)
                : undefined;

            await logNightAction(
                user.roomId,
                gameState.roundInfo.nightCount,
                seat.id,
                action.roleId,
                getTeamFromRoleType(roleData?.team),
                targetSeatId,
                targetSeat?.seenRoleId ?? undefined,
                'SUCCESS',
                payload as Record<string, unknown> | undefined
            );

            addSystemMessage(gameState, `已提交夜间行动`);

        } catch (e: unknown) {
            console.error('Submit night action error:', e);
            const errorMessage = e instanceof Error ? e.message : String(e);
            addSystemMessage(gameState, `提交失败: ${errorMessage}`);
        }
    },

    resolveNightAction: (requestId, result) => {
        set((state) => {
            if (state.gameState) {
                const req = state.gameState.nightActionRequests.find(r => r.id === requestId);
                if (req) {
                    req.status = 'resolved';
                    req.result = result;
                }
            }
        });
        get().sync();
    },

    getPendingNightActions: () => {
        const state = get().gameState;
        return state ? state.nightActionRequests.filter(r => r.status === 'pending') : [];
    }
});
