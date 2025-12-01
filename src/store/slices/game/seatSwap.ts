import { StoreSlice, GameSlice } from '../../types';

export const createGameSeatSwapSlice: StoreSlice<Pick<GameSlice, 'swapSeats' | 'requestSeatSwap' | 'respondToSwapRequest' | 'forceLeaveSeat'>> = (set, get) => ({
    swapSeats: (seatId1, seatId2) => {
        set((state) => {
            if (state.gameState) {
                const s1 = state.gameState.seats.find(s => s.id === seatId1);
                const s2 = state.gameState.seats.find(s => s.id === seatId2);
                if (s1 && s2) {
                    const tempUser = { userId: s1.userId, userName: s1.userName, isVirtual: s1.isVirtual };
                    s1.userId = s2.userId;
                    s1.userName = s2.userName;
                    s1.isVirtual = s2.isVirtual;
                    
                    s2.userId = tempUser.userId;
                    s2.userName = tempUser.userName;
                    s2.isVirtual = tempUser.isVirtual;
                }
            }
        });
        get().sync();
    },

    requestSeatSwap: (toSeatId) => {
        const { user } = get();
        if (!user) return;
        set((state) => {
            if (state.gameState) {
                const fromSeat = state.gameState.seats.find(s => s.userId === user.id);
                const toSeat = state.gameState.seats.find(s => s.id === toSeatId);
                if (fromSeat && toSeat?.userId) {
                    state.gameState.swapRequests.push({
                        id: Date.now().toString(),
                        fromSeatId: fromSeat.id,
                        fromUserId: user.id,
                        fromName: user.name,
                        toSeatId: toSeat.id,
                        toUserId: toSeat.userId,
                        timestamp: Date.now()
                    });
                }
            }
        });
        get().sync();
    },

    respondToSwapRequest: (requestId, accept) => {
        set((state) => {
            if (state.gameState) {
                const reqIndex = state.gameState.swapRequests.findIndex(r => r.id === requestId);
                if (reqIndex !== -1) {
                    // const req = state.gameState.swapRequests[reqIndex];
                    if (accept) {
                        // Placeholder
                    }
                    state.gameState.swapRequests.splice(reqIndex, 1);
                }
            }
        });
        get().sync();
    },

    forceLeaveSeat: (seatId) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.userId = null;
                    seat.userName = `座位 ${seat.id + 1}`;
                    seat.roleId = null;
                }
            }
        });
        get().sync();
    }
});
