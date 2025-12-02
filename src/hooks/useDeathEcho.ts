import { useState, useCallback } from 'react';

/**
 * Hook: 用于触发死亡效果
 */
export const useDeathEcho = () => {
  const [deathInfo, setDeathInfo] = useState<{ seatId: number; playerName: string } | null>(null);

  const triggerDeathEcho = useCallback((seatId: number, playerName: string) => {
    setDeathInfo({ seatId, playerName });
  }, []);

  const clearDeathEcho = useCallback(() => {
    setDeathInfo(null);
  }, []);

  return {
    deathSeatId: deathInfo?.seatId ?? null,
    playerName: deathInfo?.playerName,
    triggerDeathEcho,
    clearDeathEcho,
  };
};
