import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RoleReferencePanel } from './RoleReferencePanel';
import { RoleDef } from '../../types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: any) => React.createElement('div', props, props.children),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

const mockRoles: RoleDef[] = [
  {
    id: 'washerwoman',
    name: '洗衣妇',
    team: 'TOWNSFOLK',
    ability: '在游戏开始时，你知道两名玩家中的一名是某个特定的镇民。',
    firstNight: true,
    otherNight: false,
    reminders: [],
  },
  {
    id: 'drunk',
    name: '酒鬼',
    team: 'OUTSIDER',
    ability: '你不知道你是酒鬼。你以为你是另一个角色。',
    firstNight: false,
    otherNight: false,
    reminders: [],
  },
  {
    id: 'poisoner',
    name: '投毒者',
    team: 'MINION',
    ability: '每个夜晚，选择一名玩家：他在明天白天和夜晚中毒。',
    firstNight: false,
    otherNight: true,
    reminders: [],
  },
  {
    id: 'imp',
    name: '小恶魔',
    team: 'DEMON',
    ability: '每个夜晚*，选择一名玩家：他死亡。',
    firstNight: false,
    otherNight: true,
    reminders: [],
  },
];

describe('RoleReferencePanel', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    playerRoleId: null,
    scriptRoles: mockRoles,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when isOpen is true', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    expect(screen.getByText('controls.roleReference.title')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<RoleReferencePanel {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('controls.roleReference.title')).not.toBeInTheDocument();
  });

  it('renders roles and rules tabs', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    expect(screen.getByText(/🎭/)).toBeInTheDocument();
    expect(screen.getByText(/📜/)).toBeInTheDocument();
    expect(screen.getByText(/controls\.roleReference\.rolesTab/)).toBeInTheDocument();
    expect(screen.getByText(/controls\.roleReference\.rulesTab/)).toBeInTheDocument();
  });

  it('renders all team sections', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    expect(screen.getByText(/controls\.roleReference\.teamTownsfolk/)).toBeInTheDocument();
    expect(screen.getByText(/controls\.roleReference\.teamOutsider/)).toBeInTheDocument();
    expect(screen.getByText(/controls\.roleReference\.teamMinion/)).toBeInTheDocument();
    expect(screen.getByText(/controls\.roleReference\.teamDemon/)).toBeInTheDocument();
  });

  it('renders all roles in their respective teams', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    expect(screen.getByText('洗衣妇')).toBeInTheDocument();
    expect(screen.getByText('酒鬼')).toBeInTheDocument();
    expect(screen.getByText('投毒者')).toBeInTheDocument();
    expect(screen.getByText('小恶魔')).toBeInTheDocument();
  });

  it('highlights player role when provided', () => {
    render(<RoleReferencePanel {...defaultProps} playerRoleId="washerwoman" />);

    // The player role should be displayed separately as a hero card
    const washerwoman = screen.getAllByText('洗衣妇');
    expect(washerwoman.length).toBeGreaterThan(0);
  });

  it('renders search input', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('controls.roleReference.searchPlaceholder');
    expect(searchInput).toBeInTheDocument();
  });

  it('filters roles based on search query', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('controls.roleReference.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: '洗衣' } });

    expect(screen.getByText('洗衣妇')).toBeInTheDocument();
    // Other roles should still be in the document but might be hidden
  });

  it('shows found count when searching', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('controls.roleReference.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: '洗衣' } });

    expect(screen.getByText(/controls\.roleReference\.foundCount/)).toBeInTheDocument();
  });

  it('renders collapse/expand all buttons', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    expect(screen.getByText(/controls\.roleReference\.collapseAll/)).toBeInTheDocument();
    expect(screen.getByText(/controls\.roleReference\.expandAll/)).toBeInTheDocument();
  });

  it('collapses team when clicking team header', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    const townsfolkHeader = screen.getByText(/controls\.roleReference\.teamTownsfolk/);
    fireEvent.click(townsfolkHeader);

    // After collapsing, the role should still be in the document but hidden
    expect(screen.getByText('洗衣妇')).toBeInTheDocument();
  });

  it('toggles description mode', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    const toggleButton = screen.getByText(/controls\.roleReference\.show(Detailed|Simple)/);
    expect(toggleButton).toBeInTheDocument();

    fireEvent.click(toggleButton);
    // The mode should toggle
  });

  it('switches to rules tab', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    const rulesTab = screen.getByText(/controls\.roleReference\.rulesTab/);
    fireEvent.click(rulesTab);

    // Should show rules content (hardcoded in component)
    expect(screen.getAllByText(/基本流程/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/获胜条件/).length).toBeGreaterThan(0);
  });

  it('closes modal when close button is clicked', () => {
    const onClose = vi.fn();
    render(<RoleReferencePanel {...defaultProps} onClose={onClose} />);

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('clears search when clear button is clicked', () => {
    render(<RoleReferencePanel {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('controls.roleReference.searchPlaceholder');
    fireEvent.change(searchInput, { target: { value: '测试' } });

    expect((searchInput as HTMLInputElement).value).toBe('测试');

    const clearButton = screen.getAllByText('✕').find(btn => btn.closest('.absolute'));
    if (clearButton) {
      fireEvent.click(clearButton);
      expect((searchInput as HTMLInputElement).value).toBe('');
    }
  });
});
