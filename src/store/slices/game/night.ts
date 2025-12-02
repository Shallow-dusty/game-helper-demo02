import { StoreSlice, GameSlice } from '../../types';
import { supabase } from '../createConnectionSlice';
import { addSystemMessage } from '../../utils';
import { logNightAction, getTeamFromRoleType } from '../../../lib/supabaseService';
import { ROLES } from '../../../constants';

export const createGameNightSlice: StoreSlice<Pick<GameSlice, 'performNightAction' | 'submitNightAction' | 'resolveNightAction' | 'getPendingNightActions'>> = (set, get) => ({
    performNightAction: (_action) => {
        // Placeholder
    },

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    submitNightAction: async (action) => {
        const { user, gameState } = get();
        if (!user || !gameState) return;

        const seat = gameState.seats.find(s => s.userId === user.id);
        if (!seat) return;

        try {
            const { error } = await supabase.rpc('submit_night_action', {
                p_room_code: user.roomId,
                p_seat_id: seat.id,
                p_role_id: action.roleId,
                p_payload: action.payload
            });

            if (error) throw error;
            
            // v2.0: Log night action to database
            const roleData = ROLES[action.roleId];
            const targetSeatId = action.payload?.targetSeat as number | undefined;
            const targetSeat = targetSeatId !== undefined 
                ? gameState.seats.find(s => s.id === targetSeatId) 
                : undefined;
            
            await logNightAction(
                user.roomId!,
                gameState.roundInfo.nightCount,
                seat.id,
                action.roleId,
                getTeamFromRoleType(roleData?.type),
                targetSeatId,
                targetSeat?.roleId,
                'SUCCESS',
                action.payload
            );
            
            addSystemMessage(gameState, `已提交夜间行动`);
            
        } catch (e: any) {
            console.error('Submit night action error:', e);
            addSystemMessage(gameState, `提交失败: ${e.message}`);
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
