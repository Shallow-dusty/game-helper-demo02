import { StoreSlice, GameSlice } from '../../../types';
import { addSystemMessage } from '../../../utils';
import { supabase } from '../../connection';
import { checkGameOver } from '../../../../lib/gameLogic';
import {
    logExecution,
    updateNominationResult
} from '../../../../lib/supabaseService';
import { calculateVoteResult } from './utils';

export const createVotingSlice: StoreSlice<Pick<GameSlice, 'startVote' | 'nextClockHand' | 'toggleHand' | 'closeVote'>> = (set, get) => ({
    startVote: (nomineeId) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.voting = {
                    nominatorSeatId: null,
                    nomineeSeatId: nomineeId,
                    clockHandSeatId: nomineeId,
                    votes: [],
                    isOpen: true
                };
                state.gameState.phase = 'VOTING';
            }
        });
        get().sync();
    },

    nextClockHand: () => {
        set((state) => {
            if (state.gameState?.voting) {
                const current = state.gameState.voting.clockHandSeatId;
                if (current !== null) {
                    const next = (current + 1) % state.gameState.seats.length;
                    state.gameState.voting.clockHandSeatId = next;
                }
            }
        });
        get().sync();
    },

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    toggleHand: async () => {
        const { user, gameState } = get();
        if (!user || !gameState?.voting) return;

        const current = gameState.voting.clockHandSeatId;
        if (current === null) return;

        // Check if user owns the current seat
        const seat = gameState.seats.find(s => s.id === current);
        if (!seat || seat.userId !== user.id) {
            // If not the user's seat, do nothing (or show error)
            return;
        }

        try {
            const { data, error } = await supabase.rpc('toggle_hand', {
                p_room_code: user.roomId,
                p_seat_id: current,
                p_user_id: user.id
            }) as { data: { success: boolean; error?: string; isHandRaised: boolean } | null; error: Error | null };

            if (error) throw error;
            if (data && !data.success) {
                console.error('Toggle hand failed:', data.error);
                return;
            }

            // Optimistic update
            set((state) => {
                if (state.gameState?.voting) {
                    const isRaised = data?.isHandRaised;
                    if (isRaised) {
                        if (!state.gameState.voting.votes.includes(current)) {
                            state.gameState.voting.votes.push(current);
                        }
                    } else {
                        state.gameState.voting.votes = state.gameState.voting.votes.filter(v => v !== current);
                    }
                }
            });

        } catch (error: unknown) {
            console.error('Toggle hand error:', error);
        }
    },

    closeVote: () => {
        const { user } = get();

        set((state) => {
            if (state.gameState?.voting) {
                const { nomineeSeatId, nominatorSeatId, votes } = state.gameState.voting;
                const aliveCount = state.gameState.seats.filter(s => !s.isDead).length;
                const isExecuted = calculateVoteResult(votes.length, aliveCount);

                let result: 'executed' | 'survived' | 'cancelled' = 'survived';

                const nomineeSeat = state.gameState.seats.find(s => s.id === nomineeSeatId);

                if (isExecuted) {
                    result = 'executed';
                    if (nomineeSeat) {
                        nomineeSeat.isDead = true;
                        addSystemMessage(state.gameState, `${nomineeSeat.userName} 被处决了 (票数: ${String(votes.length)})`);

                        // v2.0: Log execution to database (async, non-blocking)
                        if (user?.roomId && nomineeSeatId !== null) {
                            logExecution(
                                user.roomId,
                                state.gameState.roundInfo.dayCount,
                                nomineeSeatId,
                                nomineeSeat.seenRoleId ?? 'unknown',
                                votes.length
                            ).catch(console.error);
                        }

                        const gameOver = checkGameOver(state.gameState.seats);
                        if (gameOver) {
                            state.gameState.gameOver = gameOver;
                            addSystemMessage(state.gameState, `游戏结束！${gameOver.winner === 'GOOD' ? '好人' : '邪恶'} 获胜 - ${gameOver.reason}`);
                        }
                    }
                } else {
                    addSystemMessage(state.gameState, `票数不足 (${String(votes.length)}), 无人被处决`);
                }

                // v2.0: Update nomination result in database (async, non-blocking)
                if (user?.roomId && nomineeSeatId !== null) {
                    updateNominationResult(
                        user.roomId,
                        state.gameState.roundInfo.dayCount,
                        nomineeSeatId,
                        votes.length > 0,
                        votes.length,
                        isExecuted
                    ).catch(console.error);
                }

                state.gameState.voteHistory.push({
                    round: state.gameState.roundInfo.dayCount,
                    nominatorSeatId: nominatorSeatId ?? -1,
                    nomineeSeatId: nomineeSeatId ?? -1,
                    votes: votes,
                    voteCount: votes.length,
                    timestamp: Date.now(),
                    result: result
                });

                state.gameState.voting = null;
                state.gameState.phase = 'DAY';
            }
        });
        get().sync();
    }
});
