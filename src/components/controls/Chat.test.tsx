import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Chat } from './Chat';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props, props.children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
};

// Create a mock store state holder
let mockStoreState: any = {};

// Mock the store
vi.mock('../../store', () => ({
  useStore: (selector?: (state: any) => any) => {
    if (selector) {
      return selector(mockStoreState);
    }
    return mockStoreState;
  },
}));

describe('Chat', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock scrollIntoView
    Element.prototype.scrollIntoView = vi.fn();

    // Mock window.visualViewport for iOS keyboard handling
    Object.defineProperty(window, 'visualViewport', {
      writable: true,
      configurable: true,
      value: {
        height: 800,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      },
    });

    mockStoreState = {
      gameState: {
        messages: [],
        seats: [],
        allowWhispers: true,
      },
      user: {
        id: 'user1',
        name: 'TestUser',
        isStoryteller: false,
      },
      sendMessage: vi.fn(),
    };
  });

  it('renders chat tabs', () => {
    render(<Chat />);

    // Check for channel tabs - now using SVG icons instead of emoji
    const publicTab = screen.getByRole('button', { name: /controls\.chat\.publicChannel/ });
    const logTab = screen.getByRole('button', { name: /controls\.chat\.logChannel/ });
    expect(publicTab).toBeInTheDocument();
    expect(logTab).toBeInTheDocument();
  });

  it('renders input area in chat tab', () => {
    render(<Chat />);

    // Check for input placeholder using translation key
    const input = screen.getByPlaceholderText('controls.chat.typeMessage');
    expect(input).toBeInTheDocument();
  });

  it('renders send button', () => {
    render(<Chat />);

    // Check for send button by type="submit"
    const sendButton = screen.getByRole('button', { name: '' });
    expect(sendButton).toBeInTheDocument();
  });

  it('shows empty state when no messages', () => {
    const { container } = render(<Chat />);

    // Check for empty state message
    // Check for SVG icon instead of web emoji
    const allSvgs = container.querySelectorAll('svg');
    expect(allSvgs.length).toBeGreaterThan(0);
    expect(screen.getByText('controls.smartInfo.noInfo')).toBeInTheDocument();
  });

  it('renders chat messages', () => {
    mockStoreState.gameState.messages = [
      {
        id: '1',
        type: 'chat',
        content: 'Hello everyone!',
        senderId: 'user1',
        senderName: 'TestUser',
        timestamp: Date.now(),
        recipientId: null,
      },
    ];

    render(<Chat />);

    expect(screen.getByText('Hello everyone!')).toBeInTheDocument();
  });

  it('renders system log messages', () => {
    mockStoreState.gameState.messages = [
      {
        id: '1',
        type: 'system',
        content: 'Game started',
        senderId: 'system',
        senderName: 'System',
        timestamp: Date.now(),
        recipientId: null,
      },
    ];

    render(<Chat />);

    // Switch to LOG tab to see system messages - use text match without emoji
    const logTab = screen.getByRole('button', { name: /controls\.chat\.logChannel/ });
    fireEvent.click(logTab);

    expect(screen.getByText('Game started')).toBeInTheDocument();
  });

  it('shows whisper indicator for private messages', () => {
    mockStoreState.gameState.messages = [
      {
        id: '1',
        type: 'chat',
        content: 'Secret message',
        senderId: 'user2',
        senderName: 'OtherUser',
        timestamp: Date.now(),
        recipientId: 'user1',
      },
    ];
    mockStoreState.gameState.seats = [
      { id: 0, userId: 'user1', userName: 'TestUser', isDead: false },
      { id: 1, userId: 'user2', userName: 'OtherUser', isDead: false },
    ];

    render(<Chat />);

    expect(screen.getByText(/controls\.chat\.whisper/)).toBeInTheDocument();
  });

  it('shows recipient selector when whispers are allowed', () => {
    mockStoreState.gameState.seats = [
      { id: 0, userId: 'user1', userName: 'TestUser', isDead: false },
      { id: 1, userId: 'user2', userName: 'OtherUser', isDead: false },
    ];

    render(<Chat />);

    // Check for "To:" label (rendered with colon after translation)
    expect(screen.getByText(/controls\.chat\.to/)).toBeInTheDocument();

    // Check for public channel option in select dropdown
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    const publicOption = screen.getByRole('option', { name: 'controls.chat.publicChannel' });
    expect(publicOption).toBeInTheDocument();
  });

  it('shows whispers disabled message when not allowed', () => {
    mockStoreState.gameState.allowWhispers = false;

    render(<Chat />);

    expect(screen.getByText('controls.chat.whispersDisabled')).toBeInTheDocument();
  });

  it('sends message when form is submitted', () => {
    const mockSendMessage = vi.fn();
    mockStoreState.sendMessage = mockSendMessage;

    const { container } = render(<Chat />);

    const input = screen.getByPlaceholderText('controls.chat.typeMessage');
    // Find submit button - it's the only button in the form
    const submitButtons = container.querySelectorAll('button[type="submit"]');
    const sendButton = submitButtons[0];

    fireEvent.change(input, { target: { value: 'Test message' } });
    fireEvent.click(sendButton!);

    expect(mockSendMessage).toHaveBeenCalledWith('Test message', null);
  });

  it('switches between chat and log tabs', () => {
    render(<Chat />);

    const logTab = screen.getByRole('button', { name: /controls\.chat\.logChannel/ });
    fireEvent.click(logTab);

    // Input area should not be visible in log tab
    expect(screen.queryByPlaceholderText('controls.chat.typeMessage')).not.toBeInTheDocument();
  });
});
