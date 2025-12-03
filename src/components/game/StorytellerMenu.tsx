import React from 'react';
import { ROLES, STATUS_OPTIONS, PRESET_REMINDERS } from '../../constants';
import { Seat, SeatStatus } from '../../types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { motion } from 'framer-motion';
import { Skull, Heart, Ban, Theater, Scale, Trash2, ArrowLeftRight, X, LogOut, Settings } from 'lucide-react';
import { AudioSettingsModal } from '../settings/AudioSettingsModal';

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
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

    return (
        <>
            <div
                className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-[1000]"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="w-full max-w-md p-4"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Card className="border-stone-800 bg-[#1c1917] shadow-2xl overflow-hidden text-stone-100 relative">
                        {/* Background Texture */}
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] z-0"></div>
                        
                        <CardHeader className="flex flex-row items-center justify-between border-b border-stone-800 pb-4 bg-[#0c0a09] relative z-10 shadow-md">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-[#2a2725] flex items-center justify-center border-2 border-[#44403c] text-3xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                                    {seat.seenRoleId ? roleTeamIcon : '👤'}
                                </div>
                                <div>
                                    <CardTitle className="text-xl text-[#e7e5e4] font-cinzel tracking-wide">{seat.userName}</CardTitle>
                                    <p className="text-xs text-[#a8a29e] font-serif mt-1 flex items-center gap-2">
                                        <span className="bg-stone-800 px-1.5 py-0.5 rounded text-[#d6d3d1] border border-stone-700">SEAT {seat.id + 1}</span>
                                        <span className="text-[#78716c]">•</span>
                                        <span className="text-[#d4af37] font-bold">{selectedRole?.name || 'NO ROLE'}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => setIsSettingsOpen(true)} 
                                    className="text-stone-500 hover:text-[#d4af37] hover:bg-stone-800/50"
                                    title="音频设置"
                                >
                                    <Settings className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onClose} className="text-stone-500 hover:text-stone-300 hover:bg-stone-800/50">
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </CardHeader>

                    <CardContent className="p-0 relative z-10">
                        <div className="p-4 grid grid-cols-2 gap-3">
                            {/* Alive/Dead Toggle */}
                            <Button
                                variant={seat.isDead ? "destructive" : "secondary"}
                                className={`h-auto py-3 flex justify-start gap-3 border transition-all duration-300 ${seat.isDead 
                                    ? 'bg-red-950/40 border-red-900/50 hover:bg-red-900/60' 
                                    : 'bg-stone-800/50 border-stone-700 hover:bg-stone-800 hover:border-stone-600'}`}
                                onClick={() => { actions.toggleDead(seat.id); onClose(); }}
                            >
                                <div className={`p-2 rounded-full ${seat.isDead ? 'bg-red-900/20 text-red-500' : 'bg-stone-700/50 text-stone-400'}`}>
                                    {seat.isDead ? <Skull className="w-5 h-5" /> : <Heart className="w-5 h-5" />}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm font-cinzel text-stone-200">切换存活状态</div>
                                    <div className="text-[10px] opacity-70 font-serif text-stone-400">{seat.isDead ? '当前: 已死亡' : '当前: 存活'}</div>
                                </div>
                            </Button>

                            {/* Ability Used Toggle */}
                            <Button
                                variant={seat.hasUsedAbility ? "ghost" : "secondary"}
                                className={`h-auto py-3 flex justify-start gap-3 border transition-all duration-300 ${seat.hasUsedAbility 
                                    ? 'bg-stone-900/80 border-stone-800 text-stone-600' 
                                    : 'bg-stone-800/50 border-stone-700 hover:bg-stone-800 hover:border-stone-600'}`}
                                onClick={() => { actions.toggleAbilityUsed(seat.id); onClose(); }}
                            >
                                <div className={`p-2 rounded-full ${seat.hasUsedAbility ? 'bg-stone-800/50 text-stone-600' : 'bg-stone-700/50 text-stone-400'}`}>
                                    <Ban className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm font-cinzel text-stone-200">技能使用</div>
                                    <div className="text-[10px] opacity-70 font-serif text-stone-400">{seat.hasUsedAbility ? '已使用' : '未使用'}</div>
                                </div>
                            </Button>

                            {/* Assign Role */}
                            <Button
                                variant="secondary"
                                className="h-auto py-3 flex justify-start gap-3 bg-stone-800/50 border border-stone-700 hover:bg-stone-800 hover:border-stone-600 transition-all duration-300"
                                onClick={() => { actions.setRoleSelectSeat(seat.id); onClose(); }}
                            >
                                <div className="p-2 rounded-full bg-stone-700/50 text-amber-500">
                                    <Theater className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm font-cinzel text-stone-200">分配角色</div>
                                    <div className="text-[10px] opacity-70 font-serif text-stone-400">更改角色身份</div>
                                </div>
                            </Button>

                            {/* Nominate */}
                            <Button
                                variant="secondary"
                                className="h-auto py-3 flex justify-start gap-3 bg-stone-800/50 border border-stone-700 hover:bg-stone-800 hover:border-stone-600 transition-all duration-300"
                                onClick={() => { actions.startVote(seat.id); onClose(); }}
                            >
                                <div className="p-2 rounded-full bg-stone-700/50 text-stone-400">
                                    <Scale className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm font-cinzel text-stone-200">发起提名</div>
                                    <div className="text-[10px] opacity-70 font-serif text-stone-400">开始投票流程</div>
                                </div>
                            </Button>

                            {/* Swap Seat */}
                            <Button
                                variant="secondary"
                                className="h-auto py-3 flex justify-start gap-3 bg-stone-800/50 border border-stone-700 hover:bg-stone-800 hover:border-stone-600 transition-all duration-300"
                                onClick={() => { actions.setSwapSourceId(seat.id); onClose(); }}
                            >
                                <div className="p-2 rounded-full bg-stone-700/50 text-stone-400">
                                    <ArrowLeftRight className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm font-cinzel text-stone-200">交换座位</div>
                                    <div className="text-[10px] opacity-70 font-serif text-stone-400">移动玩家位置</div>
                                </div>
                            </Button>

                            {/* Remove Virtual Player */}
                            {seat.isVirtual && (
                                <Button
                                    variant="destructive"
                                    className="h-auto py-3 flex justify-start gap-3 col-span-1 bg-red-950/30 border border-red-900/50 hover:bg-red-900/50 transition-all duration-300"
                                    onClick={() => { actions.removeVirtualPlayer(seat.id); onClose(); }}
                                >
                                    <div className="p-2 rounded-full bg-red-900/20 text-red-500">
                                        <Trash2 className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm font-cinzel text-red-200">移除机器人</div>
                                        <div className="text-[10px] opacity-70 font-serif text-red-300">清空座位</div>
                                    </div>
                                </Button>
                            )}

                            {/* Kick Player (Real User) */}
                            {!seat.isVirtual && seat.userId && (
                                <Button
                                    variant="destructive"
                                    className="h-auto py-3 flex justify-start gap-3 col-span-1 bg-red-950/30 border border-red-900/50 hover:bg-red-900/50 transition-all duration-300"
                                    onClick={() => {
                                        if (window.confirm(`确定要将 ${seat.userName} 踢出座位吗？`)) {
                                            actions.forceLeaveSeat(seat.id);
                                            onClose();
                                        }
                                    }}
                                >
                                    <div className="p-2 rounded-full bg-red-900/20 text-red-500">
                                        <LogOut className="w-5 h-5" />
                                    </div>
                                    <div className="text-left">
                                        <div className="font-bold text-sm font-cinzel text-red-200">踢出玩家</div>
                                        <div className="text-[10px] opacity-70 font-serif text-red-300">强制离开座位</div>
                                    </div>
                                </Button>
                            )}
                        </div>

                        {/* Status Section */}
                        <div className="px-4 pb-4">
                            <h4 className="text-xs font-bold text-[#a8a29e] uppercase mb-3 font-cinzel tracking-widest border-b border-stone-800 pb-1">状态效果</h4>
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
                                            className={`px-3 py-1.5 rounded-sm text-xs border flex items-center gap-1.5 transition-all font-serif ${hasStatus
                                                ? 'bg-amber-900/40 border-amber-700 text-amber-200 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
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
                        <div className="px-4 pb-4 border-t border-stone-800 pt-4 bg-[#0c0a09]/50">
                            <h4 className="text-xs font-bold text-[#a8a29e] uppercase mb-3 font-cinzel tracking-widest">标记提醒</h4>

                            {/* Existing Reminders */}
                            <div className="flex flex-wrap gap-2 mb-4 min-h-[2rem]">
                                {seat.reminders.map(rem => (
                                    <button
                                        key={rem.id}
                                        onClick={() => actions.removeReminder(rem.id)}
                                        className="px-2 py-1 rounded-sm bg-stone-800 border border-stone-600 text-xs text-stone-300 hover:bg-red-900/30 hover:border-red-800 hover:text-red-300 flex items-center gap-1 transition-all group animate-in fade-in zoom-in duration-200 shadow-sm"
                                        title="点击移除"
                                    >
                                        <span>{rem.icon || '🔸'}</span>
                                        <span className="font-serif">{rem.text}</span>
                                        <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                                {seat.reminders.length === 0 && (
                                    <span className="text-xs text-stone-700 italic py-1 font-serif">暂无标记...</span>
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
                                        className="p-2 rounded-sm bg-[#1c1917] border border-stone-800 hover:bg-stone-800 hover:border-stone-600 text-center transition-all flex flex-col items-center justify-center gap-1 group shadow-sm"
                                    >
                                        <span className="text-lg group-hover:scale-110 transition-transform filter drop-shadow-md">{preset.icon}</span>
                                        <span className="text-[10px] text-stone-500 font-serif group-hover:text-stone-300">{preset.text}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
        <AudioSettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
    );
};




