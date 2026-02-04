import type { GameState, User } from '../../types';
import { GameShell } from './GameShell';

interface PlayerShellProps {
  user: User;
  gameState: GameState;
}

export const PlayerShell: React.FC<PlayerShellProps> = ({ user, gameState }) => (
  <GameShell user={user} gameState={gameState} mode="player" />
);
