/**
 * Voting Slice Tests
 *
 * Tests for the voting system in the game flow module.
 * Focus on improving coverage for:
 * - toggleHand async function
 * - closeVote edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createVotingSlice } from './voting';
import type { GameState, Seat, VoteRecord } from '../../../../types';

// Mock dependencies - paths relative to flow/ directory
vi.mock('../../connection', () => ({
    supabase: {
        rpc: vi.fn()
    }
}));

vi.mock('../../../utils', () => ({
    addSystemMessage: vi.fn()
}));

vi.mock('../../../../lib/gameLogic', () => ({
    checkGameOver: vi.fn()
}));

vi.mock('../../../../lib/supabaseService', () => ({
    logExecution: vi.fn().mockReturnValue(Promise.resolve()),
    updateNominationResult: vi.fn().mockReturnValue(Promise.resolve())
}));

// Import mocked modules for assertions
import { supabase } from '../../connection';
import { checkGameOver } from '../../../../lib/gameLogic';
import { logExecution, updateNominationResult } from '../../../../lib/supabaseService';
import { addSystemMessage } from '../../../utils';

// Helper to create test seats
function createTestSeat(id: number, overrides: Partial<Seat> = {}): Seat {
    return {
        id,
        index: id,
        isEmpty: false,
        isDead: false,
        hasGhostVote: true,
        isNominated: false,
        isNominatedBy: null,
        markedForDeath: false,
        statuses: [],
        hasUsedAbility: false,
        notes: [],
        reminders: [],
        nightReminders: [],
        causeOfDeath: null,
        userId: `user${id}`,
        userName: `Player ${id}`,
        roleId: null,
        seenRoleId: null,
        ...overrides
    } as Seat;
}

// Create mock store state
function createMockState() {
    return {
        gameState: {
            seats: [
                createTestSeat(0),
                createTestSeat(1),
                createTestSeat(2),
                createTestSeat(3),
                createTestSeat(4)
            ],
            phase: 'VOTING' as const,
            voting: {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [] as number[],
                isOpen: true
            },
            voteHistory: [] as VoteRecord[],
            roundInfo: {
                dayCount: 1,
                nightCount: 1,
                nominationCount: 0,
                totalRounds: 1
            },
            gameOver: null
        } as unknown as GameState,
        user: {
            id: 'user0',
            roomId: 'ROOM123',
            name: 'Test User',
            isStoryteller: false
        }
    };
}

describe('createVotingSlice', () => {
    let mockState: ReturnType<typeof createMockState>;
    let slice: ReturnType<typeof createVotingSlice>;
    let mockSync: ReturnType<typeof vi.fn>;

    const createMockSet = () => {
        return (updater: ((state: typeof mockState) => void) | Partial<typeof mockState>) => {
            if (typeof updater === 'function') {
                updater(mockState);
            } else {
                Object.assign(mockState, updater);
            }
        };
    };

    const createMockGet = () => {
        return () => ({
            ...mockState,
            sync: mockSync
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSync = vi.fn();
        mockState = createMockState();

        // Reset mock implementations that return promises
        vi.mocked(logExecution).mockReturnValue(Promise.resolve());
        vi.mocked(updateNominationResult).mockReturnValue(Promise.resolve());

        slice = createVotingSlice(
            createMockSet() as unknown as Parameters<typeof createVotingSlice>[0],
            createMockGet() as unknown as Parameters<typeof createVotingSlice>[1],
            {} as Parameters<typeof createVotingSlice>[2]
        );
    });

    afterEach(() => {
        vi.resetAllMocks();
    });

    describe('startVote', () => {
        it('should initialize voting state with nominee', () => {
            mockState.gameState.voting = null;
            mockState.gameState.phase = 'DAY';

            slice.startVote(2);

            expect(mockState.gameState.voting).toEqual({
                nominatorSeatId: null,
                nomineeSeatId: 2,
                clockHandSeatId: 2,
                votes: [],
                isOpen: true
            });
            expect(mockState.gameState.phase).toBe('VOTING');
            expect(mockSync).toHaveBeenCalled();
        });

        it('should not crash when gameState is null', () => {
            mockState.gameState = null as unknown as GameState;
            expect(() => slice.startVote(1)).not.toThrow();
        });
    });

    describe('nextClockHand', () => {
        it('should advance clock hand to next seat', () => {
            mockState.gameState.voting!.clockHandSeatId = 0;

            slice.nextClockHand();

            expect(mockState.gameState.voting!.clockHandSeatId).toBe(1);
            expect(mockSync).toHaveBeenCalled();
        });

        it('should wrap around to first seat', () => {
            mockState.gameState.voting!.clockHandSeatId = 4;

            slice.nextClockHand();

            expect(mockState.gameState.voting!.clockHandSeatId).toBe(0);
        });

        it('should not crash when voting is null', () => {
            mockState.gameState.voting = null;
            expect(() => slice.nextClockHand()).not.toThrow();
        });

        it('should not crash when clockHandSeatId is null', () => {
            mockState.gameState.voting!.clockHandSeatId = null;
            expect(() => slice.nextClockHand()).not.toThrow();
        });
    });

    describe('toggleHand', () => {
        it('should return early when user is null', async () => {
            mockState.user = null as unknown as typeof mockState.user;

            await slice.toggleHand();

            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('should return early when gameState.voting is null', async () => {
            mockState.gameState.voting = null;

            await slice.toggleHand();

            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('should return early when clockHandSeatId is null', async () => {
            mockState.gameState.voting!.clockHandSeatId = null;

            await slice.toggleHand();

            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('should return early when user does not own current seat', async () => {
            // User is user0, but clockHand is on seat 1 (owned by user1)
            mockState.gameState.voting!.clockHandSeatId = 1;
            mockState.user.id = 'user0';

            await slice.toggleHand();

            expect(supabase.rpc).not.toHaveBeenCalled();
        });

        it('should call supabase.rpc when user owns the seat', async () => {
            mockState.gameState.voting!.clockHandSeatId = 0;
            mockState.user.id = 'user0';

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: { success: true, isHandRaised: true },
                error: null
            } as never);

            await slice.toggleHand();

            expect(supabase.rpc).toHaveBeenCalledWith('toggle_hand', {
                p_room_code: 'ROOM123',
                p_seat_id: 0,
                p_user_id: 'user0'
            });
        });

        it('should add vote when hand is raised', async () => {
            mockState.gameState.voting!.clockHandSeatId = 0;
            mockState.user.id = 'user0';
            mockState.gameState.voting!.votes = [];

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: { success: true, isHandRaised: true },
                error: null
            } as never);

            await slice.toggleHand();

            expect(mockState.gameState.voting!.votes).toContain(0);
        });

        it('should not add duplicate vote when hand is raised', async () => {
            mockState.gameState.voting!.clockHandSeatId = 0;
            mockState.user.id = 'user0';
            mockState.gameState.voting!.votes = [0]; // Already voted

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: { success: true, isHandRaised: true },
                error: null
            } as never);

            await slice.toggleHand();

            expect(mockState.gameState.voting!.votes).toEqual([0]);
        });

        it('should remove vote when hand is lowered', async () => {
            mockState.gameState.voting!.clockHandSeatId = 0;
            mockState.user.id = 'user0';
            mockState.gameState.voting!.votes = [0, 2];

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: { success: true, isHandRaised: false },
                error: null
            } as never);

            await slice.toggleHand();

            expect(mockState.gameState.voting!.votes).toEqual([2]);
        });

        it('should handle RPC error gracefully', async () => {
            mockState.gameState.voting!.clockHandSeatId = 0;
            mockState.user.id = 'user0';

            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
            vi.mocked(supabase.rpc).mockRejectedValue(new Error('Network error'));

            await slice.toggleHand();

            expect(consoleError).toHaveBeenCalledWith('Toggle hand error:', expect.any(Error));
            consoleError.mockRestore();
        });

        it('should handle RPC returning error in response', async () => {
            mockState.gameState.voting!.clockHandSeatId = 0;
            mockState.user.id = 'user0';

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: null,
                error: new Error('RPC error')
            } as never);

            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

            await slice.toggleHand();

            expect(consoleError).toHaveBeenCalledWith('Toggle hand error:', expect.any(Error));
            consoleError.mockRestore();
        });

        it('should handle unsuccessful toggle response', async () => {
            mockState.gameState.voting!.clockHandSeatId = 0;
            mockState.user.id = 'user0';

            vi.mocked(supabase.rpc).mockResolvedValue({
                data: { success: false, error: 'Not your turn' },
                error: null
            } as never);

            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

            await slice.toggleHand();

            expect(consoleError).toHaveBeenCalledWith('Toggle hand failed:', 'Not your turn');
            consoleError.mockRestore();
        });

        it('should handle seat not found gracefully', async () => {
            // Set clockHand to a seat id that doesn't exist
            mockState.gameState.voting!.clockHandSeatId = 99;
            mockState.user.id = 'user0';

            await slice.toggleHand();

            expect(supabase.rpc).not.toHaveBeenCalled();
        });
    });

    describe('closeVote', () => {
        it('should execute nominee when majority votes', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0, 2, 3], // 3 votes out of 5 players
                isOpen: true
            };
            mockState.gameState.seats[1].seenRoleId = 'imp';

            slice.closeVote();

            expect(mockState.gameState.seats[1].isDead).toBe(true);
            expect(mockState.gameState.voting).toBeNull();
            expect(mockState.gameState.phase).toBe('DAY');
            expect(mockState.gameState.voteHistory).toHaveLength(1);
            expect(mockState.gameState.voteHistory[0].result).toBe('executed');
            expect(logExecution).toHaveBeenCalled();
        });

        it('should not execute nominee when insufficient votes', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0], // 1 vote out of 5 players
                isOpen: true
            };

            slice.closeVote();

            expect(mockState.gameState.seats[1].isDead).toBe(false);
            expect(mockState.gameState.voteHistory[0].result).toBe('survived');
        });

        it('should check for game over after execution', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0, 2, 3],
                isOpen: true
            };

            vi.mocked(checkGameOver).mockReturnValue({
                isOver: true,
                winner: 'GOOD',
                reason: 'Demon executed'
            });

            slice.closeVote();

            expect(checkGameOver).toHaveBeenCalledWith(mockState.gameState.seats);
            expect(mockState.gameState.gameOver).toEqual({
                isOver: true,
                winner: 'GOOD',
                reason: 'Demon executed'
            });
        });

        it('should handle nomineeSeatId being null', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: null,
                clockHandSeatId: null,
                votes: [0, 2, 3],
                isOpen: true
            };

            expect(() => slice.closeVote()).not.toThrow();
            expect(mockState.gameState.voteHistory).toHaveLength(1);
            expect(mockState.gameState.voteHistory[0].nomineeSeatId).toBe(-1);
        });

        it('should handle user being null', () => {
            mockState.user = null as unknown as typeof mockState.user;
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0, 2, 3],
                isOpen: true
            };

            expect(() => slice.closeVote()).not.toThrow();
            expect(logExecution).not.toHaveBeenCalled();
        });

        it('should handle user.roomId being null', () => {
            mockState.user.roomId = null as unknown as string;
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0, 2, 3],
                isOpen: true
            };

            slice.closeVote();

            // Should still execute but not log
            expect(mockState.gameState.seats[1].isDead).toBe(true);
        });

        it('should not crash when voting is null', () => {
            mockState.gameState.voting = null;
            expect(() => slice.closeVote()).not.toThrow();
        });

        it('should handle zero votes', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [],
                isOpen: true
            };

            slice.closeVote();

            expect(mockState.gameState.seats[1].isDead).toBe(false);
            expect(mockState.gameState.voteHistory[0].voteCount).toBe(0);
        });

        it('should update nomination result in database', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0],
                isOpen: true
            };

            slice.closeVote();

            expect(updateNominationResult).toHaveBeenCalledWith(
                'ROOM123',
                1, // dayCount
                1, // nomineeSeatId
                true, // hasVotes (votes.length > 0)
                1, // voteCount
                false // isExecuted
            );
        });

        it('should record vote history with nominatorSeatId as -1 when null', () => {
            mockState.gameState.voting = {
                nominatorSeatId: null,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0],
                isOpen: true
            };

            slice.closeVote();

            expect(mockState.gameState.voteHistory[0].nominatorSeatId).toBe(-1);
        });

        it('should handle nominee seat not found', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 99, // Non-existent seat
                clockHandSeatId: 1,
                votes: [0, 2, 3],
                isOpen: true
            };

            expect(() => slice.closeVote()).not.toThrow();
            // Should still record vote history even if seat not found
            expect(mockState.gameState.voteHistory).toHaveLength(1);
        });

        it('should call sync after closing vote', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [],
                isOpen: true
            };

            slice.closeVote();

            expect(mockSync).toHaveBeenCalled();
        });

        it('should add system message on execution', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0, 2, 3],
                isOpen: true
            };

            slice.closeVote();

            expect(addSystemMessage).toHaveBeenCalled();
        });

        it('should add system message on survival', () => {
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0],
                isOpen: true
            };

            slice.closeVote();

            expect(addSystemMessage).toHaveBeenCalled();
        });

        it('should include dead players in alive count correctly', () => {
            // Mark some players as dead
            mockState.gameState.seats[3].isDead = true;
            mockState.gameState.seats[4].isDead = true;
            // Now only 3 alive, need 2 votes (3/2 = 1.5, ceil = 2)
            mockState.gameState.voting = {
                nominatorSeatId: 0,
                nomineeSeatId: 1,
                clockHandSeatId: 1,
                votes: [0, 2], // 2 votes from alive players
                isOpen: true
            };

            slice.closeVote();

            expect(mockState.gameState.seats[1].isDead).toBe(true);
            expect(mockState.gameState.voteHistory[0].result).toBe('executed');
        });
    });
});
