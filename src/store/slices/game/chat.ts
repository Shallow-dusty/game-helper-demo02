import { StoreSlice, GameSlice } from '../../types';
import { addSystemMessage } from '../../utils';
import { supabase } from '../connection';

export const createGameChatSlice: StoreSlice<Pick<GameSlice, 'sendMessage' | 'forwardMessage' | 'toggleWhispers'>> = (set, get) => ({
    sendMessage: async (content, recipientId) => {
        const { gameState, user, roomDbId } = get();
        if (!gameState || !user || !roomDbId) return;

        if (recipientId && !gameState.allowWhispers && !user.isStoryteller) {
            return;
        }

        const senderSeat = gameState.seats.find(s => s.userId === user.id);
        if (!senderSeat && !user.isStoryteller) return;

        const recipientSeat = recipientId
            ? gameState.seats.find(s => s.userId === recipientId)
            : null;

        const { error } = await supabase
            .from('game_messages')
            .insert({
                room_id: roomDbId,
                sender_seat_id: senderSeat?.id ?? null,
                sender_name: user.name,
                content,
                recipient_seat_id: recipientSeat?.id ?? null,
                message_type: 'chat',
                metadata: {
                    client_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    sender_user_id: user.id,
                    recipient_user_id: recipientId ?? null
                }
            });

        if (error) {
            console.warn('发送消息失败:', error.message);
        }
    },

    forwardMessage: async (messageId, targetRecipientId) => {
        const { gameState, user, roomDbId } = get();
        if (!gameState || !user || !roomDbId) return;

        const originalMsg = gameState.messages.find(m => m.id === messageId);
        if (!originalMsg) return;

        const senderSeat = gameState.seats.find(s => s.userId === user.id);
        if (!senderSeat && !user.isStoryteller) return;

        const recipientSeat = targetRecipientId
            ? gameState.seats.find(s => s.userId === targetRecipientId)
            : null;

        const { error } = await supabase
            .from('game_messages')
            .insert({
                room_id: roomDbId,
                sender_seat_id: senderSeat?.id ?? null,
                sender_name: user.name,
                content: `[转发] ${originalMsg.senderName}: ${originalMsg.content}`,
                recipient_seat_id: recipientSeat?.id ?? null,
                message_type: 'chat',
                metadata: {
                    client_id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    sender_user_id: user.id,
                    recipient_user_id: targetRecipientId ?? null
                }
            });

        if (error) {
            console.warn('转发消息失败:', error.message);
        }
    },

    toggleWhispers: () => {
        const { user } = get();
        if (!user?.isStoryteller) return;
        set((state) => {
            if (state.gameState) {
                state.gameState.allowWhispers = !state.gameState.allowWhispers;
                addSystemMessage(state.gameState, state.gameState.allowWhispers ? "说书人开启了私聊" : "说书人关闭了私聊");
            }
        });
        get().sync();
    }
});
