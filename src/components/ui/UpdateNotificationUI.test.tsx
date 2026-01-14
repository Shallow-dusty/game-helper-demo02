import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { UpdateNotificationUI } from './UpdateNotificationUI';

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  Download: () => <span>Download</span>,
}));

// Mock Button component
vi.mock('./button', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

describe('UpdateNotificationUI', () => {
  const defaultProps = {
    isOpen: true,
    onRefresh: vi.fn(),
    onDismiss: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<UpdateNotificationUI {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders notification when isOpen is true', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    expect(screen.getByText('ui.updateNotification.title')).toBeInTheDocument();
  });

  it('renders download icon', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    expect(screen.getByText('Download')).toBeInTheDocument();
  });

  it('renders notification title', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    expect(screen.getByText('ui.updateNotification.title')).toBeInTheDocument();
  });

  it('renders notification message', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    expect(screen.getByText('ui.updateNotification.message')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    const closeButton = screen.getByTitle('ui.updateNotification.remindLater');
    expect(closeButton).toBeInTheDocument();
  });

  it('renders later button', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    expect(screen.getByText('ui.updateNotification.later')).toBeInTheDocument();
  });

  it('renders refresh button', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    expect(screen.getByText('ui.updateNotification.refresh')).toBeInTheDocument();
  });

  it('calls onDismiss when close button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<UpdateNotificationUI {...defaultProps} onDismiss={onDismiss} />);

    const closeButton = screen.getByTitle('ui.updateNotification.remindLater');
    fireEvent.click(closeButton);

    // Should call after animation delay
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('calls onDismiss when later button is clicked', async () => {
    const onDismiss = vi.fn();
    render(<UpdateNotificationUI {...defaultProps} onDismiss={onDismiss} />);

    const laterButton = screen.getByText('ui.updateNotification.later');
    fireEvent.click(laterButton);

    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalled();
    }, { timeout: 500 });
  });

  it('calls onRefresh when refresh button is clicked', () => {
    const onRefresh = vi.fn();
    render(<UpdateNotificationUI {...defaultProps} onRefresh={onRefresh} />);

    const refreshButton = screen.getByText('ui.updateNotification.refresh');
    fireEvent.click(refreshButton);

    expect(onRefresh).toHaveBeenCalled();
  });

  it('renders progress indicator', () => {
    const { container } = render(<UpdateNotificationUI {...defaultProps} />);

    const progressBar = container.querySelector('[class*="bg-gradient-to-r"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('applies animation classes', () => {
    const { container } = render(<UpdateNotificationUI {...defaultProps} />);

    const notification = container.firstChild as HTMLElement;
    expect(notification?.className).toContain('animate-in');
    expect(notification?.className).toContain('slide-in-from-bottom');
  });

  it('applies dismissing animation when dismissed', async () => {
    const { container } = render(<UpdateNotificationUI {...defaultProps} />);

    const laterButton = screen.getByText('ui.updateNotification.later');
    fireEvent.click(laterButton);

    // Wait a bit for animation class to be applied
    await new Promise(resolve => setTimeout(resolve, 10));

    const notification = container.firstChild as HTMLElement;
    expect(notification?.className).toContain('animate-out');
  });

  it('positions notification at bottom right', () => {
    const { container } = render(<UpdateNotificationUI {...defaultProps} />);

    const notification = container.firstChild as HTMLElement;
    expect(notification?.className).toContain('fixed');
    expect(notification?.className).toContain('bottom-4');
    expect(notification?.className).toContain('right-4');
  });

  it('has high z-index for visibility', () => {
    const { container } = render(<UpdateNotificationUI {...defaultProps} />);

    const notification = container.firstChild as HTMLElement;
    expect(notification?.className).toContain('z-50');
  });

  it('applies gradient background', () => {
    const { container } = render(<UpdateNotificationUI {...defaultProps} />);

    const notification = container.firstChild as HTMLElement;
    expect(notification?.className).toContain('bg-gradient-to-r');
    expect(notification?.className).toContain('from-amber-900');
  });

  it('renders with backdrop blur', () => {
    const { container } = render(<UpdateNotificationUI {...defaultProps} />);

    const notification = container.firstChild as HTMLElement;
    expect(notification?.className).toContain('backdrop-blur-sm');
  });

  it('renders refresh button with distinct styling', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    const refreshButton = screen.getByText('ui.updateNotification.refresh').closest('button');
    expect(refreshButton?.className).toContain('bg-amber-600');
  });

  it('renders later button with ghost styling', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    const laterButton = screen.getByText('ui.updateNotification.later').closest('button');
    expect(laterButton?.className).toContain('text-stone-400');
  });

  it('renders X icon in close button', () => {
    render(<UpdateNotificationUI {...defaultProps} />);

    const closeButton = screen.getByTitle('ui.updateNotification.remindLater');
    expect(closeButton.querySelector('span')).toHaveTextContent('X');
  });
});
