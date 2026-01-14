import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from '../../store';
import { ROLES } from '../../constants';
import { RoleDef, ScriptDefinition } from '../../types';

interface ScriptEditorProps {
    onClose: () => void;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({ onClose }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [filterTeam, setFilterTeam] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    const saveCustomScript = useStore(state => state.saveCustomScript);
    const importScript = useStore(state => state.importScript);

    const handleSave = () => {
        if (!name.trim()) {
            alert(t('script.editor.pleaseEnterName'));
            return;
        }
        if (selectedRoles.length === 0) {
            alert(t('script.editor.pleaseSelectRole'));
            return;
        }

        const script: ScriptDefinition = {
            id: `custom_${Date.now()}`,
            name,
            author,
            description,
            roles: selectedRoles,
            isCustom: true
        };

        saveCustomScript(script);
        onClose();
    };

    const handleExport = () => {
        const script = {
            id: `custom_${Date.now()}`,
            name: name || 'Custom Script',
            author,
            description,
            roles: selectedRoles,
            _meta: {
                name: name || 'Custom Script',
                author,
                description
            }
        };

        // Create a downloadable JSON file
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify([script._meta, ...selectedRoles.map(id => ROLES[id]).filter(r => !!r)], null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `${name || 'script'}.json`);
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                importScript(event.target.result as string);
                onClose();
            }
        };
        reader.readAsText(file);
    };

    const toggleRole = (roleId: string) => {
        if (selectedRoles.includes(roleId)) {
            setSelectedRoles(selectedRoles.filter(id => id !== roleId));
        } else {
            setSelectedRoles([...selectedRoles, roleId]);
        }
    };

    const allRoles = Object.values(ROLES).filter((r): r is RoleDef => !!r && r.id !== 'unknown');
    const filteredRoles = allRoles.filter(r => {
        if (filterTeam !== 'ALL' && r.team !== filterTeam) return false;
        if (searchTerm && !r.name.includes(searchTerm)) return false;
        return true;
    });

    const selectedRolesList = selectedRoles.map(id => ROLES[id]).filter((r): r is RoleDef => !!r);

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 font-serif">
            <div className="bg-stone-900 border border-stone-700 w-full max-w-6xl h-[90vh] flex flex-col rounded-lg shadow-2xl overflow-hidden">

                {/* Header */}
                <div className="p-4 border-b border-stone-800 bg-stone-950 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-amber-500 font-cinzel">{t('script.editor.customEditor')}</h2>
                    <button onClick={onClose} className="text-stone-400 hover:text-white">✕</button>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">

                    {/* Left Panel: Role Selection */}
                    <div className="w-1/2 border-r border-stone-800 flex flex-col bg-stone-900/50">
                        <div className="p-4 border-b border-stone-800 space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder={t('script.editor.searchRoles')}
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:border-amber-600 outline-none"
                                />
                                <select
                                    value={filterTeam}
                                    onChange={e => setFilterTeam(e.target.value)}
                                    className="bg-stone-950 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:border-amber-600 outline-none"
                                >
                                    <option value="ALL">{t('script.editor.allTeams')}</option>
                                    <option value="TOWNSFOLK">{t('script.editor.townsfolk')}</option>
                                    <option value="OUTSIDER">{t('script.editor.outsider')}</option>
                                    <option value="MINION">{t('script.editor.minion')}</option>
                                    <option value="DEMON">{t('script.editor.demon')}</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2 content-start">
                            {filteredRoles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => toggleRole(role.id)}
                                    className={`p-2 rounded border text-left flex items-center gap-2 transition-all ${selectedRoles.includes(role.id)
                                        ? 'bg-amber-900/40 border-amber-600 text-amber-100'
                                        : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-600 hover:text-stone-200'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${role.team === 'TOWNSFOLK' ? 'bg-blue-500' :
                                        role.team === 'OUTSIDER' ? 'bg-blue-300' :
                                            role.team === 'MINION' ? 'bg-red-400' :
                                                'bg-red-600'
                                        }`} />
                                    <span className="truncate text-sm">{role.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Right Panel: Script Details & Preview */}
                    <div className="w-1/2 flex flex-col bg-stone-950">
                        <div className="p-6 space-y-4 border-b border-stone-800">
                            <div>
                                <label className="block text-xs text-stone-500 mb-1">{t('script.editor.scriptName')}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:border-amber-600 outline-none font-bold text-lg"
                                    placeholder={t('script.editor.enterName')}
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs text-stone-500 mb-1">{t('script.editor.author')}</label>
                                    <input
                                        type="text"
                                        value={author}
                                        onChange={e => setAuthor(e.target.value)}
                                        className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:border-amber-600 outline-none"
                                        placeholder={t('script.editor.yourName')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-stone-500 mb-1">{t('script.editor.description')}</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    className="w-full bg-stone-900 border border-stone-700 rounded px-3 py-2 text-stone-200 focus:border-amber-600 outline-none h-20 resize-none"
                                    placeholder={t('script.editor.descriptionPlaceholder')}
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <h3 className="text-stone-400 text-sm font-bold mb-4 uppercase tracking-wider">
                                {t('script.editor.selectedRoles')} ({selectedRoles.length})
                            </h3>

                            <div className="space-y-6">
                                {['TOWNSFOLK', 'OUTSIDER', 'MINION', 'DEMON'].map(team => {
                                    const teamRoles = selectedRolesList.filter(r => r.team === team);
                                    if (teamRoles.length === 0) return null;

                                    return (
                                        <div key={team}>
                                            <h4 className={`text-xs font-bold mb-2 uppercase tracking-widest ${team === 'TOWNSFOLK' ? 'text-blue-500' :
                                                team === 'OUTSIDER' ? 'text-blue-300' :
                                                    team === 'MINION' ? 'text-red-400' :
                                                        'text-red-600'
                                                }`}>
                                                {team === 'TOWNSFOLK' ? t('script.editor.townsfolk') :
                                                    team === 'OUTSIDER' ? t('script.editor.outsider') :
                                                        team === 'MINION' ? t('script.editor.minion') : t('script.editor.demon')}
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {teamRoles.map(role => (
                                                    <span
                                                        key={role.id}
                                                        onClick={() => toggleRole(role.id)}
                                                        className="px-3 py-1 bg-stone-900 border border-stone-800 rounded text-sm text-stone-300 cursor-pointer hover:border-red-900 hover:text-red-400 group flex items-center gap-2"
                                                    >
                                                        {role.name}
                                                        <span className="hidden group-hover:inline text-[10px]">✕</span>
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-stone-800 bg-stone-900 flex justify-between items-center">
                            <div className="flex gap-2">
                                <label className="cursor-pointer px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition-colors text-sm">
                                    {t('script.editor.importJson')}
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                                <button
                                    onClick={handleExport}
                                    disabled={selectedRoles.length === 0}
                                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded transition-colors text-sm disabled:opacity-50"
                                >
                                    {t('script.editor.exportJson')}
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 border border-stone-700 hover:border-stone-500 text-stone-400 hover:text-stone-200 rounded transition-colors"
                                >
                                    {t('script.editor.cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-6 py-2 bg-amber-700 hover:bg-amber-600 text-white font-bold rounded shadow-lg shadow-amber-900/20 transition-all hover:scale-105"
                                >
                                    {t('script.editor.saveScript')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};



