import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ChatMessage } from '../types';
import { VotingChart } from './VotingChart';

// Initialize Supabase client locally for this component
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface HistoryRecord {
    id: number;
    room_code: string;
    winner: 'GOOD' | 'EVIL';
    reason: string;
    script_name: string;
    players: any[];
    messages: ChatMessage[];
    created_at: string;
    state?: any;
}

interface HistoryViewerProps {
    onClose: () => void;
}

export const HistoryViewer: React.FC<HistoryViewerProps> = ({ onClose }) => {
    const [records, setRecords] = useState<HistoryRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'votes'>('details');

    const selectedVoteHistory = selectedRecord?.state?.voteHistory ?? [];
    const selectedSeats = selectedRecord?.state?.seats ?? [];

    useEffect(() => {
        void fetchHistory();

        // 订阅实时更新
        const channel = supabase
            .channel('game_history_changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'game_history'
                },
                (payload) => {
                    console.log('📜 New game history:', payload.new);
                    // 将新记录添加到列表最前面
                    setRecords(prev => [payload.new as HistoryRecord, ...prev]);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('game_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setRecords(data || []);
        } catch (err) {
            console.error("Error fetching history:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-200 font-serif">
            <div className="bg-stone-900 border border-stone-700 rounded-lg w-full max-w-6xl h-[85vh] flex shadow-2xl overflow-hidden">

                {/* Sidebar: List */}
                <div className="w-1/3 border-r border-stone-800 flex flex-col bg-stone-950">
                    <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900">
                        <h2 className="text-stone-200 font-bold font-cinzel tracking-wider">📜 Chronicles</h2>
                        <button onClick={() => void fetchHistory()} className="text-stone-500 hover:text-stone-300 text-xs">↻ Refresh</button>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        {loading ? (
                            <div className="p-8 text-center text-stone-600 italic">Loading chronicles...</div>
                        ) : records.length === 0 ? (
                            <div className="p-8 text-center text-stone-600 italic">No history found.</div>
                        ) : (
                            records.map(record => (
                                <button
                                    key={record.id}
                                    onClick={() => setSelectedRecord(record)}
                                    className={`w-full text-left p-4 border-b border-stone-800 transition-colors hover:bg-stone-900 ${selectedRecord?.id === record.id ? 'bg-stone-900 border-l-4 border-l-amber-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-stone-500 font-mono">{new Date(record.created_at).toLocaleString()}</span>
                                        <span className={`text-xs font-bold px-1.5 rounded ${record.winner === 'GOOD' ? 'bg-blue-900/30 text-blue-400' : 'bg-red-900/30 text-red-400'}`}>
                                            {record.winner} WINS
                                        </span>
                                    </div>
                                    <div className="text-stone-300 font-bold mb-1 truncate">{record.script_name}</div>
                                    <div className="text-xs text-stone-500 truncate">Room: {record.room_code} • {record.reason}</div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main: Details */}
                <div className="flex-1 flex flex-col bg-stone-900/50 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 z-10">✕ Close</button>

                    {selectedRecord ? (
                        <div className="flex-1 flex flex-col">
                            {/* Tabs */}
                            <div className="flex border-b border-stone-800 bg-stone-950 px-8 pt-4">
                                <button
                                    onClick={() => setActiveTab('details')}
                                    className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'details'
                                        ? 'text-amber-400 border-b-2 border-amber-600'
                                        : 'text-stone-500 hover:text-stone-300'
                                        }`}
                                >
                                    Details
                                </button>
                                <button
                                    onClick={() => setActiveTab('votes')}
                                    className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'votes'
                                        ? 'text-amber-400 border-b-2 border-amber-600'
                                        : 'text-stone-500 hover:text-stone-300'
                                        }`}
                                >
                                    Voting History
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                                {activeTab === 'details' ? (
                                    <>
                                        <div className="text-center mb-8">
                                            <h1 className="text-3xl font-cinzel font-bold text-stone-200 mb-2">{selectedRecord.script_name}</h1>
                                            <div className={`inline-block px-4 py-1 rounded border ${selectedRecord.winner === 'GOOD' ? 'border-blue-800 bg-blue-950/50 text-blue-300' : 'border-red-800 bg-red-950/50 text-red-300'}`}>
                                                {selectedRecord.winner} Victory
                                            </div>
                                            <p className="text-stone-500 mt-2 italic">"{selectedRecord.reason}"</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Players List */}
                                            <div>
                                                <h3 className="text-stone-400 font-bold uppercase tracking-widest border-b border-stone-700 pb-2 mb-4 font-cinzel">Dramatis Personae</h3>
                                                <div className="space-y-2">
                                                    {selectedRecord.players.map((p, i) => (
                                                        <div key={i} className="flex justify-between items-center p-2 rounded bg-stone-950/50 border border-stone-800">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-stone-600 font-mono text-xs w-6">{i + 1}</span>
                                                                <span className={`font-bold ${p.isDead ? 'text-stone-500 line-through decoration-red-900' : 'text-stone-300'}`}>{p.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs ${p.team === 'DEMON' ? 'text-red-500' : p.team === 'MINION' ? 'text-orange-500' : 'text-blue-400'}`}>
                                                                    {p.role || 'Unknown'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Chat Log */}
                                            <div className="flex flex-col h-[500px]">
                                                <h3 className="text-stone-400 font-bold uppercase tracking-widest border-b border-stone-700 pb-2 mb-4 font-cinzel">Archives</h3>
                                                <div className="flex-1 overflow-y-auto bg-stone-950 rounded border border-stone-800 p-4 space-y-3 font-sans text-sm">
                                                    {selectedRecord.messages.map(msg => (
                                                        <div key={msg.id} className={`flex flex-col ${msg.type === 'system' ? 'items-center my-2' : 'items-start'}`}>
                                                            {msg.type === 'system' ? (
                                                                <span className="text-[10px] text-stone-600 border border-stone-800 px-2 py-0.5 rounded-full bg-stone-900">{msg.content}</span>
                                                            ) : (
                                                                <div className="max-w-[90%]">
                                                                    <span className="text-[10px] text-stone-500 mr-2">{msg.senderName}:</span>
                                                                    <span className="text-stone-300">{msg.content}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    selectedVoteHistory.length > 0 ? (
                                        <VotingChart voteHistory={selectedVoteHistory} seats={selectedSeats} />
                                    ) : (
                                        <div className="text-center text-stone-500 text-sm italic">
                                            该记录未包含投票数据。
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-stone-600 italic">
                            Select a chronicle to view details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
