import React, { useState } from 'react';
import { Notification } from '../types';

interface Props {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onClearAll: () => void;
  onNavigate?: (link: string) => void;
}

const categoryColors: Record<string, string> = {
  schedule: 'bg-blue-100 text-blue-700',
  deadline: 'bg-red-100 text-red-700',
  opportunity: 'bg-green-100 text-green-700',
  update: 'bg-gray-100 text-gray-700',
};

const priorityDot: Record<string, string> = {
  low: 'bg-green-400',
  medium: 'bg-yellow-400',
  high: 'bg-red-500',
};

const Notifications: React.FC<Props> = ({ notifications, onMarkRead, onClearAll, onNavigate }) => {
  const [filter, setFilter] = useState<string>('all');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => (n.category || 'update') === filter);

  const openExternal = (link?: string) => {
    if (!link) return;
    try { window.open(link, '_blank', 'noopener'); } catch (e) { window.location.href = link; }
  };

  const handleView = (link?: string, id?: string) => {
    if (!link) return;
    if (onNavigate) {
      onNavigate(link);
    } else {
      openExternal(link);
    }
    if (id) onMarkRead(id);
  };

  const handleApply = (link?: string, id?: string) => {
    openExternal(link);
    if (id) onMarkRead(id);
  };

  return (
    <div className="w-96 bg-white shadow-lg rounded-xl border">
      <div className="flex justify-between items-center px-4 py-2 border-b">
        <h3 className="font-semibold text-gray-700">Notifications</h3>
        <button onClick={onClearAll} className="text-xs text-red-500 hover:underline">Clear All</button>
      </div>

      <div className="flex gap-2 p-2 text-xs overflow-x-auto">
        {['all', 'schedule', 'deadline', 'opportunity', 'update'].map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-2 py-1 rounded-full border ${filter === type ? 'bg-indigo-500 text-white' : 'text-gray-600'}`}>
            {type}
          </button>
        ))}
      </div>

      <div className="max-h-96 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-6">No notifications</p>
        ) : (
          filtered.map((n) => (
            <div key={n.id} className={`p-3 border-b hover:bg-gray-50 ${!n.read ? 'bg-indigo-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div className="flex gap-2 items-center">
                  <span className={`w-2 h-2 rounded-full ${priorityDot[n.priority || 'low']}`} />
                  <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[n.category || 'update']}`}>{n.category || n.type || 'update'}</span>
                </div>

                <div className="flex items-center gap-2">
                  {!n.read && <button onClick={(e) => { e.stopPropagation(); onMarkRead(n.id); }} className="text-xs text-indigo-600 hover:underline">Mark read</button>}
                  <button onClick={(e) => { e.stopPropagation(); setExpanded(s => ({ ...s, [n.id]: !s[n.id] })); }} className="text-xs text-gray-500 hover:underline">Details</button>
                </div>
              </div>

              <h4 className="font-medium text-sm mt-1">{n.title}</h4>
              {expanded[n.id] ? <p className="text-xs text-gray-600">{n.message}</p> : <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>}

              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-gray-400">{new Date(n.timestamp).toLocaleString()}</span>
                {n.link && (
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); handleView(n.link, n.id); }} className="text-xs text-indigo-600 hover:underline">View</button>
                    {n.type === 'job' && <button onClick={(e) => { e.stopPropagation(); handleApply(n.link, n.id); }} className="ml-2 px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100">Apply</button>}
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
