import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../../store';
import { ChatMessage, Seat } from '../../types';
import { InfoCard } from '../ui/InfoCard';
import * as ReactWindow from 'react-window';
// @ts-expect-error react-window types may not match at runtime
const List = (ReactWindow.FixedSizeList ?? (ReactWindow as { default?: { FixedSizeList?: unknown } }).default?.FixedSizeList) as React.ComponentType<{
    listRef?: React.RefObject<{ scrollToRow: (params: { index: number; align?: string }) => void } | null>;
    defaultHeight: number;
    rowCount: number;
    rowHeight: number;
    rowComponent: React.ComponentType<{ index: number; style: React.CSSProperties }>;
    rowProps: Record<string, never>;
    className?: string;
}>;

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
            <div style={style} className="px-4 py-2">
                <div className="flex items-start gap-3 my-1 text-stone-400 border-l-2 border-stone-800 pl-3 py-2 bg-[#0c0a09]/50 rounded-r-sm font-serif relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-stone-900/50 to-transparent pointer-events-none" />
                    <span className="text-sm mt-0.5 relative z-10 opacity-70">📜</span>
                    <span className="text-xs leading-relaxed relative z-10 text-stone-300/90">{msg.content}</span>
                </div>
            </div>
        );
    }

    // --- CHAT RENDER ---
    const senderSeat = seats.find(s => s.userId === msg.senderId);
    const displayName = senderSeat ? `[${String(senderSeat.id + 1)}] ${msg.senderName}` : msg.senderName;

    return (
        <div style={style} className="px-4 py-2">
            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold tracking-wider uppercase font-cinzel ${isPrivate ? 'text-purple-400' : 'text-stone-500'}`}>
                        {displayName}
                        {isPrivate && !isMe && " (悄悄话)"}
                        {isPrivate && isMe && ` ➜ ${seats.find(s => s.userId === msg.recipientId)?.userName ?? '未知'}`}
                    </span>
                </div>
                <div
                    className={`px-4 py-2.5 text-sm max-w-[90%] break-words shadow-lg relative font-serif leading-relaxed ${isPrivate
                        ? 'bg-purple-950/40 text-purple-100 border border-purple-900/50 italic rounded-sm'
                        : isMe
                            ? 'bg-[#2a0a0a] text-stone-200 border border-red-900/30 rounded-sm rounded-tr-none shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
                            : 'bg-[#1c1917] text-stone-300 border border-stone-800 rounded-sm rounded-tl-none shadow-[0_2px_10px_rgba(0,0,0,0.3)]'
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
    const messages = useStore(state => state.gameState?.messages ?? []);
    const seats = useStore(state => state.gameState?.seats ?? []);
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
        <div className="flex flex-col h-full bg-[#1c1917] font-cinzel border-l-4 border-stone-800 shadow-2xl relative overflow-hidden">
            {/* Background Texture Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] z-0"></div>

            {/* Channel Tabs */}
            <div className="flex border-b border-stone-800 bg-[#0c0a09] relative z-10">
                <button
                    onClick={() => setActiveChannel('CHAT')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeChannel === 'CHAT' 
                        ? 'bg-[#1c1917] text-amber-500 border-b-2 border-amber-600 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5)]' 
                        : 'text-stone-600 hover:text-stone-400 hover:bg-[#151312]'}`}
                >
                    💬 聊天
                </button>
                <button
                    onClick={() => setActiveChannel('LOG')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-all ${activeChannel === 'LOG' 
                        ? 'bg-[#1c1917] text-amber-200 border-b-2 border-amber-800 shadow-[inset_0_-10px_20px_rgba(0,0,0,0.5)]' 
                        : 'text-stone-600 hover:text-stone-400 hover:bg-[#151312]'}`}
                >
                    📜 记录
                </button>
            </div>

            {/* Message List */}
            <div ref={containerRef} className="flex-1 overflow-hidden relative z-10 bg-[#1c1917]/90 backdrop-blur-sm">
                {filteredMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-stone-700 opacity-50">
                        <span className="text-4xl mb-2">🕸️</span>
                        <span className="text-sm italic font-serif">暂无消息...</span>
                    </div>
                )}

                {filteredMessages.length > 0 && useVirtualScroll ? (
                    <List<Record<string, never>>
                        listRef={listApiRef as React.RefObject<{ scrollToRow: (params: { index: number; align?: string }) => void } | null>}
                        defaultHeight={listHeight}
                        rowCount={filteredMessages.length}
                        rowHeight={rowHeight}
                        rowComponent={RowComponent}
                        rowProps={{}}
                        className="scrollbar-thin h-full w-full"
                    />
                ) : (
                    <div className="h-full overflow-y-auto p-4 space-y-4 scrollbar-thin">
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
                    className="p-4 border-t border-stone-800 bg-[#0c0a09] relative z-20 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]"
                    style={{ paddingBottom: keyboardOffset > 0 ? `${String(keyboardOffset + 16)}px` : undefined }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] uppercase text-stone-500 font-bold tracking-widest">发送给:</span>
                        {(allowWhispers || user?.isStoryteller) ? (
                            <div className="relative flex-1">
                                <select
                                    value={recipientId ?? ''}
                                    onChange={(e) => setRecipientId(e.target.value || null)}
                                    className={`w-full appearance-none bg-[#1c1917] border text-xs rounded-sm px-3 py-1.5 outline-none transition-colors font-serif ${recipientId ? 'border-purple-900 text-purple-300 shadow-[0_0_10px_rgba(147,51,234,0.1)]' : 'border-stone-700 text-stone-400 hover:border-stone-600'}`}
                                >
                                    <option value="">📢 所有人 (Public)</option>
                                    {availableRecipients.map(s => (
                                        <option key={s.userId} value={s.userId ?? ''}>
                                            🕵️ {s.userName} ({s.id + 1}号)
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[10px] text-stone-500">▼</div>
                            </div>
                        ) : (
                            <div className="text-xs text-red-900/80 flex items-center gap-2 border border-red-900/20 bg-red-950/10 px-3 py-1 rounded-sm w-full">
                                <span>🔒</span>
                                <span className="font-serif italic">私聊已禁用</span>
                            </div>
                        )}
                    </div>

                    <div className="relative group">
                        <input
                            ref={inputRef}
                            className={`w-full bg-[#1c1917] text-stone-200 text-sm rounded-sm px-4 py-3 outline-none border transition-all pr-12 font-serif placeholder:text-stone-700 ${recipientId 
                                ? 'border-purple-900/50 focus:border-purple-600 focus:shadow-[0_0_15px_rgba(147,51,234,0.2)]' 
                                : 'border-stone-800 focus:border-amber-700 focus:shadow-[0_0_15px_rgba(245,158,11,0.1)]'}`}
                            placeholder={recipientId ? "发送悄悄话..." : "发送公开消息..."}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim()}
                            className={`absolute right-1.5 top-1.5 bottom-1.5 w-9 flex items-center justify-center rounded-sm text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed ${recipientId 
                                ? 'bg-purple-900 hover:bg-purple-800 border border-purple-700' 
                                : 'bg-stone-800 hover:bg-amber-900 border border-stone-700 hover:border-amber-700'}`}
                        >
                            <span className="text-xs transform group-hover:translate-x-0.5 transition-transform">➤</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};
