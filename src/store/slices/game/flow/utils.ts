import { NIGHT_ORDER_FIRST, NIGHT_ORDER_OTHER } from '../../../../constants';
import { Seat } from '../../../../types';

/**
 * Calculate night action queue based on alive roles
 * @param seats Current game seats
 * @param isFirstNight Whether this is the first night
 * @returns Array of role IDs in execution order
 */
export function calculateNightQueue(seats: Seat[], isFirstNight: boolean): string[] {
    const orderList = isFirstNight ? NIGHT_ORDER_FIRST : NIGHT_ORDER_OTHER;

    const activeRoleIds = seats
        .filter(s => s.roleId && !s.isDead)
        .map(s => s.roleId!);

    return orderList.filter(roleId => activeRoleIds.includes(roleId));
}

/**
 * Calculate voting result based on vote count and alive players
 * @param voteCount Number of votes received
 * @param aliveCount Number of alive players
 * @returns Whether the nominee should be executed
 */
export function calculateVoteResult(voteCount: number, aliveCount: number): boolean {
    return voteCount >= (aliveCount / 2) && voteCount > 0;
}
