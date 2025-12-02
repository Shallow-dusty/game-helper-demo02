import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { supabase } from '../createConnectionSlice';
import { PHASE_LABELS, NIGHT_ORDER_FIRST, NIGHT_ORDER_OTHER } from '../../../constants';
import { checkGameOver } from '../../../lib/gameLogic';
import { InteractionLogEntry } from '../../../types';
import { 
    logInteraction, 
    logExecution, 
    logDeath,
    updateNominationResult,
    getTeamFromRoleType,
    mapPhase 
} from '../../../lib/supabaseService';

export const createGameFlowSlice: StoreSlice<Pick<GameSlice, 'setPhase' | 'nightNext' | 'nightPrev' | 'startVote' | 'nextClockHand' | 'toggleHand' | 'closeVote' | 'startGame' | 'endGame' | 'toggleCandlelight' | 'addInteractionLog'>> = (set, get) => ({
    
    // v2.0: 烛光模式控制
    toggleCandlelight: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.candlelightEnabled = !state.gameState.candlelightEnabled;
            }
        });
    },
    
    // v2.0: 添加交互日志
    addInteractionLog: (entry: Omit<InteractionLogEntry, 'id' | 'timestamp'>) => {
        set((state) => {
            if (state.gameState) {
                const logEntry: InteractionLogEntry = {
                    ...entry,
                    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
                    timestamp: Date.now(),
                };
                state.gameState.interactionLog.push(logEntry);
            }
        });
    },
    
    setPhase: (phase) => {
        set((state) => {
            if (state.gameState) {
                const oldPhase = state.gameState.phase;
                state.gameState.phase = phase;
                addSystemMessage(state.gameState, `游戏阶段变更为: ${PHASE_LABELS[phase]}`);
                
                if (phase === 'NIGHT' && oldPhase !== 'NIGHT') {
                    state.gameState.roundInfo.nightCount++;
                    state.gameState.roundInfo.totalRounds++;
                    // 进入夜晚自动开启烛光
                    state.gameState.candlelightEnabled = true;
                }
                if (phase === 'DAY' && oldPhase !== 'DAY') {
                    state.gameState.roundInfo.dayCount++;
                    // 进入白天自动关闭烛光
                    state.gameState.candlelightEnabled = false;
                    // 重置每日提名记录
                    state.gameState.dailyNominations = [];
                }

                // If entering NIGHT, recalculate queue
                if (phase === 'NIGHT') {
                    const isFirstNight = state.gameState.roundInfo.nightCount === 1;
                    const orderList = isFirstNight ? NIGHT_ORDER_FIRST : NIGHT_ORDER_OTHER;
                    
                    const activeRoleIds = state.gameState.seats
                        .filter(s => s.roleId && !s.isDead)
                        .map(s => s.roleId!);
                    
                    const queue = orderList.filter(roleId => activeRoleIds.includes(roleId));
                    
                    state.gameState.nightQueue = queue;
                    state.gameState.nightCurrentIndex = -1;
                }
            }
        });
        get().sync();
    },

    nightNext: () => {
        set((state) => {
            if (state.gameState) {
                const queue = state.gameState.nightQueue;
                if (state.gameState.nightCurrentIndex < queue.length - 1) {
                    state.gameState.nightCurrentIndex++;
                } else {
                    state.gameState.phase = 'DAY';
                    state.gameState.nightCurrentIndex = -1;
                    state.gameState.roundInfo.dayCount++;
                }
            }
        });
        get().sync();
    },

    nightPrev: () => {
        set((state) => {
            if (state.gameState) {
                if (state.gameState.nightCurrentIndex > 0) {
                    state.gameState.nightCurrentIndex--;
                }
            }
        });
        get().sync();
    },

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
            });

            if (error) throw error;
            if (data && !data.success) {
                console.error('Toggle hand failed:', data.error);
                return;
            }

            // Optimistic update
            set((state) => {
                if (state.gameState?.voting) {
                    const isRaised = data.isHandRaised;
                    if (isRaised) {
                        if (!state.gameState.voting.votes.includes(current)) {
                            state.gameState.voting.votes.push(current);
                        }
                    } else {
                        state.gameState.voting.votes = state.gameState.voting.votes.filter(v => v !== current);
                    }
                }
            });

        } catch (error: any) {
            console.error('Toggle hand error:', error);
        }
    },

    closeVote: () => {
        const { user } = get();
        
        set((state) => {
            if (state.gameState?.voting) {
                const { nomineeSeatId, nominatorSeatId, votes } = state.gameState.voting;
                const aliveCount = state.gameState.seats.filter(s => !s.isDead).length;
                const isExecuted = votes.length >= (aliveCount / 2) && votes.length > 0;
                
                let result: 'executed' | 'survived' | 'cancelled' = 'survived';
                
                const nomineeSeat = state.gameState.seats.find(s => s.id === nomineeSeatId);
                
                if (isExecuted) {
                    result = 'executed';
                    if (nomineeSeat) {
                        nomineeSeat.isDead = true;
                        addSystemMessage(state.gameState, `${nomineeSeat.userName} 被处决了 (票数: ${votes.length})`);
                        
                        // v2.0: Log execution to database (async, non-blocking)
                        if (user?.roomId && nomineeSeatId !== null) {
                            logExecution(
                                user.roomId,
                                state.gameState.roundInfo.dayCount,
                                nomineeSeatId,
                                nomineeSeat.roleId || 'unknown',
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
                    addSystemMessage(state.gameState, `票数不足 (${votes.length}), 无人被处决`);
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
                    nominatorSeatId: nominatorSeatId || -1,
                    nomineeSeatId: nomineeSeatId || -1,
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
    },

    startGame: () => {
        set((state) => {
            if (state.gameState) {
                state.gameState.phase = 'NIGHT';
                state.gameState.roundInfo.nightCount = 1;
                
                // Initialize night queue for first night
                const orderList = NIGHT_ORDER_FIRST;
                
                const activeRoleIds = state.gameState.seats
                    .filter(s => s.roleId && !s.isDead)
                    .map(s => s.roleId!);
                
                const queue = orderList.filter(roleId => activeRoleIds.includes(roleId));
                
                state.gameState.nightQueue = queue;
                state.gameState.nightCurrentIndex = -1;
                
                // 夜晚自动启用烛光模式
                state.gameState.candlelightEnabled = true;
            }
        });
        get().sync();
    },

    endGame: (winner, reason) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.gameOver = {
                    isOver: true,
                    winner,
                    reason
                };
                addSystemMessage(state.gameState, `游戏结束！${winner === 'GOOD' ? '好人' : '邪恶'} 获胜 - ${reason}`);
                
                // 游戏结束时关闭烛光模式
                state.gameState.candlelightEnabled = false;
            }
        });
        get().sync();
    }
});
