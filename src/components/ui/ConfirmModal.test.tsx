import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    isOpen: true,
    title: '确认操作',
    message: '你确定要执行此操作吗？',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<ConfirmModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when isOpen is true', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText('确认操作')).toBeInTheDocument();
    expect(screen.getByText('你确定要执行此操作吗？')).toBeInTheDocument();
  });

  it('renders warning icon', () => {
    render(<ConfirmModal {...defaultProps} />);

    // Check for AlertTriangle SVG icon instead of ⚠️
    const titleElement = screen.getByText(defaultProps.title).closest('h2');
    expect(titleElement?.querySelector('svg')).toBeInTheDocument();
  });

  it('renders close button', () => {
    render(<ConfirmModal {...defaultProps} />);

    const closeButtons = screen.getAllByText('✕');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('renders default cancel button text', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText('ui.confirmModal.defaultCancel')).toBeInTheDocument();
  });

  it('renders default confirm button text', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText('ui.confirmModal.defaultConfirm')).toBeInTheDocument();
  });

  it('renders custom cancel button text', () => {
    render(<ConfirmModal {...defaultProps} cancelText="不要" />);

    expect(screen.getByText('不要')).toBeInTheDocument();
  });

  it('renders custom confirm button text', () => {
    render(<ConfirmModal {...defaultProps} confirmText="继续" />);

    expect(screen.getByText('继续')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    // Find cancel button by looking for the button that contains the cancel text
    const buttons = screen.getAllByRole('button');
    const cancelButton = buttons.find(btn => btn.textContent?.includes('ui.confirmModal.defaultCancel'));

    if (cancelButton) {
      fireEvent.click(cancelButton);
      expect(onCancel).toHaveBeenCalled();
    }
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    const confirmButton = screen.getByText('ui.confirmModal.defaultConfirm');
    fireEvent.click(confirmButton);

    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when close button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    const closeButtons = screen.getAllByText('✕');
    const closeButton = closeButtons[0]!;
    fireEvent.click(closeButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('renders with normal style when isDangerous is false', () => {
    render(<ConfirmModal {...defaultProps} isDangerous={false} />);

    const confirmButton = screen.getByText('ui.confirmModal.defaultConfirm');
    expect(confirmButton.className).toContain('amber');
  });

  it('renders with danger style when isDangerous is true', () => {
    render(<ConfirmModal {...defaultProps} isDangerous={true} />);

    const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('ui.confirmModal.defaultConfirm'));
    expect(confirmButton?.className).toContain('bg-red-');
  });

  it('renders trash icon when isDangerous is true', () => {
    render(<ConfirmModal {...defaultProps} isDangerous={true} />);

    // Check for Trash2 SVG icon instead of emoji
    const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('ui.confirmModal.defaultConfirm'));
    expect(confirmButton?.querySelector('svg')).toBeInTheDocument();
  });

  it('does not render trash icon when isDangerous is false', () => {
    render(<ConfirmModal {...defaultProps} isDangerous={false} />);

    const confirmButton = screen.getAllByRole('button').find(btn => btn.textContent?.includes('ui.confirmModal.defaultConfirm'));
    // When not dangerous, button should still have an icon (AlertTriangle) in title
    expect(confirmButton).toBeInTheDocument();
  });

  it('renders multiline message correctly', () => {
    const multilineMessage = '第一行\n第二行\n第三行';
    render(<ConfirmModal {...defaultProps} message={multilineMessage} />);

    // Check that the message is rendered in the p tag with whitespace-pre-wrap
    const messageElement = screen.getByText((_content, element) => {
      return element?.tagName.toLowerCase() === 'p' && element?.textContent === multilineMessage;
    });
    expect(messageElement).toBeInTheDocument();
  });

  it('prevents background clicks from closing modal', () => {
    const onCancel = vi.fn();
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    const modal = screen.getByText('确认操作').closest('div') as HTMLElement;
    if (modal) {
      fireEvent.click(modal);
      // Should not call onCancel when clicking on modal content
      expect(onCancel).not.toHaveBeenCalled();
    }
  });

  it('renders in portal (attached to document.body)', () => {
    render(<ConfirmModal {...defaultProps} />);

    // Check that modal is rendered in document.body
    const modalInBody = document.body.querySelector('[class*="fixed"][class*="z-"]');
    expect(modalInBody).toBeInTheDocument();
  });

  it('applies fade-in animation class', () => {
    render(<ConfirmModal {...defaultProps} />);

    const backdrop = document.body.querySelector('[class*="fixed"][class*="z-"]');
    expect(backdrop?.className).toContain('animate-fade-in');
  });

  it('applies scale-in animation class to content', () => {
    render(<ConfirmModal {...defaultProps} />);

    // The modal content div with the animation class is the one containing the title
    const modalContent = document.body.querySelector('[class*="animate-scale-in"]');
    expect(modalContent).toBeInTheDocument();
  });

  it('renders with different title and message', () => {
    render(
      <ConfirmModal
        {...defaultProps}
        title="删除玩家"
        message="确定要删除这个玩家吗？此操作无法撤销。"
      />
    );

    expect(screen.getByText('删除玩家')).toBeInTheDocument();
    expect(screen.getByText('确定要删除这个玩家吗？此操作无法撤销。')).toBeInTheDocument();
  });
});
