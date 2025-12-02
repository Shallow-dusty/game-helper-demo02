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
    
    // Find current user's seat
    const userSeat = gameState?.seats.find(s => s.userId === user?.id);
    const userSeatId = userSeat?.id;
    
    // Check current user's eligibility on mount and when day changes
    useEffect(() => {
        if (!roomId || userSeatId === undefined) return;
        
        const checkEligibility = async () => {
            setIsCheckingEligibility(true);
            try {
                const result = await checkNominationEligibility(roomId, gameDay, userSeatId);
                setCanNominate(result.canNominate);
                setPreviousNominee(result.previousNominee);
            } catch (err) {
                console.error('Failed to check nomination eligibility:', err);
                // Default to allowing nomination if check fails
                setCanNominate(true);
            } finally {
                setIsCheckingEligibility(false);
            }
        };
        
        checkEligibility();
    }, [roomId, gameDay, userSeatId]);
    
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
        
        fetchNominations();
    }, [roomId, gameDay]);
    
    const checkSeatEligibility = useCallback(async (seatId: number): Promise<NominationEligibility> => {
        if (!roomId) {
            return { canNominate: true, reason: null, previousNominee: null };
        }
        
        try {
            return await checkNominationEligibility(roomId, gameDay, seatId);
        } catch (err) {
            console.error('Failed to check seat eligibility:', err);
            return { canNominate: true, reason: null, previousNominee: null };
        }
    }, [roomId, gameDay]);
    
    const makeNomination = useCallback(async (nominatorSeat: number, nomineeSeat: number): Promise<boolean> => {
        if (!roomId) return false;
        
        try {
            const result = await recordNomination(roomId, gameDay, nominatorSeat, nomineeSeat);
            
            if (result.success) {
                // Update local state
                if (nominatorSeat === userSeatId) {
                    setCanNominate(false);
                    setPreviousNominee(nomineeSeat);
                }
                
                // Start the vote
                startVote(nomineeSeat);
                
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
    }, [roomId, gameDay, userSeatId, startVote]);
    
    const refresh = useCallback(async () => {
        if (!roomId) return;
        
        // Re-check eligibility
        if (userSeatId !== undefined) {
            const eligibility = await checkNominationEligibility(roomId, gameDay, userSeatId);
            setCanNominate(eligibility.canNominate);
            setPreviousNominee(eligibility.previousNominee);
        }
        
        // Refresh nominations
        const nominations = await getNominationHistory(roomId, gameDay);
        setTodayNominations(nominations);
    }, [roomId, gameDay, userSeatId]);
    
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
