import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import { GameHistory, GameState } from '../../types';
import { Grimoire } from '../game/Grimoire';
import { VotingChart } from '../game/VotingChart';

export const GameHistoryView: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const fetchGameHistory = useStore(state => state.fetchGameHistory);
    const [history, setHistory] = useState<GameHistory[]>([]);
    const [selectedGame, setSelectedGame] = useState<GameHistory | null>(null);
    const [replayState, setReplayState] = useState<GameState | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'votes'>('details');

    useEffect(() => {
        fetchGameHistory().then(data => {
            setHistory(data);
            setLoading(false);
        });
    }, [fetchGameHistory]);

    if (replayState) {
        return (
            <div className="fixed inset-0 bg-stone-950 z-50 flex flex-col">
                <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900">
                    <h2 className="text-xl font-cinzel text-stone-200">
                        📜 历史回放: {selectedGame?.script_name} ({new Date(selectedGame?.created_at || '').toLocaleDateString()})
                    </h2>
                    <button
                        onClick={() => setReplayState(null)}
                        className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded"
                    >
                        退出回放
                    </button>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    <Grimoire
                        width={window.innerWidth}
                        height={window.innerHeight - 80}
                        readOnly={true}
                        gameState={replayState}
                        isStorytellerView={true} // Show all info in replay
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in font-serif">
            <div className="bg-stone-900 border border-stone-700 rounded-lg w-full max-w-6xl h-[85vh] flex shadow-2xl overflow-hidden">

                {/* Sidebar: Game List */}
                <div className="w-1/3 border-r border-stone-800 flex flex-col bg-stone-950">
                    <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900">
                        <h2 className="text-stone-200 font-bold font-cinzel tracking-wider">📜 游戏记录</h2>
                        <button onClick={onClose} className="md:hidden text-stone-500">×</button>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                        {loading ? (
                            <div className="p-8 text-center text-stone-600 italic">加载中...</div>
                        ) : history.length === 0 ? (
                            <div className="p-8 text-center text-stone-600 italic">暂无游戏记录</div>
                        ) : (
                            history.map(game => (
                                <button
                                    key={game.id}
                                    onClick={() => setSelectedGame(game)}
                                    className={`w-full text-left p-4 border-b border-stone-800 transition-colors hover:bg-stone-900 ${selectedGame?.id === game.id ? 'bg-stone-900 border-l-4 border-l-amber-600' : 'border-l-4 border-l-transparent'}`}
                                >
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-stone-500 font-mono">{new Date(game.created_at).toLocaleString()}</span>
                                        <span className={`text-xs font-bold px-1.5 rounded ${game.winner === 'GOOD' ? 'bg-blue-900/30 text-blue-400' : game.winner === 'EVIL' ? 'bg-red-900/30 text-red-400' : 'bg-stone-800 text-stone-400'}`}>
                                            {game.winner === 'GOOD' ? '好人胜利' : game.winner === 'EVIL' ? '邪恶胜利' : '未分胜负'}
                                        </span>
                                    </div>
                                    <div className="text-stone-300 font-bold mb-1 truncate">{game.script_name}</div>
                                    <div className="text-xs text-stone-500 truncate">Room: {game.room_code} • {game.reason}</div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content: Details */}
                <div className="flex-1 flex flex-col bg-stone-900/50 relative">
                    <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 z-10 hidden md:block">✕ 关闭</button>

                    {selectedGame ? (
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
                                    详情
                                </button>
                                <button
                                    onClick={() => setActiveTab('votes')}
                                    className={`px-4 py-2 font-bold text-sm transition-colors ${activeTab === 'votes'
                                        ? 'text-amber-400 border-b-2 border-amber-600'
                                        : 'text-stone-500 hover:text-stone-300'
                                        }`}
                                >
                                    投票记录
                                </button>
                                <div className="flex-1"></div>
                                <button
                                    onClick={() => setReplayState(selectedGame.state)}
                                    className="px-4 py-2 bg-indigo-900/30 border border-indigo-700 hover:bg-indigo-800/50 text-indigo-200 rounded flex items-center gap-2 transition-colors text-xs mb-2"
                                >
                                    <span>🎥</span> 观看回放
                                </button>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
                                {activeTab === 'details' ? (
                                    <>
                                        <div className="text-center mb-8">
                                            <h1 className="text-3xl font-cinzel font-bold text-stone-200 mb-2">{selectedGame.script_name}</h1>
                                            <div className={`inline-block px-4 py-1 rounded border ${selectedGame.winner === 'GOOD' ? 'border-blue-800 bg-blue-950/50 text-blue-300' : selectedGame.winner === 'EVIL' ? 'border-red-800 bg-red-950/50 text-red-300' : 'border-stone-800 bg-stone-950 text-stone-400'}`}>
                                                {selectedGame.winner === 'GOOD' ? '好人胜利' : selectedGame.winner === 'EVIL' ? '邪恶胜利' : '未分胜负'}
                                            </div>
                                            <p className="text-stone-500 mt-2 italic">"{selectedGame.reason}"</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            {/* Players List */}
                                            <div>
                                                <h3 className="text-stone-400 font-bold uppercase tracking-widest border-b border-stone-700 pb-2 mb-4 font-cinzel">玩家名单</h3>
                                                <div className="space-y-2">
                                                    {selectedGame.players.map((p, i) => (
                                                        <div key={i} className="flex justify-between items-center p-2 rounded bg-stone-950/50 border border-stone-800">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-stone-600 font-mono text-xs w-6">{i + 1}</span>
                                                                <span className={`font-bold ${p.isDead ? 'text-stone-500 line-through decoration-red-900' : 'text-stone-300'}`}>{p.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`text-xs ${p.team === 'DEMON' ? 'text-red-500' : p.team === 'MINION' ? 'text-orange-500' : p.team === 'OUTSIDER' ? 'text-purple-400' : 'text-blue-400'}`}>
                                                                    {p.role || '未知'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Chat Log */}
                                            <div className="flex flex-col h-[500px]">
                                                <h3 className="text-stone-400 font-bold uppercase tracking-widest border-b border-stone-700 pb-2 mb-4 font-cinzel">聊天记录</h3>
                                                <div className="flex-1 overflow-y-auto bg-stone-950 rounded border border-stone-800 p-4 space-y-3 font-sans text-sm">
                                                    {selectedGame.messages.map(msg => (
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
                                    <div>
                                        <h3 className="text-stone-400 font-bold uppercase tracking-widest border-b border-stone-700 pb-2 mb-4 font-cinzel">投票历史</h3>
                                        {selectedGame.state.voteHistory && selectedGame.state.voteHistory.length > 0 ? (
                                            <div className="space-y-4">
                                                {selectedGame.state.voteHistory.map((record, idx) => (
                                                    <VotingChart key={idx} voteHistory={[record]} seats={selectedGame.state.seats} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center text-stone-500 text-sm italic py-10">
                                                该记录未包含投票数据。
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-stone-600 italic">
                            请从左侧选择一个游戏记录查看详情。
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



