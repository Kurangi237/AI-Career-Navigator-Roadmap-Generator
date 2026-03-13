import React from 'react';

interface Props {
  mode: 'loading' | 'empty' | 'error';
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

const StatePanel: React.FC<Props> = ({ mode, title, message, actionLabel, onAction }) => {
  const tone =
    mode === 'error'
      ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
      : mode === 'loading'
      ? 'border-blue-400/40 bg-blue-500/10 text-blue-100'
      : 'border-slate-500/40 bg-slate-500/10 text-slate-100';

  return (
    <div className={`rounded-xl border p-4 ${tone}`}>
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs mt-1 opacity-90">{message}</p>
      {actionLabel && onAction ? (
        <button
          onClick={onAction}
          className="mt-3 px-3 py-1.5 rounded border border-current/50 text-xs hover:bg-white/10"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
};

export default StatePanel;
