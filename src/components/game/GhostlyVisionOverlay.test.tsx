import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { GhostlyVisionOverlay } from './GhostlyVisionOverlay';

// Mock framer-motion to avoid animation issues in test
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.PropsWithChildren<object>) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: React.PropsWithChildren<object>) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

describe('GhostlyVisionOverlay', () => {
  it('renders nothing when isActive is false', () => {
    const { container } = render(<GhostlyVisionOverlay isActive={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders overlay when isActive is true', () => {
    const { container } = render(<GhostlyVisionOverlay isActive playerName="TestPlayer" />);
    // The overlay should render a style element and motion elements
    expect(container.querySelector('style')).toBeTruthy();
  });
});
