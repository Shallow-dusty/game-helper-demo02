import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { ROLES } from '@/constants';
import { applyRoleAssignment } from './utils';
import { generateRoleAssignment, checkGameOver, countAlivePlayers } from '@/lib/gameLogic';
import { generateShortId, shuffle } from '@/lib/random';

export const createGameRolesSlice: StoreSlice<Pick<GameSlice, 'assignRole' | 'toggleDead' | 'toggleAbilityUsed' | 'toggleStatus' | 'addReminder' | 'removeReminder' | 'assignRoles' | 'resetRoles' | 'distributeRoles' | 'hideRoles' | 'applyStrategy'>> = (set, get) => ({
    assignRole: (seatId, roleId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    applyRoleAssignment(state.gameState, seat, roleId);

                    // Auto-add reminders
                    const role = roleId ? ROLES[roleId] : undefined;
                    if (role?.reminders && roleId) {
                        seat.reminders = role.reminders.map(text => ({
                            id: generateShortId(),
                            text,
                            sourceRole: roleId,
                            seatId: seatId
                        }));
                    }
                }
            }
        });
        get().sync();
    },

    toggleDead: (seatId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    const aliveCountBeforeDeath = countAlivePlayers(state.gameState.seats);
                    const wasAlive = !seat.isDead;
                    seat.isDead = !seat.isDead;
                    if (seat.isDead && wasAlive) {
                         addSystemMessage(state.gameState, `${seat.userName} 死亡了`);

                         // Bug#3 fix: Check if the dying seat is a demon (not just 'imp')
                         const dyingSeatRole = seat.realRoleId ? ROLES[seat.realRoleId] : null;
                         const isDemon = dyingSeatRole?.team === 'DEMON';

                         if (isDemon) {
                             const scarletWoman = state.gameState.seats.find(s => s.realRoleId === 'scarlet_woman' && !s.isDead);
                             if (scarletWoman && aliveCountBeforeDeath >= 5) {
                                 // Inherit the demon's role
                                 const demonRoleId = seat.realRoleId!;
                                 scarletWoman.realRoleId = demonRoleId;
                                 scarletWoman.seenRoleId = demonRoleId;
                                 // eslint-disable-next-line @typescript-eslint/no-deprecated -- Backward compatibility
                                 scarletWoman.roleId = demonRoleId;
                                 // Reset ability status for inherited role
                                 scarletWoman.hasUsedAbility = false;
                                 addSystemMessage(state.gameState, `${scarletWoman.userName} 继承了 恶魔 身份`, scarletWoman.userId);
                             }
                         }

                         const gameOver = checkGameOver(state.gameState.seats);
                         if (gameOver) {
                             state.gameState.gameOver = gameOver;
                             addSystemMessage(state.gameState, `游戏结束！${gameOver.winner === 'GOOD' ? '好人' : '邪恶'} 获胜 - ${gameOver.reason}`);
                         }
                    }
                }
            }
        });
        get().sync();
    },

    toggleAbilityUsed: (seatId) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.hasUsedAbility = !seat.hasUsedAbility;
                }
            }
        });
        get().sync();
    },

    toggleStatus: (seatId, status) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    if (seat.statuses.includes(status)) {
                        seat.statuses = seat.statuses.filter(s => s !== status);
                    } else {
                        seat.statuses.push(status);
                    }
                }
            }
        });
        get().sync();
    },

    addReminder: (seatId, text, icon, color) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.reminders.push({
                        id: generateShortId(),
                        text,
                        sourceRole: 'manual',
                        seatId,
                        icon,
                        color
                    });
                }
            }
        });
        get().sync();
    },

    removeReminder: (id) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.seats.forEach(seat => {
                    seat.reminders = seat.reminders.filter(r => r.id !== id);
                });
            }
        });
        get().sync();
    },

    assignRoles: () => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                // Use seat count instead of player count
                const seatCount = state.gameState.seats.length;
                if (seatCount < 5) {
                    addSystemMessage(state.gameState, "座位数不足5个，无法自动分配角色。");
                    return;
                }

                const scriptId = state.gameState.currentScriptId;
                const roles = generateRoleAssignment(scriptId, seatCount);
                
                let roleIndex = 0;
                state.gameState.seats.forEach(seat => {
                    // Assign to all seats, regardless of userId
                    const roleId = roles[roleIndex];
                    const gameStateRef = state.gameState;
                    if (roleId && gameStateRef) {
                        applyRoleAssignment(gameStateRef, seat, roleId);
                    }
                    roleIndex++;
                });

                addSystemMessage(state.gameState, `已自动分配角色 (${String(seatCount)}个座位)`);
            }
        });
        get().sync();
    },

    resetRoles: () => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.seats.forEach(s => {
                    s.realRoleId = null;
                    s.seenRoleId = null;
                    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Backward compatibility
                    s.roleId = null;
                    s.reminders = [];
                    s.statuses = [];
                });
                state.gameState.rolesRevealed = false;
                state.gameState.phase = 'SETUP';
            }
        });
        get().sync();
    },

    distributeRoles: () => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.rolesRevealed = true;
                state.gameState.setupPhase = 'READY';
                addSystemMessage(state.gameState, "说书人已发放角色，请查看您的角色卡！");
            }
        });
        get().sync();
    },

    hideRoles: () => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.rolesRevealed = false;
            }
        });
        get().sync();
    },

    applyStrategy: (strategyName, roleIds) => {
        if (!get().user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.seats.forEach(s => {
                    s.realRoleId = null;
                    s.seenRoleId = null;
                    s.reminders = [];
                    s.statuses = [];
                });

                const shuffledRoles = shuffle(roleIds);

                let roleIndex = 0;
                state.gameState.seats.forEach(seat => {
                    // Assign to all seats, regardless of userId
                    if (roleIndex < shuffledRoles.length) {
                        const roleId = shuffledRoles[roleIndex];
                        const gameStateRef = state.gameState;
                        if (roleId && gameStateRef) {
                            applyRoleAssignment(gameStateRef, seat, roleId);
                        }
                        roleIndex++;
                    }
                });

                addSystemMessage(state.gameState, `已应用策略: ${strategyName}`);
            }
        });
        get().sync();
    }
});
