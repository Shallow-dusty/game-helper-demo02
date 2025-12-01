import React, { useState } from 'react';
import { SCRIPTS, ROLES } from '../../constants';
import { useStore } from '../../store';
import { showError, showSuccess } from '../ui/Toast';

interface ScriptManagerProps {
    onClose: () => void;
}

export const ScriptManager: React.FC<ScriptManagerProps> = ({ onClose }) => {
    const gameState = useStore(state => state.gameState);
    const importScript = useStore(state => state.importScript);
    const [jsonInput, setJsonInput] = useState('');
    const [activeTab, setActiveTab] = useState<'view' | 'import'>('view');

    if (!gameState) return null;

    const currentScriptId = gameState.currentScriptId;
    const currentScript = SCRIPTS[currentScriptId] || gameState.customScripts?.[currentScriptId];

    const handleImport = () => {
        try {
            if (!jsonInput.trim()) {
                showError('请输入JSON内容');
                return;
            }
            importScript(jsonInput);
            showSuccess('剧本导入成功！');
            setJsonInput('');
            onClose();
        } catch (e) {
            showError('导入失败，请检查JSON格式');
            console.error(e);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const content = ev.target?.result as string;
                if (content) {
                    setJsonInput(content);
                }
            };
            reader.readAsText(file);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-stone-950 rounded-t-lg">
                    <h2 className="text-xl font-bold text-amber-500 font-cinzel">剧本管理 (Script Manager)</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-white transition-colors text-2xl leading-none">&times;</button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-stone-700 bg-stone-900">
                    <button
                        onClick={() => setActiveTab('view')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'view' ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'}`}
                    >
                        当前剧本
                    </button>
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'import' ? 'bg-stone-800 text-amber-500 border-b-2 border-amber-500' : 'text-stone-500 hover:text-stone-300'}`}
                    >
                        导入剧本
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                    {activeTab === 'view' && (
                        <div className="space-y-4">
                            {currentScript ? (
                                <>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="text-lg font-bold text-stone-200">{currentScript.name}</h3>
                                            <p className="text-xs text-stone-500 mt-1">ID: {currentScript.id}</p>
                                        </div>
                                        {/* Export Button */}
                                        <button
                                            onClick={() => {
                                                const json = JSON.stringify(currentScript, null, 2);
                                                const blob = new Blob([json], { type: 'application/json' });
                                                const url = URL.createObjectURL(blob);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = `${currentScript.name}.json`;
                                                a.click();
                                                URL.revokeObjectURL(url);
                                            }}
                                            className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs rounded border border-stone-600"
                                        >
                                            导出 JSON
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
                                        {currentScript.roles.map(rid => {
                                            const role = ROLES[rid];
                                            if (!role) return null;
                                            return (
                                                <div key={rid} className="flex items-center gap-2 p-2 bg-stone-950/50 rounded border border-stone-800">
                                                    <span className="text-lg">{role.icon || '❓'}</span>
                                                    <div className="overflow-hidden">
                                                        <div className="text-xs font-bold text-stone-300 truncate">{role.name}</div>
                                                        <div className="text-[10px] text-stone-500 truncate">{role.team}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-stone-500 py-10">
                                    未找到当前剧本信息
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'import' && (
                        <div className="space-y-4">
                            <div className="p-4 bg-amber-900/10 border border-amber-900/30 rounded text-sm text-amber-200/80">
                                <p className="font-bold mb-1">说明：</p>
                                <p>支持导入官方 JSON 格式的剧本文件。你可以从官方脚本工具导出，或者手动编写。</p>
                                <p className="mt-2 text-xs opacity-70">格式示例: {`[{"id": "role_id"}, {"id": "_meta", "name": "Script Name"}]`}</p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-stone-400">从文件上传</label>
                                <input
                                    type="file"
                                    accept=".json"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-stone-400
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-xs file:font-semibold
                      file:bg-stone-800 file:text-stone-300
                      hover:file:bg-stone-700
                    "
                                />
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-stone-700"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-stone-900 px-2 text-stone-500">OR</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-stone-400">粘贴 JSON 内容</label>
                                <textarea
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    placeholder='[{"id": "..."}]'
                                    className="w-full h-40 bg-stone-950 border border-stone-700 rounded p-3 text-xs font-mono text-stone-300 focus:border-amber-600 focus:outline-none resize-none"
                                />
                            </div>

                            <button
                                onClick={handleImport}
                                disabled={!jsonInput.trim()}
                                className="w-full py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-stone-800 disabled:text-stone-600 text-white font-bold rounded transition-colors"
                            >
                                确认导入
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};



