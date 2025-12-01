import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { PHASE_LABELS } from '../../../constants';
import { checkGameOver } from '../../../lib/gameLogic';

export const createGameFlowSlice: StoreSlice<Pick<GameSlice, 'setPhase' | 'nightNext' | 'nightPrev' | 'startVote' | 'nextClockHand' | 'toggleHand' | 'closeVote' | 'startGame' | 'endGame'>> = (set, get) => ({
    setPhase: (phase) => {
        set((state) => {
            if (state.gameState) {
                const oldPhase = state.gameState.phase;
                state.gameState.phase = phase;
                addSystemMessage(state.gameState, `游戏阶段变更为: ${PHASE_LABELS[phase]}`);
                
                if (phase === 'NIGHT' && oldPhase !== 'NIGHT') {
                    state.gameState.roundInfo.nightCount++;
                    state.gameState.roundInfo.totalRounds++;
                }
                if (phase === 'DAY' && oldPhase !== 'DAY') {
                    state.gameState.roundInfo.dayCount++;
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

    toggleHand: () => {
        set((state) => {
            if (state.gameState?.voting) {
                const current = state.gameState.voting.clockHandSeatId;
                if (current !== null) {
                    if (state.gameState.voting.votes.includes(current)) {
                        state.gameState.voting.votes = state.gameState.voting.votes.filter(v => v !== current);
                    } else {
                        state.gameState.voting.votes.push(current);
                    }
                }
            }
        });
        get().sync();
    },

    closeVote: () => {
        set((state) => {
            if (state.gameState?.voting) {
                const { nomineeSeatId, votes } = state.gameState.voting;
                const aliveCount = state.gameState.seats.filter(s => !s.isDead).length;
                const isExecuted = votes.length >= (aliveCount / 2) && votes.length > 0;
                
                let result: 'executed' | 'survived' | 'cancelled' = 'survived';
                
                if (isExecuted) {
                    result = 'executed';
                    const seat = state.gameState.seats.find(s => s.id === nomineeSeatId);
                    if (seat) {
                        seat.isDead = true;
                        addSystemMessage(state.gameState, `${seat.userName} 被处决了 (票数: ${votes.length})`);
                        
                        const gameOver = checkGameOver(state.gameState.seats);
                        if (gameOver) {
                            state.gameState.gameOver = gameOver;
                            addSystemMessage(state.gameState, `游戏结束！${gameOver.winner === 'GOOD' ? '好人' : '邪恶'} 获胜 - ${gameOver.reason}`);
                        }
                    }
                } else {
                    addSystemMessage(state.gameState, `票数不足 (${votes.length}), 无人被处决`);
                }

                state.gameState.voteHistory.push({
                    round: state.gameState.roundInfo.dayCount,
                    nominatorSeatId: state.gameState.voting.nominatorSeatId || -1,
                    nomineeSeatId: state.gameState.voting.nomineeSeatId || -1,
                    votes: state.gameState.voting.votes,
                    voteCount: state.gameState.voting.votes.length,
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
            }
        });
        get().sync();
    }
});
