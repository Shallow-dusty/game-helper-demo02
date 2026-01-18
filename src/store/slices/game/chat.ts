import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { generateShortId } from '@/lib/random';

export const createGameChatSlice: StoreSlice<Pick<GameSlice, 'sendMessage' | 'forwardMessage' | 'toggleWhispers'>> = (set, get) => ({
    sendMessage: (content, recipientId) => {
        set((state) => {
            if (state.gameState && state.user) {
                if (recipientId && !state.gameState.allowWhispers && !state.user.isStoryteller) {
                    return;
                }
                const msg = {
                    id: generateShortId(),
                    senderId: state.user.id,
                    senderName: state.user.name,
                    recipientId,
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
                    const newMsg = {
                        id: generateShortId(),
                        senderId: state.user.id,
                        senderName: state.user.name, // Forwarder name
                        recipientId: targetRecipientId,
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
                addSystemMessage(state.gameState, state.gameState.allowWhispers ? "说书人开启了私聊" : "说书人关闭了私聊");
            }
        });
        get().sync();
    }
});
