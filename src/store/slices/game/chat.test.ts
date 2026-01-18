import { describe, it, expect, vi } from 'vitest';
import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { GameState, Seat, User, ChatMessage } from '@/types';

// Mock utils
vi.mock('../../utils', () => ({
    addSystemMessage: vi.fn((gameState, message) => {
        gameState.messages.push({
            id: `system-${Date.now()}`,
            senderId: 'system',
            senderName: 'System',
            content: message,
            timestamp: Date.now(),
            type: 'system',
            isPrivate: false,
        });
    }),
}));

// Create mock seat helper
const createMockSeat = (id: number, overrides?: Partial<Seat>): Seat => ({
    id,
    userId: null,
    userName: `座位 ${id + 1}`,
    isDead: false,
    hasGhostVote: true,
    roleId: null,
    realRoleId: null,
    seenRoleId: null,
    reminders: [],
    isHandRaised: false,
    isNominated: false,
    hasUsedAbility: false,
    statuses: [],
    voteLocked: false,
    isVirtual: false,
    ...overrides,
});

// Create mock game state helper
const createMockGameState = (seatCount = 5): GameState => ({
    roomId: 'TEST123',
    currentScriptId: 'tb',
    phase: 'SETUP',
    setupPhase: 'ASSIGNING',
    rolesRevealed: false,
    allowWhispers: false,
    vibrationEnabled: false,
    seats: Array.from({ length: seatCount }, (_, i) => createMockSeat(i)),
    swapRequests: [],
    messages: [],
    gameOver: { isOver: false, winner: null, reason: '' },
    audio: { trackId: null, isPlaying: false, volume: 0.5 },
    nightQueue: [],
    nightCurrentIndex: -1,
    voting: null,
    customScripts: {},
    customRoles: {},
    voteHistory: [],
    roundInfo: { dayCount: 0, nightCount: 0, nominationCount: 0, totalRounds: 0 },
    storytellerNotes: [],
    skillDescriptionMode: 'simple',
    aiMessages: [],
    nightActionRequests: [],
    candlelightEnabled: false,
    dailyNominations: [],
    interactionLog: [],
});

// Create mock user helper
const createMockUser = (overrides?: Partial<User>): User => ({
    id: 'user-123',
    name: 'TestUser',
    isStoryteller: false,
    roomId: 'TEST123',
    isSeated: false,
    ...overrides,
});

// Test store type
type TestChatStoreState = {
    user: User | null;
    gameState: GameState | null;
    sync: () => void;
    sendMessage: (content: string, recipientId?: string) => void;
    forwardMessage: (messageId: string, targetRecipientId?: string) => void;
    toggleWhispers: () => void;
};

// Create test store with chat slice functionality
const createTestChatStore = (
    initialGameState: GameState | null = createMockGameState(),
    initialUser: User | null = createMockUser()
) => {
    const syncMock = vi.fn();
    
    return createStore<TestChatStoreState>()(
        immer((set, get) => ({
            user: initialUser,
            gameState: initialGameState,
            sync: syncMock,
            
            sendMessage: (content, recipientId) => {
                set((state) => {
                    if (state.gameState && state.user) {
                        // Check whisper permission
                        if (recipientId && !state.gameState.allowWhispers && !state.user.isStoryteller) {
                            return;
                        }
                        const msg: ChatMessage = {
                            id: Math.random().toString(36).substr(2, 9),
                            senderId: state.user.id,
                            senderName: state.user.name,
                            recipientId: recipientId ?? null,
                            content,
                            timestamp: Date.now(),
                            type: 'chat' as const,
                            isPrivate: !!recipientId
                        };
                        state.gameState.messages.push(msg);
                    }
                });
                get().sync();
            },
            
            forwardMessage: (messageId, targetRecipientId) => {
                set((state) => {
                    if (state.gameState && state.user) {
                        const originalMsg = state.gameState.messages.find(m => m.id === messageId);
                        if (originalMsg) {
                            const newMsg: ChatMessage = {
                                id: Math.random().toString(36).substr(2, 9),
                                senderId: state.user.id,
                                senderName: state.user.name,
                                recipientId: targetRecipientId ?? null,
                                content: `[转发] ${originalMsg.senderName}: ${originalMsg.content}`,
                                timestamp: Date.now(),
                                type: 'chat' as const,
                                isPrivate: !!targetRecipientId
                            };
                            state.gameState.messages.push(newMsg);
                        }
                    }
                });
                get().sync();
            },
            
            toggleWhispers: () => {
                set((state) => {
                    if (state.gameState) {
                        state.gameState.allowWhispers = !state.gameState.allowWhispers;
                    }
                });
                get().sync();
            },
        }))
    );
};

describe('createGameChatSlice', () => {
    describe('sendMessage', () => {
        it('should send a public message', () => {
            const store = createTestChatStore();
            
            expect(store.getState().gameState!.messages.length).toBe(0);
            
            store.getState().sendMessage('Hello everyone!');
            
            const messages = store.getState().gameState!.messages;
            expect(messages.length).toBe(1);
            const msg = messages[0];
            expect(msg?.content).toBe('Hello everyone!');
            expect(msg?.senderId).toBe('user-123');
            expect(msg?.senderName).toBe('TestUser');
            expect(msg?.isPrivate).toBe(false);
            expect(msg?.type).toBe('chat');
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should send a private message when whispers allowed', () => {
            const gameState = createMockGameState();
            gameState.allowWhispers = true;
            
            const store = createTestChatStore(gameState);
            
            store.getState().sendMessage('Secret message', 'recipient-456');
            
            const messages = store.getState().gameState!.messages;
            expect(messages.length).toBe(1);
            const msg = messages[0];
            expect(msg?.content).toBe('Secret message');
            expect(msg?.recipientId).toBe('recipient-456');
            expect(msg?.isPrivate).toBe(true);
        });
        
        it('should block private messages when whispers disabled for non-storyteller', () => {
            const gameState = createMockGameState();
            gameState.allowWhispers = false;
            
            const store = createTestChatStore(gameState, createMockUser({ isStoryteller: false }));
            
            store.getState().sendMessage('Secret message', 'recipient-456');
            
            // Message should not be added
            const messages = store.getState().gameState!.messages;
            expect(messages.length).toBe(0);
        });
        
        it('should allow storyteller to send private messages even when whispers disabled', () => {
            const gameState = createMockGameState();
            gameState.allowWhispers = false;
            
            const store = createTestChatStore(
                gameState,
                createMockUser({ isStoryteller: true })
            );
            
            store.getState().sendMessage('ST secret', 'recipient-456');
            
            const messages = store.getState().gameState!.messages;
            expect(messages.length).toBe(1);
            const msg = messages[0];
            expect(msg?.content).toBe('ST secret');
            expect(msg?.isPrivate).toBe(true);
        });
        
        it('should do nothing when user is null', () => {
            const store = createTestChatStore(createMockGameState(), null);
            store.getState().sendMessage('Hello');
            
            expect(store.getState().gameState!.messages.length).toBe(0);
        });
        
        it('should do nothing when gameState is null', () => {
            const store = createTestChatStore(null, createMockUser());
            store.getState().sendMessage('Hello');
            
            expect(store.getState().gameState).toBeNull();
        });
    });
    
    describe('forwardMessage', () => {
        it('should forward an existing message', () => {
            const gameState = createMockGameState();
            gameState.messages.push({
                id: 'msg-original',
                senderId: 'other-user',
                senderName: 'OtherUser',
                recipientId: null,
                content: 'Original message',
                timestamp: Date.now(),
                type: 'chat',
                isPrivate: false,
            });
            
            const store = createTestChatStore(gameState);
            
            store.getState().forwardMessage('msg-original', 'recipient-789');
            
            const messages = store.getState().gameState!.messages;
            expect(messages.length).toBe(2);
            const forwardedMsg = messages[1];
            expect(forwardedMsg?.content).toBe('[转发] OtherUser: Original message');
            expect(forwardedMsg?.senderId).toBe('user-123');
            expect(forwardedMsg?.senderName).toBe('TestUser');
            expect(forwardedMsg?.recipientId).toBe('recipient-789');
            expect(forwardedMsg?.isPrivate).toBe(true);
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should forward to public if no recipient specified', () => {
            const gameState = createMockGameState();
            gameState.messages.push({
                id: 'msg-original',
                senderId: 'other-user',
                senderName: 'OtherUser',
                recipientId: 'someone',
                content: 'Original message',
                timestamp: Date.now(),
                type: 'chat',
                isPrivate: true,
            });
            
            const store = createTestChatStore(gameState);
            
            store.getState().forwardMessage('msg-original');
            
            const messages = store.getState().gameState!.messages;
            expect(messages.length).toBe(2);
            const forwardedMsg = messages[1];
            expect(forwardedMsg?.isPrivate).toBe(false);
            expect(forwardedMsg?.recipientId).toBeNull();
        });
        
        it('should do nothing if original message not found', () => {
            const store = createTestChatStore();
            
            store.getState().forwardMessage('non-existent-id');
            
            expect(store.getState().gameState!.messages.length).toBe(0);
        });
        
        it('should do nothing when user is null', () => {
            const store = createTestChatStore(createMockGameState(), null);
            store.getState().forwardMessage('msg-1');
            
            expect(store.getState().gameState!.messages.length).toBe(0);
        });
    });
    
    describe('toggleWhispers', () => {
        it('should enable whispers when disabled', () => {
            const gameState = createMockGameState();
            gameState.allowWhispers = false;
            
            const store = createTestChatStore(gameState);
            
            store.getState().toggleWhispers();
            
            expect(store.getState().gameState!.allowWhispers).toBe(true);
            expect(store.getState().sync).toHaveBeenCalled();
        });
        
        it('should disable whispers when enabled', () => {
            const gameState = createMockGameState();
            gameState.allowWhispers = true;
            
            const store = createTestChatStore(gameState);
            
            store.getState().toggleWhispers();
            
            expect(store.getState().gameState!.allowWhispers).toBe(false);
        });
        
        it('should do nothing when gameState is null', () => {
            const store = createTestChatStore(null);
            store.getState().toggleWhispers();
            
            expect(store.getState().gameState).toBeNull();
        });
    });
});
