import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WhisperingFog } from './WhisperingFog';

// Mock store
let mockStoreState = {
    gameState: {
        messages: [] as { type: string; senderId: string; recipientId?: string; timestamp: string; text: string }[],
        seats: [] as { id: number; userId: string | null; isDead: boolean }[],
    },
    user: { id: 'user-1', isStoryteller: false }
};

vi.mock('../../store', () => ({
    useStore: vi.fn((selector) => selector(mockStoreState))
}));

describe('WhisperingFog', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockStoreState = {
            gameState: {
                messages: [],
                seats: []
            },
            user: { id: 'user-1', isStoryteller: false }
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('没有私聊消息时不渲染 SVG', () => {
        const tokenPositions = new Map<number, { x: number; y: number }>();
        const containerRect = new DOMRect(0, 0, 500, 500);
        
        const { container } = render(
            <WhisperingFog 
                tokenPositions={tokenPositions}
                containerRect={containerRect}
            />
        );
        
        // 没有连接时返回 null
        expect(container.firstChild).toBeNull();
    });

    it('没有 containerRect 时不渲染', () => {
        const tokenPositions = new Map<number, { x: number; y: number }>();
        
        const { container } = render(
            <WhisperingFog 
                tokenPositions={tokenPositions}
            />
        );
        
        expect(container.firstChild).toBeNull();
    });

    it('有私聊消息且玩家参与时应该渲染 SVG', () => {
        const tokenPositions = new Map<number, { x: number; y: number }>([
            [0, { x: 100, y: 100 }],
            [1, { x: 200, y: 100 }]
        ]);
        const containerRect = new DOMRect(0, 0, 500, 500);
        
        // 模拟私聊消息 - 用户参与
        mockStoreState = {
            gameState: {
                messages: [{
                    type: 'chat',
                    senderId: 'user-1',
                    recipientId: 'user-2',
                    timestamp: new Date().toISOString(),
                    text: 'Hello'
                }],
                seats: [
                    { id: 0, userId: 'user-1', isDead: false },
                    { id: 1, userId: 'user-2', isDead: false }
                ]
            },
            user: { id: 'user-1', isStoryteller: false }
        };
        
        const { container } = render(
            <WhisperingFog 
                tokenPositions={tokenPositions}
                containerRect={containerRect}
            />
        );
        
        // 应该渲染 SVG
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('ST 模式应该能看到所有连线', () => {
        const tokenPositions = new Map<number, { x: number; y: number }>([
            [0, { x: 100, y: 100 }],
            [1, { x: 200, y: 100 }]
        ]);
        const containerRect = new DOMRect(0, 0, 500, 500);
        
        mockStoreState = {
            gameState: {
                messages: [{
                    type: 'chat',
                    senderId: 'user-1',
                    recipientId: 'user-2',
                    timestamp: new Date().toISOString(),
                    text: 'Secret'
                }],
                seats: [
                    { id: 0, userId: 'user-1', isDead: false },
                    { id: 1, userId: 'user-2', isDead: false }
                ]
            },
            user: { id: 'st-user', isStoryteller: true }
        };
        
        const { container } = render(
            <WhisperingFog 
                tokenPositions={tokenPositions}
                containerRect={containerRect}
            />
        );
        
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('存活玩家可以看到其他人的私聊雾气', () => {
        const tokenPositions = new Map<number, { x: number; y: number }>([
            [0, { x: 100, y: 100 }],
            [1, { x: 200, y: 100 }],
            [2, { x: 300, y: 100 }]
        ]);
        const containerRect = new DOMRect(0, 0, 500, 500);
        
        // user-3 是存活玩家，可以看到 user-1 和 user-2 之间的私聊雾气
        mockStoreState = {
            gameState: {
                messages: [{
                    type: 'chat',
                    senderId: 'user-1',
                    recipientId: 'user-2',
                    timestamp: new Date().toISOString(),
                    text: 'Other chat'
                }],
                seats: [
                    { id: 0, userId: 'user-1', isDead: false },
                    { id: 1, userId: 'user-2', isDead: false },
                    { id: 2, userId: 'user-3', isDead: false }
                ]
            },
            user: { id: 'user-3', isStoryteller: false }
        };
        
        const { container } = render(
            <WhisperingFog 
                tokenPositions={tokenPositions}
                containerRect={containerRect}
            />
        );
        
        // 存活玩家可以看到私聊雾气
        expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('死亡玩家只能看到自己参与的私聊连线', () => {
        const tokenPositions = new Map<number, { x: number; y: number }>([
            [0, { x: 100, y: 100 }],
            [1, { x: 200, y: 100 }],
            [2, { x: 300, y: 100 }]
        ]);
        const containerRect = new DOMRect(0, 0, 500, 500);
        
        // dead-user 是死亡玩家，只能看到自己参与的私聊
        mockStoreState = {
            gameState: {
                messages: [{
                    type: 'chat',
                    senderId: 'user-1',
                    recipientId: 'user-2',
                    timestamp: new Date().toISOString(),
                    text: 'Other chat'
                }],
                seats: [
                    { id: 0, userId: 'user-1', isDead: false },
                    { id: 1, userId: 'user-2', isDead: false },
                    { id: 2, userId: 'dead-user', isDead: true }
                ]
            },
            user: { id: 'dead-user', isStoryteller: false }
        };
        
        const { container } = render(
            <WhisperingFog 
                tokenPositions={tokenPositions}
                containerRect={containerRect}
            />
        );
        
        // 死亡玩家看不到非自己参与的私聊，返回 null
        expect(container.firstChild).toBeNull();
    });
})
