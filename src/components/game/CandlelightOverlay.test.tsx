/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { CandlelightOverlay } from './CandlelightOverlay';

// Mock framer-motion and hooks
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

vi.mock('../../hooks/useSoundEffect', () => ({
  useSoundEffect: () => ({
    playSound: vi.fn(),
  }),
}));

describe('CandlelightOverlay', () => {
  it('renders canvas element when active', () => {
    const { container } = render(
      <CandlelightOverlay width={800} height={600} isActive />
    );
    expect(container.querySelector('canvas')).toBeTruthy();
  });

  it('does not render when not active', () => {
    const { container } = render(
      <CandlelightOverlay width={800} height={600} isActive={false} />
    );
    expect(container.querySelector('canvas')).toBeNull();
  });
});
