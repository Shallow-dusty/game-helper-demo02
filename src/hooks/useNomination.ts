/**
 * useNomination Hook - v2.0
 * 
 * Provides nomination management with database integration for
 * checking eligibility and recording nominations.
 */

import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { 
    checkNominationEligibility, 
    recordNomination,
    getNominationHistory,
    NominationEligibility,
    NominationRecord
} from '../lib/supabaseService';

export interface UseNominationReturn {
    /** Whether the current player can nominate today */
    canNominate: boolean;
    /** Loading state for eligibility check */
    isCheckingEligibility: boolean;
    /** If already nominated, the seat ID of the previous nominee */
    previousNominee: number | null;
    /** Today's nomination history */
    todayNominations: NominationRecord[];
    /** Check if a specific seat can nominate */
    checkSeatEligibility: (seatId: number) => Promise<NominationEligibility>;
    /** Record a nomination (returns success) */
    makeNomination: (nominatorSeat: number, nomineeSeat: number) => Promise<boolean>;
    /** Refresh nomination data */
    refresh: () => Promise<void>;
}

export function useNomination(): UseNominationReturn {
    const user = useStore((s) => s.user);
    const gameState = useStore((s) => s.gameState);
    const startVote = useStore((s) => s.startVote);
    
    const [canNominate, setCanNominate] = useState(true);
    const [isCheckingEligibility, setIsCheckingEligibility] = useState(false);
    const [previousNominee, setPreviousNominee] = useState<number | null>(null);
    const [todayNominations, setTodayNominations] = useState<NominationRecord[]>([]);
    
    const roomId = user?.roomId;
    const gameDay = gameState?.roundInfo?.dayCount ?? 1;
    const ruleAutomationLevel = gameState?.ruleAutomationLevel ?? 'GUIDED';
    const shouldEnforceRules = ruleAutomationLevel === 'FULL_AUTO';
    
    // Find current user's seat
    const userSeat = gameState?.seats.find(s => s.userId === user?.id);
    const userSeatId = userSeat?.id;

    const getSeatRoleId = (seat?: { realRoleId?: string | null; seenRoleId?: string | null; roleId?: string | null }) => {
        if (!seat) return null;
        return seat.realRoleId ?? seat.seenRoleId ?? seat.roleId ?? null;
    };

    const getLocalNominationStatus = useCallback((nominatorSeatId: number, nomineeSeatId?: number): NominationEligibility => {
        if (!gameState) {
            return { canNominate: false, reason: '未找到游戏状态', previousNominee: null };
        }

        if (gameState.phase !== 'DAY') {
            return { canNominate: false, reason: '只能在白天提名', previousNominee: null };
        }

        if (gameState.dailyExecutionCompleted) {
            return { canNominate: false, reason: '今日已处决', previousNominee: null };
        }

        const nominatorSeat = gameState.seats.find(s => s.id === nominatorSeatId);
        if (!nominatorSeat?.userId) {
            return { canNominate: false, reason: '提名者未入座', previousNominee: null };
        }
        if (nominatorSeat.isDead) {
            return { canNominate: false, reason: '死亡玩家不能提名', previousNominee: null };
        }

        const todaysNominations = gameState.dailyNominations.filter(n => n.round === gameDay);
        const nominationLimit = getSeatRoleId(nominatorSeat) === 'butcher' ? 2 : 1;
        const nominatorHistory = todaysNominations.filter(n => n.nominatorSeatId === nominatorSeatId);
        if (nominatorHistory.length >= nominationLimit) {
            const lastNominee = nominatorHistory[nominatorHistory.length - 1]?.nomineeSeatId ?? null;
            return { canNominate: false, reason: '今日已提名', previousNominee: lastNominee };
        }

        if (nomineeSeatId !== undefined) {
            const nomineeSeat = gameState.seats.find(s => s.id === nomineeSeatId);
            if (!nomineeSeat?.userId) {
                return { canNominate: false, reason: '被提名者未入座', previousNominee: null };
            }
            if (nomineeSeat.isDead) {
                return { canNominate: false, reason: '被提名者已死亡', previousNominee: null };
            }
            if (todaysNominations.some(n => n.nomineeSeatId === nomineeSeatId)) {
                return { canNominate: false, reason: '该玩家今日已被提名', previousNominee: null };
            }
        }

        return { canNominate: true, reason: null, previousNominee: null };
    }, [gameState, gameDay]);
    
    // Check current user's eligibility on mount and when day changes
    useEffect(() => {
        if (!roomId || userSeatId === undefined) return;
        
        const checkEligibility = async () => {
            setIsCheckingEligibility(true);
            try {
                const localEligibility = getLocalNominationStatus(userSeatId);
                if (shouldEnforceRules && !localEligibility.canNominate) {
                    setCanNominate(false);
                    setPreviousNominee(localEligibility.previousNominee);
                    return;
                }
                const result = await checkNominationEligibility(roomId, gameDay, userSeatId);
                setCanNominate(shouldEnforceRules ? result.canNominate : true);
                setPreviousNominee(result.previousNominee);
            } catch (err) {
                console.error('Failed to check nomination eligibility:', err);
                // Fail closed only when enforcing rules
                setCanNominate(!shouldEnforceRules);
            } finally {
                setIsCheckingEligibility(false);
            }
        };
        
        void checkEligibility();
    }, [roomId, gameDay, userSeatId, getLocalNominationStatus, shouldEnforceRules]);
    
    // Fetch today's nominations
    useEffect(() => {
        if (!roomId) return;
        
        const fetchNominations = async () => {
            try {
                const nominations = await getNominationHistory(roomId, gameDay);
                setTodayNominations(nominations);
            } catch (err) {
                console.error('Failed to fetch nominations:', err);
            }
        };
        
        void fetchNominations();
    }, [roomId, gameDay]);
    
    const checkSeatEligibility = useCallback(async (seatId: number): Promise<NominationEligibility> => {
        if (!roomId || !gameState) {
            return { canNominate: false, reason: '未找到房间信息', previousNominee: null };
        }

        const localEligibility = getLocalNominationStatus(seatId);
        if (shouldEnforceRules && !localEligibility.canNominate) {
            return localEligibility;
        }
        
        try {
            const result = await checkNominationEligibility(roomId, gameDay, seatId);
            return shouldEnforceRules ? result : { ...result, canNominate: true };
        } catch (err) {
            console.error('Failed to check seat eligibility:', err);
            return { canNominate: !shouldEnforceRules, reason: '资格检查失败', previousNominee: null };
        }
    }, [roomId, gameDay, gameState, getLocalNominationStatus, shouldEnforceRules]);
    
    const makeNomination = useCallback(async (nominatorSeat: number, nomineeSeat: number): Promise<boolean> => {
        if (!roomId || !gameState) return false;

        const localEligibility = getLocalNominationStatus(nominatorSeat, nomineeSeat);
        if (shouldEnforceRules && !localEligibility.canNominate) {
            if (nominatorSeat === userSeatId) {
                setCanNominate(false);
                setPreviousNominee(localEligibility.previousNominee);
            }
            return false;
        }
        
        try {
            const result = await recordNomination(roomId, gameDay, nominatorSeat, nomineeSeat);
            
            if (result.success) {
                // Update local state
                if (nominatorSeat === userSeatId) {
                    setCanNominate(false);
                    setPreviousNominee(nomineeSeat);
                }
                
                // Start the vote
                startVote(nomineeSeat, nominatorSeat);
                
                // Refresh nomination list
                const nominations = await getNominationHistory(roomId, gameDay);
                setTodayNominations(nominations);
                
                return true;
            } else {
                console.warn('Nomination failed:', result.error);
                return false;
            }
        } catch (err) {
            console.error('Error making nomination:', err);
            return false;
        }
    }, [roomId, gameDay, userSeatId, startVote, gameState, getLocalNominationStatus, shouldEnforceRules]);
    
    const refresh = useCallback(async () => {
        if (!roomId || !gameState) return;
        
        // Re-check eligibility
        if (userSeatId !== undefined) {
            try {
                const localEligibility = getLocalNominationStatus(userSeatId);
                if (shouldEnforceRules && !localEligibility.canNominate) {
                    setCanNominate(false);
                    setPreviousNominee(localEligibility.previousNominee);
                } else {
                    const eligibility = await checkNominationEligibility(roomId, gameDay, userSeatId);
                    setCanNominate(shouldEnforceRules ? eligibility.canNominate : true);
                    setPreviousNominee(eligibility.previousNominee);
                }
            } catch (err) {
                console.error('Failed to refresh nomination eligibility:', err);
                setCanNominate(!shouldEnforceRules);
                setPreviousNominee(null);
            }
        }
        
        // Refresh nominations
        const nominations = await getNominationHistory(roomId, gameDay);
        setTodayNominations(nominations);
    }, [roomId, gameDay, userSeatId, gameState, getLocalNominationStatus, shouldEnforceRules]);
    
    return {
        canNominate,
        isCheckingEligibility,
        previousNominee,
        todayNominations,
        checkSeatEligibility,
        makeNomination,
        refresh,
    };
}
