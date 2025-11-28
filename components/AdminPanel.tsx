import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 简单的管理员密码验证（生产环境应使用更安全的方式）
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'grimoire_admin_2024';

interface RoomInfo {
    room_code: string;
    state: any;
    updated_at: string;
    created_at: string;
}

interface AdminPanelProps {
    onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [rooms, setRooms] = useState<RoomInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setError('');
            fetchRooms();
        } else {
            setError('密码错误');
        }
    };

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('game_rooms')
                .select('*')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            setRooms(data || []);
        } catch (err: any) {
            console.error('Failed to fetch rooms:', err);
            setError('获取房间列表失败: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const closeRoom = async (roomCode: string) => {
        if (!confirm(`确定要关闭房间 ${roomCode} 吗？这将删除该房间的所有数据。`)) return;

        try {
            const { error } = await supabase
                .from('game_rooms')
                .delete()
                .eq('room_code', roomCode);

            if (error) throw error;

            setRooms(prev => prev.filter(r => r.room_code !== roomCode));
        } catch (err: any) {
            console.error('Failed to close room:', err);
            setError('关闭房间失败: ' + err.message);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    const getPlayerCount = (state: any) => {
        try {
            const parsed = typeof state === 'string' ? JSON.parse(state) : state;
            return parsed?.seats?.filter((s: any) => s.userId || s.isVirtual)?.length || 0;
        } catch {
            return 0;
        }
    };

    const getPhase = (state: any) => {
        try {
            const parsed = typeof state === 'string' ? JSON.parse(state) : state;
            return parsed?.phase || 'UNKNOWN';
        } catch {
            return 'UNKNOWN';
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={onClose}>
                <div className="bg-stone-900 rounded-lg border border-stone-700 p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-stone-200 mb-4 flex items-center gap-2">
                        <span>🔐</span> 管理员登录
                    </h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="输入管理员密码"
                            className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 text-stone-200 mb-3 focus:outline-none focus:border-amber-600"
                            autoFocus
                        />
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-amber-700 hover:bg-amber-600 text-white py-2 rounded font-bold"
                            >
                                登录
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded"
                            >
                                取消
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-stone-900 rounded-lg border border-amber-700 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-4 border-b border-stone-700 bg-stone-950 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">👑</span>
                        <div>
                            <h2 className="text-lg font-bold text-amber-400">管理员控制台</h2>
                            <p className="text-xs text-stone-500">查看和管理活跃房间</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchRooms}
                            className="px-3 py-1 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm"
                        >
                            🔄 刷新
                        </button>
                        <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-2xl">✕</button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-5rem)]">
                    {error && (
                        <div className="bg-red-900/30 border border-red-800 text-red-300 p-3 rounded mb-4 text-sm">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="text-center py-8 text-stone-500">
                            <div className="animate-spin text-3xl mb-2">⏳</div>
                            加载中...
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-8 text-stone-500">
                            <div className="text-3xl mb-2">🏚️</div>
                            暂无活跃房间
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-stone-400 mb-4">
                                共 <span className="text-amber-400 font-bold">{rooms.length}</span> 个活跃房间
                            </p>

                            {rooms.map(room => (
                                <div
                                    key={room.room_code}
                                    className="bg-stone-800/50 border border-stone-700 rounded-lg p-4 hover:border-stone-600 transition-colors"
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-lg font-mono font-bold text-amber-400">
                                                    {room.room_code}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded ${getPhase(room.state) === 'SETUP' ? 'bg-stone-700 text-stone-300' :
                                                        getPhase(room.state) === 'NIGHT' ? 'bg-indigo-900/50 text-indigo-300' :
                                                            getPhase(room.state) === 'DAY' ? 'bg-amber-900/50 text-amber-300' :
                                                                'bg-stone-700 text-stone-400'
                                                    }`}>
                                                    {getPhase(room.state)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-stone-400">
                                                <div>
                                                    <span className="text-stone-500">玩家数:</span>{' '}
                                                    <span className="text-stone-200">{getPlayerCount(room.state)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-stone-500">创建时间:</span>{' '}
                                                    <span className="text-stone-200">{formatDate(room.created_at)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-stone-500">最后更新:</span>{' '}
                                                    <span className="text-stone-200">{formatDate(room.updated_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => closeRoom(room.room_code)}
                                            className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-sm border border-red-800/50 transition-colors"
                                        >
                                            关闭房间
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
