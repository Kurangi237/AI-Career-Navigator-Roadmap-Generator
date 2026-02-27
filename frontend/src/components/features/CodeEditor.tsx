import React, { useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import type { CodingProblem, JudgeResponse } from '@shared/types';

interface CodeEditorProps {
  language: 'javascript' | 'python' | 'java' | 'c' | 'cpp';
  problem?: CodingProblem;
  onSubmit: (code: string) => Promise<JudgeResponse>;
  onRun?: (code: string) => Promise<JudgeResponse>;
  onLanguageChange: (lang: string) => void;
  theme?: 'light' | 'dark';
}

const defaultTemplate = (lang: string, problem?: CodingProblem) => {
  const functionName = problem?.functionName || 'solve';
  const title = problem?.title || 'Untitled Problem';
  return (
    {
      javascript: `// ${title}\nfunction ${functionName}(input) {\n  // TODO\n  return input;\n}\n`,
      python: `# ${title}\ndef ${functionName}(input):\n    # TODO\n    return input\n`,
      java: `// ${title}\nclass Solution {\n  public Object ${functionName}(Object input) {\n    // TODO\n    return input;\n  }\n}\n`,
      c: `/* ${title} */\nint ${functionName}(int input) {\n  // TODO\n  return input;\n}\n`,
      cpp: `// ${title}\nint ${functionName}(int input) {\n  // TODO\n  return input;\n}\n`,
    }[lang] || ''
  );
};

const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  problem,
  onSubmit,
  onRun,
  onLanguageChange,
  theme = 'dark',
}) => {
  const [code, setCode] = useState('');
  const [fontSize, setFontSize] = useState(14);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const editorRef = useRef<any>(null);

  const storageKey = useMemo(
    () => `mncdsaprep:autosave:${problem?.id || 'draft'}:${language}`,
    [problem?.id, language]
  );

  const starterCode = useMemo(() => {
    const starter = ((problem as any)?.starter_code ??
      (problem as any)?.starterCode ??
      {}) as Record<string, string>;
    return starter[language] || defaultTemplate(language, problem);
  }, [language, problem]);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    setCode(saved || starterCode);
  }, [storageKey, starterCode]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      localStorage.setItem(storageKey, code);
    }, 250);
    return () => clearTimeout(id);
  }, [code, storageKey]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!e.ctrlKey || e.key !== 'Enter') return;
      e.preventDefault();
      void handleRun();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [code]);

  const execute = async (fn: (code: string) => Promise<JudgeResponse>) => {
    try {
      setBusy(true);
      setError('');
      await fn(code);
    } catch (e: any) {
      setError(e?.message || 'Execution failed');
    } finally {
      setBusy(false);
    }
  };

  const handleRun = async () => execute(onRun || onSubmit);
  const handleSubmit = async () => execute(onSubmit);

  return (
    <div className="h-full flex flex-col bg-[#111827] text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-slate-700 bg-[#0b1220]">
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="px-2 py-1 rounded text-xs border border-slate-500 bg-slate-100 text-slate-900"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="c">C</option>
            <option value="cpp">C++</option>
          </select>
          <button
            onClick={() => setCode(starterCode)}
            className="px-2 py-1 text-xs rounded border border-slate-500 hover:bg-slate-700"
          >
            Reset
          </button>
          <button
            onClick={() => navigator.clipboard.writeText(code)}
            className="px-2 py-1 text-xs rounded border border-slate-500 hover:bg-slate-700"
          >
            Copy
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-300">Font</label>
          <input
            type="range"
            min={12}
            max={20}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
          <button
            onClick={handleRun}
            disabled={busy}
            className="px-3 py-1.5 text-xs rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-60"
          >
            Run
          </button>
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="px-3 py-1.5 text-xs rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-60"
          >
            Submit
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          theme={theme === 'light' ? 'vs' : 'vs-dark'}
          onChange={(value) => setCode(value || '')}
          onMount={(editor) => {
            editorRef.current = editor;
            editor.updateOptions({
              fontSize,
              minimap: { enabled: true },
              fontLigatures: true,
              smoothScrolling: true,
              scrollBeyondLastLine: false,
            });
          }}
          options={{
            fontSize,
            tabSize: 2,
            wordWrap: 'on',
            automaticLayout: true,
            formatOnPaste: true,
            suggestOnTriggerCharacters: true,
          }}
        />
      </div>

      {error && (
        <div className="px-3 py-2 text-xs text-red-200 bg-red-900/60 border-t border-red-800">
          {error}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
