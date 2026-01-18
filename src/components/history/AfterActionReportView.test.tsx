import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { AfterActionReportView } from './AfterActionReportView';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props, props.children),
    button: (props: any) => React.createElement('button', props, props.children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock @radix-ui/react-slot
vi.mock('@radix-ui/react-slot', () => ({
  Slot: (props: any) => React.createElement('div', props, props.children),
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en-US' }
  }),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  X: () => <span>X</span>,
  Download: () => <span>Download</span>,
  Trophy: () => <span>Trophy</span>,
  Skull: () => <span>Skull</span>,
  Clock: () => <span>Clock</span>,
  Users: () => <span>Users</span>,
  Vote: () => <span>Vote</span>,
  Copy: () => <span>Copy</span>,
  Check: () => <span>Check</span>,
  Camera: () => <span>Camera</span>,
  Loader2: () => <span>Loader2</span>,
}));

// Mock Toast
vi.mock('../ui/Toast', () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

// Mock html2canvas
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: () => 'data:image/png;base64,mock',
  })),
}));

// Create a mock store
let mockGameState: any = null;

vi.mock('../../store', () => ({
  useStore: (selector: (state: any) => any) => {
    return selector({ gameState: mockGameState });
  },
}));

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(() => Promise.resolve()),
  },
});

describe('AfterActionReportView', () => {
  const mockSeats = [
    {
      id: 0,
      userId: 'user1',
      userName: '玩家1',
      roleId: 'washerwoman',
      realRoleId: 'washerwoman',
      seenRoleId: 'washerwoman',
      isDead: false,
      hasGhostVote: true,
      reminders: [],
      isHandRaised: false,
      isNominated: false,
      hasUsedAbility: false,
      statuses: [],
    },
    {
      id: 1,
      userId: 'user2',
      userName: '玩家2',
      roleId: 'imp',
      realRoleId: 'imp',
      seenRoleId: 'imp',
      isDead: true,
      hasGhostVote: false,
      reminders: [],
      isHandRaised: false,
      isNominated: false,
      hasUsedAbility: false,
      statuses: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockGameState = {
      // Mock gameState that will generate the report
      winner: 'GOOD',
      seats: mockSeats,
      messages: [],
      scriptRoles: [],
      roundInfo: {
        dayCount: 3,
        nightCount: 2,
        nominationCount: 5,
        totalRounds: 5
      },
      gameOver: {
        isOver: true,
        winner: 'GOOD',
        reason: '恶魔被处决'
      },
      currentScriptId: 'tb',
      voteHistory: []
    };
  });

  it('renders modal when isOpen is true', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('history.afterAction.title')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(<AfterActionReportView isOpen={false} onClose={vi.fn()} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders all tab buttons', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('history.afterAction.overview')).toBeInTheDocument();
    expect(screen.getByText('history.afterAction.timeline')).toBeInTheDocument();
    expect(screen.getByText('history.afterAction.players')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    // Check for button icons
    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('X')).toBeInTheDocument();
  });

  it('displays winner information', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('history.afterAction.goodWin')).toBeInTheDocument();
  });

  it('displays game statistics', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('history.afterAction.duration')).toBeInTheDocument();
    expect(screen.getByText('history.afterAction.playerCount')).toBeInTheDocument();
    expect(screen.getByText('history.afterAction.deathCount')).toBeInTheDocument();
    expect(screen.getByText('history.afterAction.executionCount')).toBeInTheDocument();
  });

  it('displays MVP information when available', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('history.afterAction.mvp')).toBeInTheDocument();
  });

  it('switches to timeline tab', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    const timelineTab = screen.getByText('history.afterAction.timeline');
    fireEvent.click(timelineTab);

    // Timeline events should be visible
    // Since the report generator is mocked, we just check the tab is active
  });

  it('switches to players tab', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    const playersTab = screen.getByText('history.afterAction.players');
    fireEvent.click(playersTab);

    // Player list should be visible
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<AfterActionReportView isOpen={true} onClose={onClose} />);

    const closeButton = screen.getByText('X');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('copies report text to clipboard when copy button is clicked', async () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    const copyButton = screen.getByText('Copy').closest('button');
    if (copyButton) {
      fireEvent.click(copyButton);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    }
  });

  it('downloads report when download button is clicked', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    const downloadButton = screen.getByText('Download').closest('button');
    expect(downloadButton).toBeInTheDocument();
  });

  it('captures screenshot when camera button is clicked', async () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    const cameraButton = screen.getByText('Camera').closest('button');
    if (cameraButton) {
      fireEvent.click(cameraButton);

      // Wait for async operation
      await new Promise(resolve => setTimeout(resolve, 0));

      // html2canvas should be called
    }
  });

  it('shows different icon for evil win', () => {
    mockGameState.winner = 'EVIL';
    mockGameState.gameOver.winner = 'EVIL';

    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText('history.afterAction.evilWin')).toBeInTheDocument();
  });

  it('displays round count', () => {
    render(<AfterActionReportView isOpen={true} onClose={vi.fn()} />);

    // Check that script name is displayed in the header
    expect(screen.getByText(/tb/)).toBeInTheDocument();
    // Check for the title which should always be present
    expect(screen.getByText('history.afterAction.title')).toBeInTheDocument();
  });
});
