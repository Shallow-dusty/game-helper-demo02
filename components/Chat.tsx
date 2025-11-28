
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { List } from 'react-window';
import { useStore } from '../store';
import { InfoCard } from './InfoCard';
import { ChatMessage, Seat } from '../types';

// 消息渲染组件 - 抽取为独立组件以便测量高度
interface MessageItemProps {
    msg: ChatMessage;
    isMe: boolean;
    seats: Seat[];
    style?: React.CSSProperties;
}

const MessageItem: React.FC<MessageItemProps> = ({ msg, isMe, seats, style }) => {
    const isSystem = msg.type === 'system';
    const isPrivate = msg.recipientId !== null;

    // --- SYSTEM LOG RENDER ---
    if (isSystem) {
        return (
            <div style={style} className="px-4 py-1">
                <div className="flex items-start gap-2 my-2 text-stone-400 border-l-2 border-stone-700 pl-2 py-1 bg-black/20 rounded-r">
                    <span className="text-[10px] mt-0.5">📜</span>
                    <span className="text-xs font-serif leading-relaxed">{msg.content}</span>
                </div>
            </div>
        );
    }

    // --- CHAT RENDER ---
    const senderSeat = seats.find(s => s.userId === msg.senderId);
    const displayName = senderSeat ? `[${senderSeat.id + 1}] ${msg.senderName}` : msg.senderName;

    return (
        <div style={style} className="px-4 py-1">
            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] font-bold ${isPrivate ? 'text-purple-400' : 'text-stone-500'}`}>
                        {displayName}
                        {isPrivate && !isMe && " (悄悄话)"}
                        {isPrivate && isMe && ` ➜ ${seats.find(s => s.userId === msg.recipientId)?.userName || '未知'}`}
                    </span>
                </div>
                <div
                    className={`px-3 py-2 rounded-lg text-sm max-w-[90%] break-words shadow-sm relative ${isPrivate
                        ? 'bg-purple-900/40 text-purple-100 border border-purple-700/50 italic'
                        : isMe
                            ? 'bg-red-900 text-stone-100 rounded-tr-none'
                            : 'bg-stone-800 text-stone-300 rounded-tl-none border border-stone-700'
                        }`}
                >
                    {/* Render InfoCard if present, otherwise plain text */}
                    {msg.card ? (
                        <InfoCard card={msg.card} />
                    ) : (
                        msg.content
                    )}
                </div>
            </div>
        </div>
    );
};

// 虚拟滚动消息列表阈值 - 超过此数量启用虚拟滚动
const VIRTUAL_SCROLL_THRESHOLD = 50;

export const Chat = () => {
    const messages = useStore(state => state.gameState?.messages || []);
    const seats = useStore(state => state.gameState?.seats || []);
    const allowWhispers = useStore(state => state.gameState?.allowWhispers ?? true);
    const user = useStore(state => state.user);
    const sendMessage = useStore(state => state.sendMessage);

    const [input, setInput] = useState('');
    const [recipientId, setRecipientId] = useState<string | null>(null); // null = Public
    const [activeChannel, setActiveChannel] = useState<'CHAT' | 'LOG'>('CHAT');
    
    // NFR-03: iOS 软键盘适配
    const [keyboardOffset, setKeyboardOffset] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    const endRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!allowWhispers && !user?.isStoryteller && recipientId !== null) {
            setRecipientId(null);
        }
    }, [allowWhispers, user, recipientId]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, activeChannel]);

    // NFR-03: iOS 软键盘适配 - 使用 visualViewport API
    useEffect(() => {
        const viewport = window.visualViewport;
        if (!viewport) return;
        
        const handleResize = () => {
            // 计算键盘高度：视窗高度差
            const keyboardHeight = window.innerHeight - viewport.height;
            setKeyboardOffset(keyboardHeight > 50 ? keyboardHeight : 0);
            
            // 确保输入框可见
            if (keyboardHeight > 50 && inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }, 100);
            }
        };
        
        viewport.addEventListener('resize', handleResize);
        viewport.addEventListener('scroll', handleResize);
        
        return () => {
            viewport.removeEventListener('resize', handleResize);
            viewport.removeEventListener('scroll', handleResize);
        };
    }, []);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;
        sendMessage(input, recipientId);
        setInput('');
    };

    // --- PRIVACY FILTERING ---
    // Filter messages based on active channel AND privacy
    // (Since Store now contains full state, we must hide other people's whispers here)
    const filteredMessages = messages.filter(msg => {
        // 1. Channel Check
        if (activeChannel === 'LOG' && msg.type !== 'system') return false;
        if (activeChannel === 'CHAT' && msg.type !== 'chat') return false;

        // 2. Privacy Check
        if (msg.recipientId) {
            // Private message
            if (user?.isStoryteller) return true; // ST sees all
            if (msg.senderId === user?.id) return true; // I sent it
            if (msg.recipientId === user?.id) return true; // Sent to me
            return false; // Hide others' whispers
        }

        return true; // Public message
    });

    // FR-05: 过滤掉虚拟玩家，只显示真实玩家
    const availableRecipients = seats.filter(s => s.userId && s.userId !== user?.id && !s.isVirtual);

    // 虚拟滚动相关状态
    const containerRef = useRef<HTMLDivElement>(null);
    const [listHeight, setListHeight] = useState(400);
    
    // 是否启用虚拟滚动
    const useVirtualScroll = filteredMessages.length > VIRTUAL_SCROLL_THRESHOLD;

    // 固定行高（简化实现）
    const rowHeight = 80;

    // 监听容器高度变化
    useEffect(() => {
        if (!containerRef.current) return;
        
        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setListHeight(entry.contentRect.height);
            }
        });
        
        resizeObserver.observe(containerRef.current);
        return () => resizeObserver.disconnect();
    }, []);

    // 虚拟列表行组件 - react-window v2 要求返回 ReactElement，不能返回 null
    const RowComponent = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
        const msg = filteredMessages[index];
        if (!msg) {
            // 返回空占位符而不是 null，满足 react-window v2 的类型要求
            return <div style={style} />;
        }
        const isMe = msg.senderId === user?.id;
        
        return (
            <MessageItem
                msg={msg}
                isMe={isMe}
                seats={seats}
                style={style}
            />
        );
    }, [filteredMessages, user?.id, seats]);

    // 滚动到底部 - 使用 useListRef hook (react-window v2 API)
    const listApiRef = useRef<{ scrollToRow: (params: { index: number; align?: 'auto' | 'center' | 'end' | 'smart' | 'start' }) => void } | null>(null);
    
    useEffect(() => {
        if (useVirtualScroll && listApiRef.current && filteredMessages.length > 0) {
            listApiRef.current.scrollToRow({ index: filteredMessages.length - 1, align: 'end' });
        } else {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [filteredMessages.length, useVirtualScroll, activeChannel]);

    return (
        <div className="flex flex-col h-full bg-stone-900 font-serif">

            {/* Channel Tabs */}
            <div className="flex border-b border-stone-800 bg-stone-950">
                <button
                    onClick={() => setActiveChannel('CHAT')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeChannel === 'CHAT' ? 'bg-stone-900 text-stone-200 border-b-2 border-red-700' : 'text-stone-600 hover:bg-stone-900'}`}
                >
                    💬 聊天 (Chat)
                </button>
                <button
                    onClick={() => setActiveChannel('LOG')}
                    className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeChannel === 'LOG' ? 'bg-stone-900 text-amber-200 border-b-2 border-amber-700' : 'text-stone-600 hover:bg-stone-900'}`}
                >
                    📜 记录 (Log)
                </button>
            </div>

            {/* Message List */}
            <div ref={containerRef} className="flex-1 overflow-hidden">
                {filteredMessages.length === 0 && (
                    <div className="text-center text-stone-600 text-sm mt-10 italic opacity-50 p-4">暂无消息...</div>
                )}

                {filteredMessages.length > 0 && useVirtualScroll ? (
                    // 虚拟滚动模式 - 大量消息时使用
                    // react-window v2 自动响应容器大小，只需要 defaultHeight
                    <List<Record<string, never>>
                        listRef={listApiRef as any}
                        defaultHeight={listHeight}
                        rowCount={filteredMessages.length}
                        rowHeight={rowHeight}
                        rowComponent={RowComponent}
                        rowProps={{}}
                        className="scrollbar-thin h-full w-full"
                    />
                ) : (
                    // 普通滚动模式 - 少量消息时使用
                    <div className="h-full overflow-y-auto p-4 space-y-3 scrollbar-thin">
                        {filteredMessages.map(msg => {
                            const isMe = msg.senderId === user?.id;
                            return (
                                <MessageItem
                                    key={msg.id}
                                    msg={msg}
                                    isMe={isMe}
                                    seats={seats}
                                />
                            );
                        })}
                        <div ref={endRef} />
                    </div>
                )}
            </div>

            {/* Input Area */}
            {activeChannel === 'CHAT' && (
                <form 
                    onSubmit={handleSend} 
                    className="p-3 border-t border-stone-700 bg-stone-950 transition-all"
                    style={{ paddingBottom: keyboardOffset > 0 ? `${keyboardOffset + 12}px` : undefined }}
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] uppercase text-stone-500 font-bold tracking-wider">发送给:</span>
                        {(allowWhispers || user?.isStoryteller) ? (
                            <select
                                value={recipientId || ''}
                                onChange={(e) => setRecipientId(e.target.value || null)}
                                className={`bg-stone-900 border text-xs rounded px-2 py-1 outline-none transition-colors ${recipientId ? 'border-purple-600 text-purple-300' : 'border-stone-700 text-stone-400'}`}
                            >
                                <option value="">📢 所有人 (Public)</option>
                                {availableRecipients.map(s => (
                                    <option key={s.userId} value={s.userId!}>
                                        🕵️ {s.userName} ({s.id + 1}号)
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <div className="text-xs text-red-500 flex items-center gap-1 border border-red-900/30 bg-red-950/20 px-2 py-1 rounded">
                                <span>⛔</span>
                                <span>私聊已禁用 (Disabled)</span>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <input
                            ref={inputRef}
                            className={`w-full bg-stone-800 text-stone-200 text-sm rounded-sm px-4 py-2 outline-none border focus:ring-1 transition-all pr-10 ${recipientId ? 'border-purple-800 focus:border-purple-600 focus:ring-purple-900' : 'border-stone-700 focus:border-red-700 focus:ring-red-900'}`}
                            placeholder={recipientId ? "发送悄悄话..." : "发送公开消息..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className={`absolute right-1 top-1 bottom-1 w-8 h-8 flex items-center justify-center rounded-sm text-white transition-colors disabled:opacity-50 disabled:bg-transparent ${recipientId ? 'bg-purple-800 hover:bg-purple-700' : 'bg-stone-700 hover:bg-red-700'}`}
                        >
                            <span className="text-xs">➤</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
