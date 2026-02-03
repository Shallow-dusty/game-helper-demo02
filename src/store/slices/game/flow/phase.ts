import type { Draft } from 'immer';
import { StoreSlice, GameSlice } from '@/store/types';
import type { AppState } from '@/store/types';
import { addSystemMessage } from '@/store/utils';
import { PHASE_LABELS } from '@/constants';
import { calculateNightQueue, getVoteThreshold } from './utils';
import { checkGameOver } from '@/lib/gameLogic';
import { logExecution, updateNominationResult } from '@/lib/supabaseService';
import type { GamePhase } from '@/types';

const resolveDailyExecution = (state: Draft<AppState>): void => {
    if (!state.gameState) return;
    const gameState = state.gameState;
    const day = gameState.roundInfo.dayCount;
    const dayVotes = gameState.voteHistory.filter(vote => vote.round === day && vote.result !== 'cancelled');
    const applyNoExecutionResult = () => {
        const gameOver = checkGameOver(gameState.seats, { executionOccurred: false });
        if (gameOver) {
            gameState.gameOver = gameOver;
            addSystemMessage(gameState, `游戏结束！${gameOver.winner === 'GOOD' ? '好人' : '邪恶'} 获胜 - ${gameOver.reason}`);
        }
    };
    if (dayVotes.length === 0) {
        applyNoExecutionResult();
        return;
    }

    const aliveCount = gameState.seats.filter(seat => !seat.isDead).length;
    const requiredVotes = getVoteThreshold(aliveCount);
    const eligibleVotes = dayVotes.filter(vote => vote.voteCount >= requiredVotes);
    if (eligibleVotes.length === 0) {
        applyNoExecutionResult();
        return;
    }

    const maxVotes = Math.max(...eligibleVotes.map(vote => vote.voteCount));
    const topVotes = eligibleVotes.filter(vote => vote.voteCount === maxVotes);

    if (topVotes.length !== 1) {
        topVotes.forEach(vote => {
            vote.result = 'tied';
        });
        addSystemMessage(gameState, '投票出现平票，本日无人被处决');
        applyNoExecutionResult();
        return;
    }

    const winningVote = topVotes[0];
    if (!winningVote) return;
    const nomineeSeat = gameState.seats.find(seat => seat.id === winningVote.nomineeSeatId);
    if (!nomineeSeat || nomineeSeat.isDead) {
        winningVote.result = 'cancelled';
        addSystemMessage(gameState, '投票取消：被提名者已死亡');
        applyNoExecutionResult();
        return;
    }

    nomineeSeat.isDead = true;
    gameState.dailyExecutionCompleted = true;
    winningVote.result = 'executed';
    addSystemMessage(gameState, `${nomineeSeat.userName} 被处决了 (票数: ${String(winningVote.voteCount)})`);

    const gameOver = checkGameOver(gameState.seats, { executedSeatId: nomineeSeat.id, executionOccurred: true });
    if (gameOver) {
        gameState.gameOver = gameOver;
        addSystemMessage(gameState, `游戏结束！${gameOver.winner === 'GOOD' ? '好人' : '邪恶'} 获胜 - ${gameOver.reason}`);
    }

    const user = state.user;
    if (user?.roomId) {
        logExecution(
            user.roomId,
            gameState.roundInfo.dayCount,
            nomineeSeat.id,
            nomineeSeat.seenRoleId ?? 'unknown',
            winningVote.voteCount
        ).catch(console.error);
        updateNominationResult(
            user.roomId,
            gameState.roundInfo.dayCount,
            nomineeSeat.id,
            winningVote.voteCount > 0,
            winningVote.voteCount,
            true
        ).catch(console.error);
    }
};

export const applyPhaseChange = (state: Draft<AppState>, phase: GamePhase): void => {
    if (!state.gameState) return;

    const gameState = state.gameState;
    const oldPhase = gameState.phase;
    if (oldPhase === phase) return;

    // If leaving day, resolve daily execution before night
    if (oldPhase === 'DAY' && phase === 'NIGHT') {
        resolveDailyExecution(state);
    }

    gameState.phase = phase;
    addSystemMessage(gameState, `游戏阶段变更为: ${PHASE_LABELS[phase]}`);

    // Clear voting state when leaving VOTING phase
    if (oldPhase === 'VOTING' && phase !== 'VOTING') {
        gameState.voting = null;
    }

    if (phase === 'NIGHT' && oldPhase !== 'NIGHT') {
        const nextNightCount = gameState.roundInfo.nightCount + 1;
        gameState.roundInfo.nightCount = nextNightCount;
        gameState.roundInfo.totalRounds++;
        gameState.dailyExecutionCompleted = false;

        const isFirstNight = nextNightCount === 1;
        const queue = calculateNightQueue(gameState.seats, isFirstNight, gameState.currentScriptId);
        gameState.nightQueue = queue;
        gameState.nightCurrentIndex = -1;
    }

    if (phase === 'DAY' && oldPhase !== 'DAY') {
        gameState.roundInfo.dayCount++;
        gameState.candlelightEnabled = false;
        gameState.dailyNominations = [];
    }
};

export const createPhaseSlice: StoreSlice<Pick<GameSlice, 'setPhase'>> = (set, get) => ({
    setPhase: (phase) => {
        set((state) => {
            applyPhaseChange(state, phase);
        });
        get().sync();
    }
});
