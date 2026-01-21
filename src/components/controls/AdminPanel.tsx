import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Lock, Crown, RefreshCw, Loader2, Home } from 'lucide-react';
import { supabase } from '../../store/slices/connection';
import { env } from '../../config/env';

// 管理员密码验证 - 必须通过环境变量配置
// 不提供默认值以确保生产环境安全
const ADMIN_PASSWORD = env.ADMIN_PASSWORD;

// 如果未配置密码，禁用管理面板
const ADMIN_PANEL_ENABLED = !!ADMIN_PASSWORD;

interface RoomInfo {
    room_code: string;
    state: unknown;
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
    const { t } = useTranslation();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setError('');
            void fetchRooms();
        } else {
            setError(t('controls.admin.passwordError'));
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
            setRooms(data);
        } catch (err: unknown) {
            console.error('Failed to fetch rooms:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(t('controls.admin.fetchError') + ': ' + errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const closeRoom = async (roomCode: string) => {
        if (!confirm(`${t('controls.admin.closeConfirm')} ${roomCode} ${t('controls.admin.deleteData')}`)) return;

        try {
            const { error } = await supabase
                .from('game_rooms')
                .delete()
                .eq('room_code', roomCode);

            if (error) throw error;

            setRooms(prev => prev.filter(r => r.room_code !== roomCode));
        } catch (err: unknown) {
            console.error('Failed to close room:', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            setError(t('controls.admin.closeError') + ': ' + errorMessage);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-CN');
    };

    const getPlayerCount = (state: unknown): number => {
        try {
            const parsed = typeof state === 'string' ? JSON.parse(state) as unknown : state;
            if (parsed !== null && typeof parsed === 'object' && 'seats' in parsed && Array.isArray(parsed.seats)) {
                return parsed.seats.filter((s: unknown) => {
                    if (s !== null && typeof s === 'object') {
                        const seat = s as Record<string, unknown>;
                        return seat.userId ?? seat.isVirtual;
                    }
                    return false;
                }).length;
            }
            return 0;
        } catch {
            return 0;
        }
    };

    const getPhase = (state: unknown): string => {
        try {
            const parsed = typeof state === 'string' ? JSON.parse(state) as unknown : state;
            if (parsed !== null && typeof parsed === 'object' && 'phase' in parsed) {
                const phase = (parsed as Record<string, unknown>).phase;
                return typeof phase === 'string' ? phase : 'UNKNOWN';
            }
            return 'UNKNOWN';
        } catch {
            return 'UNKNOWN';
        }
    };

    // 如果未配置管理员密码，显示禁用提示
    if (!ADMIN_PANEL_ENABLED) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={onClose}>
                <div className="bg-stone-900 rounded-lg border border-stone-700 p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-stone-200 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        管理面板未启用
                    </h2>
                    <p className="text-stone-400 text-sm mb-4">
                        管理面板需要配置环境变量 <code className="bg-stone-800 px-2 py-1 rounded text-amber-500">VITE_ADMIN_PASSWORD</code> 才能使用。
                    </p>
                    <p className="text-stone-500 text-xs mb-4">
                        请在 <code className="bg-stone-800 px-1 rounded">.env.local</code> 文件中设置密码后重启应用。
                    </p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full bg-stone-700 hover:bg-stone-600 text-stone-200 py-2 rounded font-bold cursor-pointer"
                    >
                        关闭
                    </button>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={onClose}>
                <div className="bg-stone-900 rounded-lg border border-stone-700 p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-stone-200 mb-4 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-amber-500" />
                        {t('controls.admin.title')}
                    </h2>
                    <form onSubmit={handleLogin}>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={t('controls.admin.passwordError')}
                            className="w-full bg-stone-800 border border-stone-600 rounded px-3 py-2 text-stone-200 mb-3 focus:outline-none focus:border-amber-600"
                            autoFocus
                        />
                        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 bg-amber-700 hover:bg-amber-600 text-white py-2 rounded font-bold cursor-pointer"
                            >
                                {t('common.submit')}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded cursor-pointer"
                            >
                                {t('common.cancel')}
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
                        <Crown className="w-6 h-6 text-amber-500" />
                        <div>
                            <h2 className="text-lg font-bold text-amber-400">{t('controls.admin.title')}</h2>
                            <p className="text-xs text-stone-500">{t('controls.admin.title')}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => void fetchRooms()}
                            className="px-3 py-1 bg-stone-700 hover:bg-stone-600 text-stone-300 rounded text-sm cursor-pointer flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            {t('ui.updateNotification.refresh')}
                        </button>
                        <button onClick={onClose} className="text-stone-500 hover:text-stone-300 text-2xl cursor-pointer">✕</button>
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
                            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                            {t('common.loading')}
                        </div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-8 text-stone-500">
                            <Home className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            {t('ui.empty.noData')}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-sm text-stone-400 mb-4">
                                {t('lobby.playerCount')}: <span className="text-amber-400 font-bold">{rooms.length}</span>
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
                                                    <span className="text-stone-500">{t('lobby.playerCount')}:</span>{' '}
                                                    <span className="text-stone-200">{getPlayerCount(room.state)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-stone-500">{t('lobby.createRoomTitle')}:</span>{' '}
                                                    <span className="text-stone-200">{formatDate(room.created_at)}</span>
                                                </div>
                                                <div>
                                                    <span className="text-stone-500">{t('ui.updateNotification.title')}:</span>{' '}
                                                    <span className="text-stone-200">{formatDate(room.updated_at)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => void closeRoom(room.room_code)}
                                            className="px-3 py-1 bg-red-900/50 hover:bg-red-800 text-red-300 rounded text-sm border border-red-800/50 transition-colors cursor-pointer"
                                        >
                                            {t('common.close')}
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
