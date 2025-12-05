import { GameState, Seat, RoleDef } from '../types';
import { ROLES } from '../constants';

export interface SmartInfoResult {
  roleId: string;
  info: string;
  isTrue: boolean;
  targets?: number[]; // Seat IDs involved in the info
}

/**
 * Smart Info Engine
 * Calculates information for specific roles based on the current game state.
 */
export const getSmartInfo = (seatId: number, gameState: GameState): SmartInfoResult | null => {
  const seat = gameState.seats.find(s => s.id === seatId);
  if (!seat || !seat.realRoleId) return null;

  const roleId = seat.realRoleId;
  const roleDef = ROLES[roleId];
  if (!roleDef) return null;

  // Check for Poison/Drunk status (simplified check, ideally should check specific status effects)
  const isPoisoned = seat.statuses.includes('POISONED') || seat.statuses.includes('DRUNK');

  switch (roleId) {
    case 'EMPATH':
      return calculateEmpathInfo(seat, gameState, isPoisoned);
    case 'CHEF':
      return calculateChefInfo(seat, gameState, isPoisoned);
    case 'WASHERWOMAN':
      return calculateTownsfolkInfo(seat, gameState, isPoisoned, 'TOWNSFOLK');
    case 'LIBRARIAN':
      return calculateTownsfolkInfo(seat, gameState, isPoisoned, 'OUTSIDER');
    case 'INVESTIGATOR':
      return calculateTownsfolkInfo(seat, gameState, isPoisoned, 'MINION');
    default:
      return null;
  }
};

// --- Helper Functions ---

const getLivingNeighbors = (seat: Seat, allSeats: Seat[]): [Seat, Seat] => {
  const seatCount = allSeats.length;
  let leftNeighbor = allSeats[(seat.id - 1 + seatCount) % seatCount];
  let rightNeighbor = allSeats[(seat.id + 1) % seatCount];

  // Empath reads living neighbors (usually). 
  // Rules vary, but standard Empath skips dead.
  // Assuming standard rules: Skip dead immediately.
  
  let offset = 1;
  while (leftNeighbor.isDead && offset < seatCount) {
    offset++;
    leftNeighbor = allSeats[(seat.id - offset + seatCount) % seatCount];
  }

  offset = 1;
  while (rightNeighbor.isDead && offset < seatCount) {
    offset++;
    rightNeighbor = allSeats[(seat.id + offset) % seatCount];
  }

  return [leftNeighbor, rightNeighbor];
};

const calculateEmpathInfo = (seat: Seat, gameState: GameState, isPoisoned: boolean): SmartInfoResult => {
  const [left, right] = getLivingNeighbors(seat, gameState.seats);
  
  let evilCount = 0;
  if (ROLES[left.realRoleId || '']?.team === 'EVIL') evilCount++;
  if (ROLES[right.realRoleId || '']?.team === 'EVIL') evilCount++;

  const trueInfo = evilCount.toString();
  const falseInfo = ((evilCount + 1) % 3).toString(); // Simple false info generation

  return {
    roleId: 'EMPATH',
    info: isPoisoned ? falseInfo : trueInfo,
    isTrue: !isPoisoned,
    targets: [left.id, right.id]
  };
};

const calculateChefInfo = (seat: Seat, gameState: GameState, isPoisoned: boolean): SmartInfoResult => {
  let evilPairs = 0;
  const seats = gameState.seats;
  const count = seats.length;

  // Chef logic: Pairs of Evil players.
  // Standard Chef: "You start knowing how many pairs of evil players there are."
  // Usually implies immediate neighbors, skipping dead? Or just all neighbors?
  // TB Rule: "Pairs of evil players neighboring each other." (Skips dead? No, usually Chef sees setup state, so includes everyone? Or current state?)
  // TB Almanac: "Detects pairs of evil players... acting on the current state."
  // Usually Chef acts on the first night, so everyone is alive.
  // If acting later (e.g. Bone Collector), it might skip dead.
  // Let's assume standard First Night Chef: All players considered (or just alive ones if run mid-game).
  // For simplicity, let's check ALL immediate neighbors regardless of death, as Chef is a "First Night" role usually.
  
  for (let i = 0; i < count; i++) {
    const current = seats[i];
    const next = seats[(i + 1) % count];
    
    const isCurrentEvil = ROLES[current.realRoleId || '']?.team === 'EVIL';
    const isNextEvil = ROLES[next.realRoleId || '']?.team === 'EVIL';

    if (isCurrentEvil && isNextEvil) {
      evilPairs++;
    }
  }

  const trueInfo = evilPairs.toString();
  const falseInfo = (evilPairs + 1).toString();

  return {
    roleId: 'CHEF',
    info: isPoisoned ? falseInfo : trueInfo,
    isTrue: !isPoisoned
  };
};

const calculateTownsfolkInfo = (seat: Seat, gameState: GameState, isPoisoned: boolean, targetTeam: 'TOWNSFOLK' | 'OUTSIDER' | 'MINION'): SmartInfoResult => {
  // Logic: Find 1 correct target and 1 decoy.
  // Washerwoman -> Townsfolk
  // Librarian -> Outsider
  // Investigator -> Minion
  
  const validTargets = gameState.seats.filter(s => {
    const def = ROLES[s.realRoleId || ''];
    return def && def.team === targetTeam && s.id !== seat.id;
  });

  if (validTargets.length === 0) {
    return {
      roleId: seat.realRoleId!,
      info: "No targets found (0)",
      isTrue: true
    };
  }

  // Pick one true target
  const trueTarget = validTargets[Math.floor(Math.random() * validTargets.length)];
  const trueRoleName = ROLES[trueTarget.realRoleId!]?.name;

  // Pick a decoy (anyone else)
  const otherSeats = gameState.seats.filter(s => s.id !== seat.id && s.id !== trueTarget.id);
  const decoy = otherSeats[Math.floor(Math.random() * otherSeats.length)];
  
  if (!decoy || !trueRoleName) return { roleId: seat.realRoleId!, info: "Error", isTrue: false };

  // Format: "A or B is the [Role]"
  const info = `${trueTarget.userName} or ${decoy.userName} is the ${trueRoleName}`;
  
  // If poisoned, we should give false info.
  // False info: "A or B is [Wrong Role]" OR "[Wrong People] is [Role]"
  // For simplicity, let's just swap the role name to something else.
  
  let finalInfo = info;
  if (isPoisoned) {
     // Pick a random role of the same type
     const allRolesOfTeam = Object.values(ROLES).filter(r => r.team === targetTeam);
     const randomRole = allRolesOfTeam[Math.floor(Math.random() * allRolesOfTeam.length)];
     finalInfo = `${trueTarget.userName} or ${decoy.userName} is the ${randomRole.name}`;
  }

  return {
    roleId: seat.realRoleId!,
    info: finalInfo,
    isTrue: !isPoisoned,
    targets: [trueTarget.id, decoy.id]
  };
};
