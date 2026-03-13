import React, { useState } from 'react';
import { Notification } from '@shared/types';

interface Props {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onNavigate?: (link: string) => void;
}

const categoryColors: Record<string, string> = {
  schedule: 'bg-blue-500/20 text-blue-200 border-blue-400/30',
  deadline: 'bg-rose-500/20 text-rose-200 border-rose-400/30',
  opportunity: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30',
  update: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
};

const priorityDot: Record<string, string> = {
  low: 'bg-emerald-400',
  medium: 'bg-amber-400',
  high: 'bg-rose-500',
};

const Notifications: React.FC<Props> = ({ notifications, onMarkRead, onClearAll, onNavigate }) => {
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => (n.category || 'update') === filter);

  const openExternal = (link?: string) => {
    if (!link) return;
    try { window.open(link, '_blank', 'noopener'); } catch { window.location.href = link; }
  };

  const handleView = (link?: string, id?: string) => {
    if (!link) return;
    if (onNavigate) onNavigate(link);
    else openExternal(link);
    if (id) onMarkRead(id);
  };

  return (
    <div className="w-[22rem] glass-panel rounded-xl border border-slate-600 overflow-hidden premium-slide-in">
      <div className="flex justify-between items-center px-4 py-3 border-b border-slate-700">
        <h3 className="font-semibold text-slate-100">Notifications</h3>
        <button onClick={onClearAll} className="text-xs text-rose-300 hover:text-rose-200">Clear All</button>
      </div>

      <div className="flex gap-2 p-2 text-xs overflow-x-auto border-b border-slate-700">
        {['all', 'schedule', 'deadline', 'opportunity', 'update'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-2 py-1 rounded-full border ${filter === type ? 'bg-blue-600 text-white border-blue-400' : 'text-slate-300 border-slate-600 hover:bg-slate-700/40'}`}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-6">No notifications</p>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className={`p-3 border-b border-slate-800/80 hover:bg-slate-800/40 ${!n.read ? 'bg-blue-900/20' : ''}`}>
              <div className="flex justify-between items-start gap-2">
                <div className="flex gap-2 items-center">
                  <span className={`w-2 h-2 rounded-full ${priorityDot[n.priority || 'low']}`} />
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${categoryColors[n.category || 'update']}`}>
                    {n.category || n.type || 'update'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!n.read && <button onClick={() => onMarkRead(n.id)} className="text-xs text-blue-300">Mark read</button>}
                  <button onClick={() => setExpanded((s) => ({ ...s, [n.id]: !s[n.id] }))} className="text-xs text-slate-400">Details</button>
                </div>
              </div>

              <h4 className="font-medium text-sm mt-1 text-slate-100">{n.title}</h4>
              <p className={`text-xs text-slate-300 ${expanded[n.id] ? '' : 'line-clamp-2'}`}>{n.message}</p>

              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-slate-500">{new Date(n.timestamp).toLocaleString()}</span>
                {n.link && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleView(n.link, n.id)} className="text-xs text-blue-300">View</button>
                    {n.type === 'job' && (
                      <button onClick={() => openExternal(n.link)} className="text-xs px-2 py-1 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        Apply
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;

