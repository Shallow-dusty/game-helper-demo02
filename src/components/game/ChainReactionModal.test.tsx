/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChainReactionModal } from './ChainReactionModal';
import type { ChainReactionEvent } from '../../lib/chainReaction';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
      <div {...props} onClick={onClick}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock the Button component that uses Slot
vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button {...props} onClick={onClick}>{children}</button>
  ),
}));

describe('ChainReactionModal', () => {
  const mockEvent: ChainReactionEvent = {
    type: 'death',
    title: '玩家死亡事件',
    message: '玩家死亡消息',
    priority: 'medium',
    affectedSeatIds: [1],
    suggestedAction: 'mark_dead',
  };

  const baseProps = {
    isOpen: true,
    events: [mockEvent],
    onConfirm: vi.fn(),
    onSkip: vi.fn(),
    onClose: vi.fn(),
  };

  it('renders nothing when closed', () => {
    const { container } = render(
      <ChainReactionModal {...baseProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when no events', () => {
    const { container } = render(
      <ChainReactionModal {...baseProps} events={[]} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders event message when open with events', () => {
    render(<ChainReactionModal {...baseProps} />);
    // The component renders the message property which is plain text, not a translation key
    expect(screen.getByText('玩家死亡消息')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button clicked', () => {
    const onConfirm = vi.fn();
    render(<ChainReactionModal {...baseProps} onConfirm={onConfirm} />);
    // The component renders translation key for button text
    fireEvent.click(screen.getByText('game.chainReaction.actions.confirm'));
    expect(onConfirm).toHaveBeenCalledWith(mockEvent);
  });

  it('calls onSkip when skip button clicked', () => {
    const onSkip = vi.fn();
    render(<ChainReactionModal {...baseProps} onSkip={onSkip} />);
    fireEvent.click(screen.getByText('game.chainReaction.skip'));
    expect(onSkip).toHaveBeenCalledWith(mockEvent);
  });
});
