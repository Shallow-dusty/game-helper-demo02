import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { useStore } from '../../store';
import { FloatingNote } from './FloatingNote';

export const StorytellerNotebook: React.FC = () => {
    const { t } = useTranslation();
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
            <div 
                className="p-4 rounded-lg border border-[#8b4513] h-full flex flex-col shadow-[inset_0_0_30px_rgba(60,40,20,0.2)] relative overflow-hidden"
                style={{
                    background: `
                        linear-gradient(to bottom right, rgba(244, 228, 188, 0.9), rgba(230, 210, 160, 0.9)),
                        url("https://www.transparenttextures.com/patterns/aged-paper.png")
                    `,
                    backgroundColor: '#f4e4bc'
                }}
            >
                {/* Decorative Corner */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#8b4513]/20 to-transparent pointer-events-none" />

                <h3 className="text-[#4a3728] font-cinzel font-bold mb-4 flex items-center gap-2 border-b-2 border-[#8b4513]/30 pb-2 drop-shadow-sm">
                    <span className="text-2xl">📓</span> {t('game.storytellerNotebook.title')}
                </h3>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin scrollbar-thumb-[#8b4513]/50 scrollbar-track-transparent">
                    {notes.map(note => (
                        <div
                            key={note.id}
                            className={`
                                relative p-3 rounded-sm border transition-all group shadow-sm
                                ${note.type === 'auto' ? 'bg-[#e6d2a0]/40 border-[#8b4513]/20' : 'bg-[#fff9e6]/80 border-[#8b4513]/40'}
                                ${note.isFloating ? 'opacity-60 grayscale-[0.5]' : 'opacity-100'}
                                ${note.color === 'red' ? 'border-l-4 border-l-[#b91c1c]' : ''}
                                ${note.color === 'blue' ? 'border-l-4 border-l-[#1d4ed8]' : ''}
                                ${note.color === 'green' ? 'border-l-4 border-l-[#15803d]' : ''}
                                ${note.color === 'yellow' ? 'border-l-4 border-l-[#b45309]' : ''}
                                ${note.color === 'purple' ? 'border-l-4 border-l-[#7e22ce]' : ''}
                                hover:border-[#8b4513] hover:shadow-md hover:-translate-y-0.5
                            `}
                        >
                            {/* Header / Controls */}
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${note.type === 'auto' ? 'text-[#1d4ed8]' : 'text-[#8b4513]'}`}>
                                    {note.type === 'auto' ? t('game.storytellerNotebook.systemLog') : t('game.storytellerNotebook.note')}
                                    {note.isFloating && ` (${t('game.storytellerNotebook.floating')})`}
                                </span>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleNoteFloating(note.id)}
                                        className={`p-1 rounded hover:bg-[#8b4513]/10 ${note.isFloating ? 'text-[#b45309]' : 'text-[#654321]'}`}
                                        title={note.isFloating ? t('game.storytellerNotebook.unpinNote') : t('game.storytellerNotebook.pinNote')}
                                    >
                                        {/* Pin */}
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="12" y1="17" x2="12" y2="22" />
                                            <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => deleteNote(note.id)}
                                        className="p-1 rounded hover:bg-[#b91c1c]/10 text-[#654321] hover:text-[#b91c1c]"
                                        title={t('common.delete')}
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
                                className={`w-full bg-transparent text-sm resize-none focus:outline-none font-serif leading-relaxed ${note.type === 'auto' ? 'text-[#4a3728]/70 italic' : 'text-[#2c241b]'}`}
                                rows={Math.max(1, Math.min(10, note.content.split('\n').length))}
                                placeholder={t('game.storytellerNotebook.placeholder')}
                                style={{ fontFamily: '"Crimson Text", serif' }}
                            />

                            <div className="text-[10px] text-[#8b4513]/70 mt-1 text-right flex justify-between items-center border-t border-[#8b4513]/10 pt-1">
                                {/* Color Dots (Mini Picker) */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {['gray', 'red', 'yellow', 'green', 'blue', 'purple'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNoteColor(note.id, c)}
                                            className={`w-2 h-2 rounded-full ${c === 'gray' ? 'bg-stone-500' : `bg-${c}-500`} hover:scale-125 transition-transform border border-white/50 shadow-sm`}
                                        />
                                    ))}
                                </div>
                                <span>{new Date(note.timestamp).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && (
                        <div className="text-[#8b4513]/40 text-center italic text-sm py-8 flex flex-col items-center gap-2">
                            <span className="text-3xl opacity-30">✒️</span>
                            <span>{t('game.storytellerNotebook.noNotes')}</span>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 relative z-10">
                    <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        placeholder={t('game.storytellerNotebook.addNotePlaceholder')}
                        className="flex-1 bg-[#fff9e6]/80 border border-[#8b4513]/30 rounded px-3 py-2 text-sm text-[#4a3728] focus:border-[#8b4513] focus:outline-none focus:ring-1 focus:ring-[#8b4513]/50 transition-all placeholder-[#8b4513]/40 font-serif"
                    />
                    <button
                        onClick={handleAdd}
                        disabled={!newNote.trim()}
                        className="bg-[#8b4513] hover:bg-[#654321] disabled:opacity-50 disabled:cursor-not-allowed text-[#f4e4bc] px-4 py-2 rounded text-sm transition-colors font-bold shadow-md border border-[#4a3728]"
                    >
                        {t('game.storytellerNotebook.add')}
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




