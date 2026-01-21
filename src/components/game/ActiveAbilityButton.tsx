import React, { useState } from 'react';
import { useStore } from '../../store';
import { RoleDef, Seat, GamePhase } from '../../types';
import { useTranslation } from 'react-i18next';
import { Icon } from '../ui/Icon';

// Roles with active day abilities
export const ACTIVE_ABILITY_ROLES: Record<string, {
    name: string;
    buttonText: string;
    iconName: keyof typeof import('lucide-react');
    phase: 'DAY' | 'ANY';
    requiresTarget: boolean;
    description: string;
}> = {
    slayer: {
        name: 'game.activeAbility.roles.slayer.name',
        buttonText: 'game.activeAbility.roles.slayer.button',
        iconName: 'Target',
        phase: 'DAY',
        requiresTarget: true,
        description: 'game.activeAbility.roles.slayer.description'
    },
    virgin: {
        name: 'game.activeAbility.roles.virgin.name',
        buttonText: 'game.activeAbility.roles.virgin.button',
        iconName: 'Flame',
        phase: 'DAY',
        requiresTarget: false,
        description: 'game.activeAbility.roles.virgin.description'
    },
    artist: {
        name: 'game.activeAbility.roles.artist.name',
        buttonText: 'game.activeAbility.roles.artist.button',
        iconName: 'Palette',
        phase: 'DAY',
        requiresTarget: false,
        description: 'game.activeAbility.roles.artist.description'
    },
    juggler: {
        name: 'game.activeAbility.roles.juggler.name',
        buttonText: 'game.activeAbility.roles.juggler.button',
        iconName: 'Sparkles',
        phase: 'DAY',
        requiresTarget: true,
        description: 'game.activeAbility.roles.juggler.description'
    },
    gossip: {
        name: 'game.activeAbility.roles.gossip.name',
        buttonText: 'game.activeAbility.roles.gossip.button',
        iconName: 'MessageCircle',
        phase: 'DAY',
        requiresTarget: false,
        description: 'game.activeAbility.roles.gossip.description'
    }
};

interface ActiveAbilityButtonProps {
    role: RoleDef;
    seat: Seat;
    gamePhase: GamePhase;
}

export const ActiveAbilityButton: React.FC<ActiveAbilityButtonProps> = ({ role, seat, gamePhase }) => {
    const { t } = useTranslation();
    const sendMessage = useStore(state => state.sendMessage);
    const [showModal, setShowModal] = useState(false);
    const [targetInput, setTargetInput] = useState('');

    const abilityConfig = ACTIVE_ABILITY_ROLES[role.id];

    // Don't show if role has no active ability
    if (!abilityConfig) return null;

    // Don't show if ability already used
    if (seat.hasUsedAbility) {
        return (
            <div className="mt-3 pt-3 border-t border-gothic-border">
                <div className="text-xs text-gothic-muted italic flex items-center gap-2">
                    <Icon icon="Ban" size="sm" variant="muted" />
                    <span>{t('game.activeAbility.abilityUsed')}</span>
                </div>
            </div>
        );
    }

    // Check phase requirement
    const canUse = abilityConfig.phase === 'ANY' || gamePhase === abilityConfig.phase;

    const handleActivate = () => {
        if (abilityConfig.requiresTarget) {
            setShowModal(true);
        } else {
            // Send activation message to chat
            sendMessage(`⚡ 【${role.name}】${t('game.activeAbility.skillActivated')}: ${t(abilityConfig.description)}`, null);
            setShowModal(false);
        }
    };

    const handleSubmitTarget = () => {
        if (targetInput.trim()) {
            sendMessage(`⚡ 【${role.name}】${t('game.activeAbility.skillActivated')} → ${t('game.activeAbility.target')}: ${targetInput}`, null);
            setTargetInput('');
            setShowModal(false);
        }
    };
    
    return (
        <>
            <div className="mt-3 pt-3 border-t border-gothic-border">
                <button
                    onClick={handleActivate}
                    disabled={!canUse}
                    className={`w-full py-2 px-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        canUse
                            ? 'bg-gothic-holy/20 hover:bg-gothic-holy/30 text-gothic-holy border border-gothic-holy/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                            : 'bg-gothic-surface text-gothic-muted border border-gothic-border cursor-not-allowed'
                    }`}
                >
                    <Icon icon={abilityConfig.iconName} size="sm" variant={canUse ? 'holy' : 'muted'} />
                    <span>{t(abilityConfig.buttonText)}</span>
                </button>
                {!canUse && (
                    <p className="text-[10px] text-gothic-muted mt-1 text-center">
                        {t('game.activeAbility.onlyDuringDay', {
                            phase: abilityConfig.phase === 'DAY' ? t('phase.day', { count: 1 }).split(' ')[0] : t('game.activeAbility.onlyDuringAnyPhase')
                        })}
                    </p>
                )}
            </div>

            {/* Target Selection Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gothic-overlay z-50 flex items-center justify-center p-4 cursor-pointer" onClick={() => setShowModal(false)}>
                    <div className="bg-gothic-surface border border-gothic-border rounded-lg p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gothic-accent mb-2 flex items-center gap-2 font-cinzel">
                            <Icon icon={abilityConfig.iconName} size="md" variant="accent" />
                            {role.name}
                        </h3>
                        <p className="text-sm text-gothic-muted mb-4">{t(abilityConfig.description)}</p>

                        <input
                            type="text"
                            value={targetInput}
                            onChange={e => setTargetInput(e.target.value)}
                            placeholder={t('game.activeAbility.enterTargetPlaceholder')}
                            className="w-full bg-gothic-bg border border-gothic-border rounded px-3 py-2 text-sm text-gothic-text mb-4"
                            autoFocus
                        />

                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2 bg-gothic-surface text-gothic-muted rounded text-sm hover:bg-gothic-card transition-colors cursor-pointer"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSubmitTarget}
                                disabled={!targetInput.trim()}
                                className="flex-1 py-2 bg-gothic-holy hover:bg-gothic-holy/80 text-gothic-bg-dark rounded text-sm font-bold disabled:opacity-50 cursor-pointer transition-colors"
                            >
                                {t('game.activeAbility.confirmActivation')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};




