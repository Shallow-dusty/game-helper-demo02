
import { lazy, Suspense } from 'react';
import { useStore } from './store';
import { useSandboxStore } from './sandboxStore';
import { useShallow } from 'zustand/react/shallow';

// Loading
import { LoadingFallback } from './components/ui/LoadingFallback';

// Core
import { Lobby } from './components/lobby/Lobby';
import { RoomSelection } from './components/lobby/RoomSelection';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// Lazy shells
const TownSquare = lazy(() => import('./components/game/TownSquare').then(m => ({ default: m.TownSquare })));
const SandboxView = lazy(() => import('./components/sandbox/SandboxView').then(m => ({ default: m.SandboxView })));
const StorytellerShell = lazy(() => import('./components/app/StorytellerShell').then(m => ({ default: m.StorytellerShell })));
const PlayerShell = lazy(() => import('./components/app/PlayerShell').then(m => ({ default: m.PlayerShell })));

const useAppState = () => useStore(
  useShallow(state => ({
    user: state.user,
  }))
);

const App = () => {
  const { user } = useAppState();
  const gameState = useStore(state => state.gameState);
  const isSandboxActive = useSandboxStore(state => state.isActive);

  if (window.location.pathname === '/townsquare' || window.location.search.includes('mode=townsquare')) {
    return (
      <Suspense fallback={<LoadingFallback fullScreen message="加载广场视图..." />}>
        <TownSquare />
      </Suspense>
    );
  }

  if (!user) {
    return <Lobby />;
  }

  if (isSandboxActive) {
    return (
      <Suspense fallback={<LoadingFallback fullScreen message="加载沙盒模式..." />}>
        <SandboxView />
      </Suspense>
    );
  }

  if (!gameState) {
    return <RoomSelection />;
  }

  return (
    <Suspense fallback={<LoadingFallback fullScreen message="加载游戏界面..." />}>
      {user.isStoryteller ? (
        <StorytellerShell user={user} gameState={gameState} />
      ) : (
        <PlayerShell user={user} gameState={gameState} />
      )}
    </Suspense>
  );
};

const AppWithErrorBoundary = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default AppWithErrorBoundary;
