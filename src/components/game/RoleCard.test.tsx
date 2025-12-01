
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RoleCard } from './RoleCard';
import { RoleDef } from '../../types';

const mockRole: RoleDef = {
    id: 'washerwoman',
    name: '洗衣妇',
    team: 'TOWNSFOLK',
    ability: '在游戏开始时，你知道两名玩家中的一名是某个特定的镇民。',
    firstNight: true,
    otherNight: false,
    reminders: [],

    detailedDescription: '这是一段详细描述。'
};

describe('RoleCard', () => {
    it('renders role name and ability', () => {
        render(<RoleCard role={mockRole} />);
        expect(screen.getByText('洗衣妇')).toBeInTheDocument();
        expect(screen.getByText('在游戏开始时，你知道两名玩家中的一名是某个特定的镇民。')).toBeInTheDocument();
        expect(screen.getByText('镇民')).toBeInTheDocument();
    });

    it('renders as player role (hero style)', () => {
        render(<RoleCard role={mockRole} isPlayerRole={true} />);
        expect(screen.getByText('你的角色')).toBeInTheDocument();
        expect(screen.getByText('角色能力')).toBeInTheDocument();
    });

    it('shows detailed description when showDetails is true', () => {
        render(<RoleCard role={mockRole} showDetails={true} />);
        expect(screen.getByText('这是一段详细描述。')).toBeInTheDocument();
    });

    it('does not show detailed description by default', () => {
        render(<RoleCard role={mockRole} />);
        expect(screen.queryByText('这是一段详细描述。')).not.toBeInTheDocument();
    });

    it('renders night order info', () => {
        render(<RoleCard role={mockRole} />);
        expect(screen.getByText('首夜: 是')).toBeInTheDocument();
    });
});
