import { getNightOrder } from '@/constants/nightOrder';
import { Seat } from '@/types';

const getRequiredVotes = (aliveCount: number): number => {
    return aliveCount > 0 ? Math.ceil(aliveCount / 2) : 0;
};

/**
 * Calculate night action queue based on alive roles
 * Uses realRoleId (true identity) for determining actual abilities
 * @param seats Current game seats
 * @param isFirstNight Whether this is the first night
 * @returns Array of role IDs in execution order
 */
export function calculateNightQueue(seats: Seat[], isFirstNight: boolean, scriptId?: string): string[] {
    const orderList = getNightOrder(scriptId ?? 'tb', isFirstNight);

    const roleCounts = new Map<string, { alive: number; dead: number }>();
    seats.forEach((seat) => {
        const roleId = seat.realRoleId;
        if (!roleId) return;
        const entry = roleCounts.get(roleId) ?? { alive: 0, dead: 0 };
        if (seat.isDead) {
            entry.dead += 1;
        } else {
            entry.alive += 1;
        }
        roleCounts.set(roleId, entry);
    });

    return orderList.filter((roleId) => {
        const counts = roleCounts.get(roleId);
        return counts ? counts.alive > 0 : false;
    });
}

/**
 * Calculate voting result based on vote count and alive players
 * Blood on the Clocktower requires at least HALF of living players' votes
 * - 5 players: need 3 votes (>=2.5)
 * - 6 players: need 3 votes (>=3)
 * - 7 players: need 4 votes (>=3.5)
 * @param voteCount Number of votes received
 * @param aliveCount Number of alive players
 * @returns Whether the nominee should be executed
 */
export function calculateVoteResult(voteCount: number, aliveCount: number): boolean {
    const requiredVotes = getRequiredVotes(aliveCount);
    return voteCount >= requiredVotes && voteCount > 0;
}

export function getVoteThreshold(aliveCount: number): number {
    return getRequiredVotes(aliveCount);
}
