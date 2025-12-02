/**
 * useGameInteractions Hook - v2.0
 * 
 * Provides access to game interaction logs for the After-Action Report
 * and game history features.
 */

import { useState, useCallback, useEffect } from 'react';
import { useStore } from '../store';
import { 
    getGameInteractions,
    InteractionLog
} from '../lib/supabaseService';

export interface UseGameInteractionsReturn {
    /** All interactions for the current game */
    interactions: InteractionLog[];
    /** Loading state */
    isLoading: boolean;
    /** Error message if any */
    error: string | null;
    /** Fetch interactions for a specific day */
    fetchByDay: (day: number) => Promise<InteractionLog[]>;
    /** Refresh all interactions */
    refresh: () => Promise<void>;
    /** Get interactions grouped by day */
    getByDay: () => Map<number, InteractionLog[]>;
    /** Get interactions grouped by phase */
    getByPhase: () => Map<string, InteractionLog[]>;
}

export function useGameInteractions(): UseGameInteractionsReturn {
    const user = useStore((s) => s.user);
    const gameState = useStore((s) => s.gameState);
    
    const [interactions, setInteractions] = useState<InteractionLog[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const roomId = user?.roomId;
    
    // Fetch all interactions on mount and when room changes
    useEffect(() => {
        if (!roomId) return;
        
        const fetchInteractions = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const data = await getGameInteractions(roomId);
                setInteractions(data);
            } catch (err) {
                console.error('Failed to fetch interactions:', err);
                setError('Failed to load game interactions');
            } finally {
                setIsLoading(false);
            }
        };
        
        void fetchInteractions();
    }, [roomId]);
    
    // Also refresh when game ends
    useEffect(() => {
        if (!roomId || !gameState?.gameOver?.isOver) return;
        
        const fetchInteractions = async () => {
            try {
                const data = await getGameInteractions(roomId);
                setInteractions(data);
            } catch (err) {
                console.error('Failed to fetch interactions on game end:', err);
            }
        };
        
        void fetchInteractions();
    }, [roomId, gameState?.gameOver?.isOver]);
    
    const fetchByDay = useCallback(async (day: number): Promise<InteractionLog[]> => {
        if (!roomId) return [];
        
        try {
            return await getGameInteractions(roomId, day);
        } catch (err) {
            console.error('Failed to fetch interactions for day:', day, err);
            return [];
        }
    }, [roomId]);
    
    const refresh = useCallback(async () => {
        if (!roomId) return;
        
        setIsLoading(true);
        setError(null);
        try {
            const data = await getGameInteractions(roomId);
            setInteractions(data);
        } catch (err) {
            console.error('Failed to refresh interactions:', err);
            setError('Failed to refresh game interactions');
        } finally {
            setIsLoading(false);
        }
    }, [roomId]);
    
    const getByDay = useCallback((): Map<number, InteractionLog[]> => {
        const grouped = new Map<number, InteractionLog[]>();
        
        for (const interaction of interactions) {
            const day = interaction.gameDay;
            if (!grouped.has(day)) {
                grouped.set(day, []);
            }
            grouped.get(day)!.push(interaction);
        }
        
        return grouped;
    }, [interactions]);
    
    const getByPhase = useCallback((): Map<string, InteractionLog[]> => {
        const grouped = new Map<string, InteractionLog[]>();
        
        for (const interaction of interactions) {
            const phase = interaction.phase;
            if (!grouped.has(phase)) {
                grouped.set(phase, []);
            }
            grouped.get(phase)!.push(interaction);
        }
        
        return grouped;
    }, [interactions]);
    
    return {
        interactions,
        isLoading,
        error,
        fetchByDay,
        refresh,
        getByDay,
        getByPhase,
    };
}
