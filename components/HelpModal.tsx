import React from 'react';

interface HelpModalProps {
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200 font-serif">
            <div className="bg-stone-900 border border-stone-700 p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl relative text-stone-300">
                <button onClick={onClose} className="absolute top-4 right-4 text-stone-500 hover:text-stone-200 text-xl transition-colors">×</button>
                <h2 className="text-2xl font-bold text-amber-600 mb-6 font-cinzel border-b border-stone-800 pb-2 flex items-center gap-2">
                    <span>📜</span> 说书人操作指南
                </h2>

                <div className="space-y-6">
                    <section>
                        <h3 className="text-lg font-bold text-stone-200 mb-3 flex items-center gap-2">
                            <span className="text-amber-700">🎮</span> 游戏流程控制
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-stone-400">
                            <li><strong className="text-stone-300">分配角色：</strong> 在游戏设置中点击“自动分配角色”或在魔典中右键点击座位手动分配。</li>
                            <li><strong className="text-stone-300">发放角色：</strong> 点击“发放角色”让玩家看到自己的身份。再次点击可隐藏。</li>
                            <li><strong className="text-stone-300">阶段切换：</strong> 使用“白天”、“夜晚”、“提名”按钮控制游戏进程。</li>
                            <li><strong className="text-stone-300">夜间行动：</strong> 在夜晚阶段，按照“夜间行动顺序”列表依次唤醒角色。点击“执行夜间动作”可记录行动。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-stone-200 mb-3 flex items-center gap-2">
                            <span className="text-amber-700">📖</span> 魔典 (Grimoire) 操作
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-stone-400">
                            <li><strong className="text-stone-300">右键菜单：</strong> 右键点击玩家Token可打开操作菜单。</li>
                            <li><strong className="text-stone-300">状态管理：</strong> 在右键菜单中可设置中毒、醉酒、保护等状态，或标记玩家死亡。</li>
                            <li><strong className="text-stone-300">添加标记：</strong> 使用“添加标记”功能在Token旁添加视觉提示（如“被调查”、“被保护”）。</li>
                            <li><strong className="text-stone-300">虚拟玩家：</strong> 点击“添加虚拟玩家”可增加占位符，用于测试或填补空位。</li>
                        </ul>
                    </section>

                    <section>
                        <h3 className="text-lg font-bold text-stone-200 mb-3 flex items-center gap-2">
                            <span className="text-amber-700">🎵</span> 氛围与工具
                        </h3>
                        <ul className="list-disc list-inside space-y-2 text-sm text-stone-400">
                            <li><strong className="text-stone-300">氛围音效：</strong> 在“氛围音效”面板选择并播放背景音乐，增强代入感。</li>
                            <li><strong className="text-stone-300">笔记本：</strong> 切换到“笔记”标签页，随时记录游戏中的关键信息和推理逻辑。</li>
                            <li><strong className="text-stone-300">AI助手：</strong> 在“助手”标签页咨询AI关于规则或判决的问题。</li>
                        </ul>
                    </section>

                    <div className="mt-6 p-4 bg-stone-950 rounded border border-stone-800 text-xs text-stone-500 italic text-center">
                        提示：作为说书人，你是游戏的主持者和裁判。保持公正，但也要确保游戏的趣味性！
                    </div>
                </div>
            </div>
        </div>
    );
};
