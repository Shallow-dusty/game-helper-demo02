import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { ROLES } from '../../../constants';
import { applyRoleAssignment } from './utils';
import { generateRoleAssignment, checkGameOver } from '../../../lib/gameLogic';

export const createGameRolesSlice: StoreSlice<Pick<GameSlice, 'assignRole' | 'toggleDead' | 'toggleAbilityUsed' | 'toggleStatus' | 'addReminder' | 'removeReminder' | 'assignRoles' | 'resetRoles' | 'distributeRoles' | 'hideRoles' | 'applyStrategy'>> = (set, get) => ({
    assignRole: (seatId, roleId) => {
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    applyRoleAssignment(state.gameState, seat, roleId);

                    // Auto-add reminders
                    const role = roleId ? ROLES[roleId] : undefined;
                    if (role?.reminders) {
                        seat.reminders = role.reminders.map(text => ({
                            id: Math.random().toString(36).substring(2, 11),
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
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.isDead = !seat.isDead;
                    if (seat.isDead) {
                         addSystemMessage(state.gameState, `${seat.userName} 死亡了`);
                         
                         const demon = state.gameState.seats.find(s => s.realRoleId === 'imp');
                         if (demon?.isDead) {
                             const scarletWoman = state.gameState.seats.find(s => s.realRoleId === 'scarlet_woman' && !s.isDead);
                             if (scarletWoman) {
                                 scarletWoman.realRoleId = 'imp';
                                 scarletWoman.seenRoleId = 'imp';
                                 // eslint-disable-next-line @typescript-eslint/no-deprecated -- Backward compatibility
                                 scarletWoman.roleId = 'imp';
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
        set((state) => {
            if (state.gameState) {
                const seat = state.gameState.seats.find(s => s.id === seatId);
                if (seat) {
                    seat.reminders.push({
                        id: Math.random().toString(36).substring(2, 11),
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
        set((state) => {
            if (state.gameState) {
                state.gameState.rolesRevealed = false;
            }
        });
        get().sync();
    },

    applyStrategy: (strategyName, roleIds) => {
        set((state) => {
            if (state.gameState) {
                state.gameState.seats.forEach(s => {
                    s.realRoleId = null;
                    s.seenRoleId = null;
                    s.reminders = [];
                    s.statuses = [];
                });

                const shuffledRoles = [...roleIds].sort(() => Math.random() - 0.5);

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
