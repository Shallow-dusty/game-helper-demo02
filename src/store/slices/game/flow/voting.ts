import type { Draft } from 'immer';
import { StoreSlice, GameSlice } from '@/store/types';
import type { AppState } from '@/store/types';
import { addSystemMessage } from '@/store/utils';
import { supabase } from '../../connection';
import {
    updateNominationResult
} from '@/lib/supabaseService';
import { calculateVoteResult, getVoteThreshold } from './utils';

export const createVotingSlice: StoreSlice<Pick<GameSlice, 'startVote' | 'nextClockHand' | 'toggleHand' | 'closeVote'>> = (set, get) => ({
    // Bug#10 fix: Accept nominatorId to properly record in vote history
    startVote: (nomineeId, nominatorId) => {
        set((state: Draft<AppState>) => {
            if (state.gameState) {
                // 检查被提名者是否存活
                const nomineeSeat = state.gameState.seats.find(s => s.id === nomineeId);
                if (nomineeSeat?.isDead) {
                    state.gameState.messages.push({
                        id: `sys-${Date.now()}`,
                        senderId: 'system',
                        senderName: '系统',
                        recipientId: null,
                        content: '无法提名：该玩家已死亡',
                        timestamp: Date.now(),
                        type: 'system',
                    });
                    return;
                }

                // 检查今日是否已处决过（每日一次处决规则）
                if (state.gameState.dailyExecutionCompleted) {
                    state.gameState.messages.push({
                        id: `sys-${Date.now()}`,
                        senderId: 'system',
                        senderName: '系统',
                        recipientId: null,
                        content: '今日已处决过玩家，无法再次进行投票处决',
                        timestamp: Date.now(),
                        type: 'system',
                    });
                    return;
                }

                state.gameState.voting = {
                    nominatorSeatId: nominatorId ?? null,
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
        set((state: Draft<AppState>) => {
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

        // Bug#6 fix: Check if dead player can vote (must have ghost vote)
        if (seat.isDead && !seat.hasGhostVote) {
            console.warn('Dead player without ghost vote cannot vote');
            return;
        }

        // If dead player uses ghost vote, consume it
        const willConsumeGhostVote = seat.isDead && seat.hasGhostVote;

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
            set((state: Draft<AppState>) => {
                if (state.gameState?.voting) {
                    const isRaised = data?.isHandRaised;
                    if (isRaised) {
                        if (!state.gameState.voting.votes.includes(current)) {
                            state.gameState.voting.votes.push(current);
                        }
                        // Consume ghost vote if dead player voted
                        if (willConsumeGhostVote) {
                            const votingSeat = state.gameState.seats.find(s => s.id === current);
                            if (votingSeat) {
                                votingSeat.hasGhostVote = false;
                            }
                        }
                    } else {
                        state.gameState.voting.votes = state.gameState.voting.votes.filter(v => v !== current);
                    }
                }
            });

        } catch (error: unknown) {
            console.error('Toggle hand error:', error);
            set((state: Draft<AppState>) => {
                if (state.gameState) {
                    addSystemMessage(state.gameState, '投票失败，请检查网络连接');
                }
            });
        }
    },

    closeVote: () => {
        const { user } = get();

        set((state: Draft<AppState>) => {
            if (!state.gameState?.voting) return;

            const { nomineeSeatId, nominatorSeatId, votes } = state.gameState.voting;
            const aliveCount = state.gameState.seats.filter(s => !s.isDead).length;
            const requiredVotes = getVoteThreshold(aliveCount);
            const meetsThreshold = calculateVoteResult(votes.length, aliveCount);

            let result: 'executed' | 'survived' | 'cancelled' | 'on_the_block' | 'tied' = 'survived';

            const nomineeSeat = state.gameState.seats.find(s => s.id === nomineeSeatId);

            if (nomineeSeat?.isDead) {
                result = 'cancelled';
                addSystemMessage(state.gameState, `投票取消：被提名者已死亡`);
            } else if (!meetsThreshold) {
                addSystemMessage(state.gameState, `票数不足 (${String(votes.length)}/${String(requiredVotes)}), 无人被处决`);
            } else {
                const dayVotes = state.gameState.voteHistory.filter(vote => vote.round === state.gameState!.roundInfo.dayCount);
                const eligibleVotes = dayVotes.filter(vote => vote.voteCount >= requiredVotes && vote.result !== 'cancelled');
                const leadingCount = eligibleVotes.length > 0
                    ? Math.max(...eligibleVotes.map(vote => vote.voteCount))
                    : 0;

                if (votes.length > leadingCount) {
                    eligibleVotes.forEach(vote => {
                        if (vote.result === 'on_the_block' || vote.result === 'tied') {
                            vote.result = 'survived';
                        }
                    });
                    result = 'on_the_block';
                    addSystemMessage(state.gameState, `${nomineeSeat?.userName ?? '被提名者'} 获得 ${String(votes.length)} 票，成为当前处决候选`);
                } else if (votes.length === leadingCount && leadingCount > 0) {
                    eligibleVotes.forEach(vote => {
                        if (vote.voteCount === leadingCount) {
                            vote.result = 'tied';
                        }
                    });
                    result = 'tied';
                    addSystemMessage(state.gameState, `投票出现平票，暂无处决候选`);
                } else {
                    addSystemMessage(state.gameState, `票数不足 (${String(votes.length)}/${String(requiredVotes)}), 无人被处决`);
                }
            }

            if (user?.roomId && nomineeSeatId !== null) {
                updateNominationResult(
                    user.roomId,
                    state.gameState.roundInfo.dayCount,
                    nomineeSeatId,
                    votes.length > 0,
                    votes.length,
                    false
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
        });
        get().sync();
    }
});
