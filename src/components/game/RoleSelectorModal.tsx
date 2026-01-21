import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Skull, FlaskConical, Zap, Crown, Sparkles } from 'lucide-react';
import { ROLES, SCRIPTS, TEAM_COLORS } from '../../constants';
import type { RoleDef, Team } from '../../types';

interface RoleSelectorModalProps {
  seatId: number | null;
  currentScriptId: string;
  onAssignRole: (seatId: number, roleId: string | null) => void;
  onClose: () => void;
}

const RoleSelectorModal: React.FC<RoleSelectorModalProps> = ({
  seatId,
  currentScriptId,
  onAssignRole,
  onClose,
}) => {
  if (seatId === null) return null;

  const currentScriptRoles = SCRIPTS[currentScriptId]?.roles ?? [];

  const rolesByTeam: Record<Team, RoleDef[]> = {
    TOWNSFOLK: [],
    OUTSIDER: [],
    MINION: [],
    DEMON: [],
    TRAVELER: [],
    FABLED: []
  };

  currentScriptRoles.forEach(roleId => {
    const role = ROLES[roleId];
    if (role?.team && role.team in rolesByTeam) {
      rolesByTeam[role.team].push(role);
    }
  });

  const renderRoleSection = (team: Team, title: string, roles: RoleDef[]) => {
    const TeamIcon = team === 'DEMON' ? Skull : team === 'MINION' ? FlaskConical : team === 'OUTSIDER' ? Zap : Crown;

    return (
    <div className="mb-6" key={team}>
      <h4
        className="text-sm font-bold uppercase tracking-widest mb-3 border-b border-stone-700 pb-2 font-cinzel flex items-center gap-2"
        style={{ color: TEAM_COLORS[team] }}
      >
        <TeamIcon className="w-4 h-4" />
        {title}
        <span className="text-stone-600 text-xs ml-auto font-serif normal-case">
          ({roles.length})
        </span>
      </h4>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
        {roles.map(role => {
          const RoleIcon = role.team === 'DEMON' ? Skull : role.team === 'MINION' ? FlaskConical : role.team === 'OUTSIDER' ? Zap : Crown;

          return (
          <button
            key={role.id}
            onClick={() => {
              onAssignRole(seatId, role.id);
              onClose();
            }}
            className="p-2 rounded border border-stone-800 bg-stone-950 hover:bg-stone-800 text-xs text-center transition-all flex flex-col items-center justify-center gap-2 h-24 md:h-28 group active:scale-95 relative overflow-hidden cursor-pointer"
            style={{ borderColor: TEAM_COLORS[role.team] + '40' }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
            <div
              className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform bg-black/40 z-10"
              style={{ borderColor: TEAM_COLORS[role.team] }}
            >
              <RoleIcon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <span className="block font-bold text-stone-300 leading-tight scale-95 md:scale-100 z-10 px-1">
              {role.name}
            </span>
          </button>
        )})}
      </div>
    </div>
  )};

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto border-stone-800 glass-panel text-stone-100">
        <CardHeader className="flex flex-row items-center justify-between border-b border-stone-800 pb-4">
          <CardTitle className="text-2xl text-stone-200 font-cinzel tracking-widest flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-red-500" />
            Assign Role ({SCRIPTS[currentScriptId]?.name ?? 'Unknown Script'})
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-6 h-6" />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            {renderRoleSection('TOWNSFOLK', 'Townsfolk', rolesByTeam.TOWNSFOLK)}
            {renderRoleSection('OUTSIDER', 'Outsider', rolesByTeam.OUTSIDER)}
            {renderRoleSection('MINION', 'Minion', rolesByTeam.MINION)}
            {renderRoleSection('DEMON', 'Demon', rolesByTeam.DEMON)}
          </div>
          <div className="mt-8 flex justify-end gap-4">
            <Button
              variant="ghost"
              onClick={() => {
                onAssignRole(seatId, null);
                onClose();
              }}
              className="text-stone-500 hover:text-red-400"
            >
              CLEAR ROLE
            </Button>
            <Button variant="secondary" onClick={onClose}>
              CANCEL
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleSelectorModal;
