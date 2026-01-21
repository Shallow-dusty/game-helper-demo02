import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { generateShortId } from '../../lib/random';
import { BookOpen, Plus } from 'lucide-react';
import { Icon } from '../ui/Icon';

interface Note {
    id: string;
    content: string;
    timestamp: number;
}

export const PlayerNotebook: React.FC = () => {
    const { t } = useTranslation();
    const [notes, setNotes] = useState<Note[]>([]);
    const [newNote, setNewNote] = useState('');

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('player_notes');
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse notes", e);
            }
        }
    }, []);

    // Save to localStorage whenever notes change
    useEffect(() => {
        localStorage.setItem('player_notes', JSON.stringify(notes));
    }, [notes]);

    const addNote = () => {
        if (!newNote.trim()) return;
        const note: Note = {
            id: generateShortId(),
            content: newNote,
            timestamp: Date.now()
        };
        setNotes(prev => [note, ...prev]);
        setNewNote('');
    };

    const deleteNote = (id: string) => {
        setNotes(prev => prev.filter(n => n.id !== id));
    };

    const updateNote = (id: string, content: string) => {
        setNotes(prev => prev.map(n => n.id === id ? { ...n, content } : n));
    };

    return (
        <div className="bg-stone-900 p-4 rounded-lg border border-stone-700 h-full flex flex-col shadow-inner">
            <h3 className="text-amber-600 font-cinzel mb-4 flex items-center gap-2 border-b border-stone-800 pb-2">
                <BookOpen className="w-5 h-5" /> {t('player.notebook.title')}
            </h3>

            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 scrollbar-thin scrollbar-thumb-stone-700 scrollbar-track-transparent">
                {notes.map(note => (
                    <div key={note.id} className="bg-stone-800 p-3 rounded border border-stone-600 group relative hover:border-amber-900/50 transition-colors">
                        <textarea
                            value={note.content}
                            onChange={(e) => updateNote(note.id, e.target.value)}
                            className="w-full bg-transparent text-stone-300 text-sm resize-none focus:outline-none font-mono leading-relaxed"
                            rows={Math.max(2, note.content.split('\n').length)}
                            placeholder={t('player.notebook.placeholder')}
                        />
                        <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                                onClick={() => deleteNote(note.id)}
                                className="text-stone-500 hover:text-red-500 p-1 rounded hover:bg-stone-700 transition-colors cursor-pointer"
                                title={t('player.notebook.deleteNote')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <div className="text-[10px] text-stone-600 mt-1 text-right">
                            {new Date(note.timestamp).toLocaleTimeString()}
                        </div>
                    </div>
                ))}
                {notes.length === 0 && (
                    <div className="text-stone-600 text-center italic text-sm py-8 flex flex-col items-center gap-2">
                        <Icon icon="FileText" size="xl" variant="muted" className="opacity-20" />
                        <span>{t('player.notebook.emptyState')}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addNote()}
                    placeholder={t('player.notebook.addPlaceholder')}
                    className="flex-1 bg-stone-950 border border-stone-700 rounded px-3 py-2 text-sm text-stone-300 focus:border-amber-600 focus:outline-none focus:ring-1 focus:ring-amber-900 transition-all"
                />
                <button
                    onClick={addNote}
                    disabled={!newNote.trim()}
                    className="bg-amber-900 hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed text-amber-100 px-4 py-2 rounded text-sm transition-colors font-bold shadow-lg cursor-pointer flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    {t('player.notebook.addButton')}
                </button>
            </div>
        </div>
    );
};




