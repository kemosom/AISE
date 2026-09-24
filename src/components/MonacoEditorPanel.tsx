import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode,
  Plus,
  Trash2,
  BookmarkPlus,
  Check,
  RotateCcw,
} from 'lucide-react';

export interface EditorFile {
  name: string;
  language: string;
  content: string;
}

interface MonacoEditorPanelProps {
  files: EditorFile[];
  activeFileIndex: number;
  onSelectFile: (index: number) => void;
  onChangeContent: (newContent: string) => void;
  onAddFile: (fileName: string) => void;
  onDeleteFile: (index: number) => void;
  saveStatus: 'Saved' | 'Saving...' | 'Save failed';
  onAddCodeToReport: (codeSnapshot: { title: string; code: string; language: string }) => void;
}

export const MonacoEditorPanel: React.FC<MonacoEditorPanelProps> = ({
  files,
  activeFileIndex,
  onSelectFile,
  onChangeContent,
  onAddFile,
  onDeleteFile,
  saveStatus,
  onAddCodeToReport,
}) => {
  const [isAddingFile, setIsAddingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);

  const activeFile = files[activeFileIndex] || files[0] || {
    name: 'main.py',
    language: 'python',
    content: '',
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    onAddFile(newFileName.trim());
    setNewFileName('');
    setIsAddingFile(false);
  };

  const handleAttachToReport = () => {
    onAddCodeToReport({
      title: activeFile.name,
      code: activeFile.content,
      language: activeFile.language,
    });
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 border-r border-slate-700">
      {/* Tab Header */}
      <div className="bg-slate-950 border-b border-slate-800 flex items-center justify-between px-2 h-9">
        <div className="flex items-center space-x-1 overflow-x-auto">
          {files.map((file, idx) => (
            <div
              key={file.name}
              className={`flex items-center space-x-1 px-3 py-1 text-xs font-mono rounded-t cursor-pointer transition-colors ${
                activeFileIndex === idx
                  ? 'bg-slate-900 text-slate-100 font-semibold border-t-2 border-blue-500'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
              onClick={() => onSelectFile(idx)}
            >
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>{file.name}</span>
              {files.length > 1 && idx !== 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(idx);
                  }}
                  className="hover:text-red-400 ml-1 p-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}

          {/* New File Button */}
          {isAddingFile ? (
            <form onSubmit={handleCreateFile} className="flex items-center space-x-1">
              <input
                type="text"
                autoFocus
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.py"
                className="px-2 py-0.5 text-xs font-mono bg-slate-800 text-slate-100 border border-slate-700 rounded outline-none w-28"
              />
              <button
                type="submit"
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold px-1"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setIsAddingFile(false)}
                className="text-xs text-slate-400 hover:text-slate-300 px-1"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingFile(true)}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Add File"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Save Status & Report Attachment */}
        <div className="flex items-center space-x-3 text-xs pr-2">
          <span
            className={`text-[11px] font-mono ${
              saveStatus === 'Saving...'
                ? 'text-amber-400'
                : saveStatus === 'Save failed'
                ? 'text-red-400'
                : 'text-slate-400'
            }`}
          >
            {saveStatus}
          </span>

          <button
            onClick={handleAttachToReport}
            className="inline-flex items-center space-x-1 text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
            title="Attach this file as code evidence in your report"
          >
            {codeCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Added to Report</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>Add Code to Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Monaco Editor Container */}
      <div className="flex-1 w-full overflow-hidden">
        <Editor
          height="100%"
          language={activeFile.language || 'python'}
          theme="vs-dark"
          value={activeFile.content}
          onChange={(val) => onChangeContent(val || '')}
          options={{
            fontSize: 13,
            lineNumbers: 'on',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            fontFamily: 'JetBrains Mono, Consolas, Courier New, monospace',
          }}
        />
      </div>
    </div>
  );
};
