/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { DeathEchoEffect } from './DeathEchoEffect';

// Mock framer-motion and hooks
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
    path: (props: object) => <path {...props} />,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

vi.mock('../../hooks/useSoundEffect', () => ({
  useSoundEffect: () => ({
    playSound: vi.fn(),
  }),
}));

describe('DeathEchoEffect', () => {
  it('does not crash when deathSeatId is null', () => {
    const { container } = render(
      <DeathEchoEffect deathSeatId={null} playerName="Test" onComplete={vi.fn()} />
    );
    // Component should render without crashing even if not active
    expect(container).toBeDefined();
  });

  it('renders without error when deathSeatId is provided', () => {
    const { container } = render(
      <DeathEchoEffect deathSeatId={1} playerName="TestPlayer" onComplete={vi.fn()} />
    );
    expect(container).toBeDefined();
  });
});
