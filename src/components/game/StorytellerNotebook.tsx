import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../../store';
import { FloatingNote } from './FloatingNote';

export const StorytellerNotebook: React.FC = () => {
    const notes = useStore(state => state.gameState?.storytellerNotes || []);
    const addNote = useStore(state => state.addStorytellerNote);
    const updateNote = useStore(state => state.updateStorytellerNote);
    const deleteNote = useStore(state => state.deleteStorytellerNote);

    // New Actions
    const toggleNoteFloating = useStore(state => state.toggleNoteFloating);
    const updateNotePosition = useStore(state => state.updateNotePosition);
    const setNoteColor = useStore(state => state.setNoteColor);
    const toggleNoteCollapse = useStore(state => state.toggleNoteCollapse);

    const [newNote, setNewNote] = useState('');

    const handleAdd = () => {
        if (!newNote.trim()) return;
        addNote(newNote);
        setNewNote('');
    };

    const floatingNotes = notes.filter(n => n.isFloating);

    return (
        <>
            <div className="bg-stone-900 p-4 rounded-lg border border-stone-700 h-full flex flex-col shadow-inner">
                <h3 className="text-amber-600 font-cinzel mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                    <span>📓</span> 说书人笔记 (Notebook)
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className={`
                                relative p-3 rounded border transition-all group
                                ${note.type === 'auto' ? 'bg-stone-900/50 border-stone-800' : 'bg-stone-800 border-stone-600'}
                                ${note.isFloating ? 'opacity-50' : 'opacity-100'}
                                ${note.color === 'red' ? 'border-l-4 border-l-red-500' : ''}
                                ${note.color === 'blue' ? 'border-l-4 border-l-blue-500' : ''}
                                ${note.color === 'green' ? 'border-l-4 border-l-green-500' : ''}
                                ${note.color === 'yellow' ? 'border-l-4 border-l-yellow-500' : ''}
                                ${note.color === 'purple' ? 'border-l-4 border-l-purple-500' : ''}
                                hover:border-amber-900/50
                            `}
                        >
                            {/* Header / Controls */}
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${note.type === 'auto' ? 'text-blue-400' : 'text-amber-600'}`}>
                                    {note.type === 'auto' ? 'SYSTEM LOG' : 'NOTE'}
                                    {note.isFloating && ' (FLOATING)'}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleNoteFloating(note.id)}
                                        className={`p-1 rounded hover:bg-stone-700 ${note.isFloating ? 'text-amber-400' : 'text-stone-500'}`}
                                        title={note.isFloating ? "收回笔记" : "悬浮笔记"}
                                    >
                                        {/* Pin */}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="17" x2="12" y2="22" />
                                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => deleteNote(note.id)}
                                        className="p-1 rounded hover:bg-stone-700 text-stone-500 hover:text-red-500"
                                        title="删除"
                                    >
                                        {/* Trash2 */}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            <line x1="10" y1="11" x2="10" y2="17" />
                                            <line x1="14" y1="11" x2="14" y2="17" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <textarea
                                value={note.content}
                                onChange={(e) => updateNote(note.id, e.target.value)}
                                className={`w-full bg-transparent text-sm resize-none focus:outline-none font-mono leading-relaxed ${note.type === 'auto' ? 'text-stone-400' : 'text-stone-300'}`}
                                rows={Math.max(1, Math.min(10, note.content.split('\n').length))}
                                placeholder="写点什么..."
                            // readOnly={note.type === 'auto'} // Allow editing even for auto logs
                            />

                            <div className="text-[10px] text-stone-600 mt-1 text-right flex justify-between items-center">
                                {/* Color Dots (Mini Picker) */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {['gray', 'red', 'yellow', 'green', 'blue', 'purple'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNoteColor(note.id, c)}
                                            className={`w-2 h-2 rounded-full ${c === 'gray' ? 'bg-stone-500' : `bg-${c}-500`} hover:scale-125 transition-transform`}
                                        />
                                    ))}
                                </div>
                                <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && (
                        <div className="text-stone-600 text-center italic text-sm py-8 flex flex-col items-center gap-2">
                            <span className="text-2xl opacity-20">📝</span>
                            <span>暂无笔记...</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder="添加新笔记... (Enter)"
                        className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-900 transition-all"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newNote.trim()}
                        className="bg-amber-900 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-amber-100 px-4 py-2 rounded text-sm transition-colors font-bold shadow-lg"
                    >
                        添加
                    </button>
                </div>
            </div>

            {/* Render Floating Notes via Portal */}
            {createPortal(
                <div className="fixed inset-0 pointer-events-none z-50">
                    {floatingNotes.map(note => (
                        <div key={note.id} className="pointer-events-auto absolute">
                            <FloatingNote
                                note={note}
                                onUpdatePosition={updateNotePosition}
                                onClose={toggleNoteFloating}
                                onColorChange={setNoteColor}
                                onToggleCollapse={toggleNoteCollapse}
                            />
                        </div>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
};




