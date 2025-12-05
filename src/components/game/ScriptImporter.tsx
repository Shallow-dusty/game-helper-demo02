import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Upload, FileJson, Check, AlertTriangle } from 'lucide-react';

interface ScriptImporterProps {
  onImport: (script: any) => void;
  onCancel: () => void;
}

export const ScriptImporter: React.FC<ScriptImporterProps> = ({ onImport, onCancel }) => {
  const [jsonContent, setJsonContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);

  const handleParse = () => {
    try {
      const data = JSON.parse(jsonContent);
      
      // Basic Validation
      if (!Array.isArray(data) && !data.id) {
         throw new Error("Invalid script format. Expected an array of roles or a script object.");
      }
      
      const roles = Array.isArray(data) ? data : data.roles || [];
      const meta = Array.isArray(data) ? data.find((i: any) => i.id === '_meta') : data.meta;

      setPreview({
        name: meta?.name || data.name || "Custom Script",
        author: meta?.author || data.author || "Unknown",
        roleCount: roles.length
      });
      setError(null);
    } catch (e) {
      setError((e as Error).message);
      setPreview(null);
    }
  };

  const handleImport = () => {
    if (preview) {
      try {
        const data = JSON.parse(jsonContent);
        onImport(data);
      } catch (e) {
        setError("Import failed.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-stone-900 border border-stone-700 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-800 flex items-center gap-2">
          <FileJson className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-cinzel font-bold text-stone-200">Import Custom Script</h2>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-4">
          <div className="text-sm text-stone-400">
            Paste your script JSON below. Supports official Blood on the Clocktower script format.
          </div>
          
          <textarea
            className="w-full h-64 bg-black/50 border border-stone-700 rounded p-3 text-xs font-mono text-stone-300 focus:border-amber-500 focus:outline-none resize-none"
            placeholder='[{"id": "_meta", "name": "My Script"}, {"id": "demon_1"}, ...]'
            value={jsonContent}
            onChange={(e) => setJsonContent(e.target.value)}
          />

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-900/50">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}

          {preview && (
            <div className="flex items-center gap-4 bg-green-900/20 p-3 rounded border border-green-900/50">
              <Check className="w-5 h-5 text-green-400" />
              <div>
                <div className="text-green-200 font-bold">{preview.name}</div>
                <div className="text-xs text-green-400/70">by {preview.author} • {preview.roleCount} roles</div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel} className="text-stone-400 hover:text-stone-200">
            Cancel
          </Button>
          {!preview ? (
            <Button onClick={handleParse} disabled={!jsonContent} className="bg-stone-700 hover:bg-stone-600">
              Parse JSON
            </Button>
          ) : (
            <Button onClick={handleImport} className="bg-amber-600 hover:bg-amber-500 text-white">
              <Upload className="w-4 h-4 mr-2" />
              Import Script
            </Button>
          )}
        </div>

      </div>
    </div>
  );
};
