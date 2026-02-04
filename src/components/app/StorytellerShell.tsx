import type { GameState, User } from '../../types';
import { GameShell } from './GameShell';

interface StorytellerShellProps {
  user: User;
  gameState: GameState;
}

export const StorytellerShell: React.FC<StorytellerShellProps> = ({ user, gameState }) => (
  <GameShell user={user} gameState={gameState} mode="storyteller" />
);
