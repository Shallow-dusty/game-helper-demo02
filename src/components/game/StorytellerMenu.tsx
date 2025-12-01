import React from 'react';
import { ROLES, STATUS_OPTIONS, PRESET_REMINDERS } from '../../constants';
import { Seat, SeatStatus } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { motion } from 'framer-motion';
import { Skull, Heart, Ban, Theater, Scale, Trash2, ArrowLeftRight, X, LogOut } from 'lucide-react';

interface StorytellerMenuProps {
    seat: Seat;
    onClose: () => void;
    actions: {
        toggleDead: (id: number) => void;
        toggleAbilityUsed: (id: number) => void;
        toggleStatus: (id: number, status: SeatStatus) => void;
        addReminder: (id: number, text: string, icon?: string, color?: string) => void;
        removeReminder: (id: string) => void;
        removeVirtualPlayer: (id: number) => void;
        startVote: (id: number) => void;
        setRoleSelectSeat: (id: number) => void;
        setSwapSourceId: (id: number) => void;
        forceLeaveSeat: (id: number) => void;
    };
    currentScriptId: string;
}

export const StorytellerMenu: React.FC<StorytellerMenuProps> = ({ seat, onClose, actions, currentScriptId }) => {
    const selectedRole = seat.seenRoleId ? ROLES[seat.seenRoleId] : null;
    const roleTeamIcon = selectedRole?.team === 'DEMON' ? '👿' : selectedRole?.team === 'MINION' ? '🧪' : '⚜️';

    return (
        <div
            className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[1000]"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="w-full max-w-md p-4"
                onClick={(e) => e.stopPropagation()}
            >
                <Card className="border-stone-700 bg-stone-950/95 shadow-2xl overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-stone-800 pb-4 bg-stone-900/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center border border-stone-700 text-2xl shadow-inner">
                                {seat.seenRoleId ? roleTeamIcon : '👤'}
                            </div>
                            <div>
                                <CardTitle className="text-xl text-stone-200">{seat.userName}</CardTitle>
                                <p className="text-xs text-stone-500 font-mono mt-1">
                                    SEAT {seat.id + 1} • {selectedRole?.name || 'NO ROLE'}
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="text-stone-500 hover:text-stone-300">
                            <X className="w-5 h-5" />
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0">
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {/* Alive/Dead Toggle */}
                            <Button
                                variant={seat.isDead ? "destructive" : "secondary"}
                                className="h-auto py-3 flex justify-start gap-3"
                                onClick={() => { actions.toggleDead(seat.id); onClose(); }}
                            >
                                {seat.isDead ? <Skull className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                <div className="text-left">
                                    <div className="font-bold text-sm">切换存活状态</div>
                                    <div className="text-[10px] opacity-70">{seat.isDead ? '当前: 已死亡' : '当前: 存活'}</div>
                                </div>
                            </Button>

                            {/* Ability Used Toggle */}
                            <Button
                                variant={seat.hasUsedAbility ? "ghost" : "secondary"}
                                className={`h-auto py-3 flex justify-start gap-3 ${seat.hasUsedAbility ? 'bg-stone-900 text-stone-500' : ''}`}
                                onClick={() => { actions.toggleAbilityUsed(seat.id); onClose(); }}
                            >
                                <Ban className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-bold text-sm">技能使用</div>
                                    <div className="text-[10px] opacity-70">{seat.hasUsedAbility ? '已使用' : '未使用'}</div>
                                </div>
                            </Button>

                            {/* Assign Role */}
                            <Button
                                variant="secondary"
                                className="h-auto py-3 flex justify-start gap-3"
                                onClick={() => { actions.setRoleSelectSeat(seat.id); onClose(); }}
                            >
                                <Theater className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-bold text-sm">分配角色</div>
                                    <div className="text-[10px] opacity-70">更改角色身份</div>
                                </div>
                            </Button>

                            {/* Nominate */}
                            <Button
                                variant="secondary"
                                className="h-auto py-3 flex justify-start gap-3"
                                onClick={() => { actions.startVote(seat.id); onClose(); }}
                            >
                                <Scale className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-bold text-sm">发起提名</div>
                                    <div className="text-[10px] opacity-70">开始投票流程</div>
                                </div>
                            </Button>

                            {/* Swap Seat */}
                            <Button
                                variant="secondary"
                                className="h-auto py-3 flex justify-start gap-3"
                                onClick={() => { actions.setSwapSourceId(seat.id); onClose(); }}
                            >
                                <ArrowLeftRight className="w-5 h-5" />
                                <div className="text-left">
                                    <div className="font-bold text-sm">交换座位</div>
                                    <div className="text-[10px] opacity-70">移动玩家位置</div>
                                </div>
                            </Button>

                            {/* Remove Virtual Player */}
                            {seat.isVirtual && (
                                <Button
                                    variant="destructive"
                                    className="h-auto py-3 flex justify-start gap-3 col-span-1 bg-red-950/30 border-red-900/50 hover:bg-red-900/50"
                                    onClick={() => { actions.removeVirtualPlayer(seat.id); onClose(); }}
                                >
                                    <Trash2 className="w-5 h-5" />
                                    <div className="text-left">
                                        <div className="font-bold text-sm">移除机器人</div>
                                        <div className="text-[10px] opacity-70">清空座位</div>
                                    </div>
                                </Button>
                            )}

                            {/* Kick Player (Real User) */}
                            {!seat.isVirtual && seat.userId && (
                                <Button
                                    variant="destructive"
                                    className="h-auto py-3 flex justify-start gap-3 col-span-1 bg-red-950/30 border-red-900/50 hover:bg-red-900/50"
                                    onClick={() => {
                                        if (window.confirm(`确定要将 ${seat.userName} 踢出座位吗？`)) {
                                            actions.forceLeaveSeat(seat.id);
                                            onClose();
                                        }
                                    }}
                                >
                                    <LogOut className="w-5 h-5" />
                                    <div className="text-left">
                                        <div className="font-bold text-sm">踢出玩家</div>
                                        <div className="text-[10px] opacity-70">强制离开座位</div>
                                    </div>
                                </Button>
                            )}
                        </div>

                        {/* Status Section */}
                        <div className="px-4 pb-4">
                            <h4 className="text-xs font-bold text-stone-500 uppercase mb-2 font-cinzel tracking-wider">状态效果</h4>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.filter(status => {
                                    if (currentScriptId === 'tb' && status.id === 'MADNESS') return false;
                                    return true;
                                }).map(status => {
                                    const hasStatus = seat.statuses.includes(status.id as SeatStatus);
                                    return (
                                        <button
                                            key={status.id}
                                            onClick={() => actions.toggleStatus(seat.id, status.id as SeatStatus)}
                                            className={`px-3 py-1.5 rounded-full text-xs border flex items-center gap-1.5 transition-all ${hasStatus
                                                ? 'bg-amber-900/50 border-amber-600 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                                                : 'bg-stone-900 border-stone-800 text-stone-500 hover:border-stone-600 hover:text-stone-300'
                                                }`}
                                        >
                                            <span>{status.icon}</span>
                                            <span>{status.label.split(' ')[0]}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Reminders Section */}
                        <div className="px-4 pb-4 border-t border-stone-800 pt-4 bg-stone-950/50">
                            <h4 className="text-xs font-bold text-stone-500 uppercase mb-2 font-cinzel tracking-wider">标记提醒</h4>

                            {/* Existing Reminders */}
                            <div className="flex flex-wrap gap-2 mb-3 min-h-[2rem]">
                                {seat.reminders.map(rem => (
                                    <button
                                        key={rem.id}
                                        onClick={() => actions.removeReminder(rem.id)}
                                        className="px-2 py-1 rounded bg-stone-800 border border-stone-600 text-xs text-stone-300 hover:bg-red-900/30 hover:border-red-800 hover:text-red-300 flex items-center gap-1 transition-colors group animate-in fade-in zoom-in duration-200"
                                        title="点击移除"
                                    >
                                        <span>{rem.icon || '🔸'}</span>
                                        <span>{rem.text}</span>
                                        <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                                {seat.reminders.length === 0 && (
                                    <span className="text-xs text-stone-600 italic py-1">暂无标记</span>
                                )}
                            </div>

                            {/* Add Reminder Buttons */}
                            <div className="grid grid-cols-4 gap-2">
                                {PRESET_REMINDERS.map(preset => (
                                    <button
                                        key={preset.text}
                                        onClick={() => {
                                            if (preset.text === '自定义') {
                                                const text = prompt("Enter reminder text:");
                                                if (text) actions.addReminder(seat.id, text, preset.icon, preset.color);
                                            } else {
                                                actions.addReminder(seat.id, preset.text, preset.icon, preset.color);
                                            }
                                        }}
                                        className="p-2 rounded bg-stone-900 border border-stone-800 hover:bg-stone-800 hover:border-stone-700 text-center transition-colors flex flex-col items-center justify-center gap-1 group"
                                    >
                                        <span className="text-lg group-hover:scale-110 transition-transform">{preset.icon}</span>
                                        <span className="text-[10px] text-stone-400">{preset.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};




