/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ActionConfirmModal } from './ActionConfirmModal';
import type { ConfirmationOptions } from '../../hooks/useActionConfirmation';

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
      <div {...props} onClick={onClick}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren<object>) => <>{children}</>,
}));

// Mock the Button component
vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, ...props }: React.PropsWithChildren<{ onClick?: () => void }>) => (
    <button {...props} onClick={onClick}>{children}</button>
  ),
}));

describe('ActionConfirmModal', () => {
  const defaultOptions: ConfirmationOptions = {
    type: 'confirm',
    title: '测试标题',
    message: '测试消息',
    confirmText: '确认',
    cancelText: '取消',
  };

  it('renders nothing when options is null', () => {
    const { container } = render(
      <ActionConfirmModal
        isOpen
        options={null}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders modal when open with options', () => {
    render(
      <ActionConfirmModal
        isOpen
        options={defaultOptions}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );
    expect(screen.getByText('测试标题')).toBeInTheDocument();
    expect(screen.getByText('测试消息')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const onConfirm = vi.fn();
    render(
      <ActionConfirmModal
        isOpen
        options={defaultOptions}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />
    );
    fireEvent.click(screen.getByText('确认'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    render(
      <ActionConfirmModal
        isOpen
        options={defaultOptions}
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText('取消'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
