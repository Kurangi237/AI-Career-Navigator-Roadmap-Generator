import React, { useMemo, useState } from 'react';
import { getTrackedEvents } from '../../services/analyticsService';

interface Props {
  onBack: () => void;
}

const AnalyticsDashboard: React.FC<Props> = ({ onBack }) => {
  const [refreshKey, setRefreshKey] = useState(0);
  const events = useMemo(() => getTrackedEvents(), [refreshKey]);

  const byName = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach((e) => {
      map[e.name] = (map[e.name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [events]);

  return (
    <div className="space-y-4 premium-page">
      <div className="glass-panel rounded-xl border border-slate-700 p-5 premium-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-500">Analytics</h2>
            <p className="text-sm text-slate-300">Event funnel snapshot for core product actions.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setRefreshKey((x) => x + 1)} className="px-3 py-2 rounded border border-slate-600 text-slate-100 text-sm hover:bg-slate-700/40">Refresh</button>
            <button onClick={onBack} className="px-3 py-2 rounded border border-slate-600 text-slate-100 text-sm hover:bg-slate-700/40">Back</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-panel rounded-xl border border-slate-700 p-4 premium-card">
          <p className="text-xs text-slate-400">Total Events</p>
          <p className="text-2xl font-bold text-white">{events.length}</p>
        </div>
        <div className="glass-panel rounded-xl border border-slate-700 p-4 premium-card">
          <p className="text-xs text-slate-400">Unique Event Types</p>
          <p className="text-2xl font-bold text-white">{byName.length}</p>
        </div>
        <div className="glass-panel rounded-xl border border-slate-700 p-4 premium-card">
          <p className="text-xs text-slate-400">Last Event</p>
          <p className="text-sm font-semibold text-white">
            {events[events.length - 1] ? new Date(events[events.length - 1].at).toLocaleString() : 'No events yet'}
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-xl border border-slate-700 p-4 premium-card">
        <p className="text-sm font-semibold text-white mb-3">Top Events</p>
        {byName.length === 0 ? (
          <p className="text-xs text-slate-400">No analytics events recorded yet.</p>
        ) : (
          <div className="space-y-2">
            {byName.slice(0, 12).map(([name, count]) => (
              <div key={name} className="flex items-center justify-between text-sm">
                <span className="text-slate-200">{name}</span>
                <span className="text-cyan-300 font-semibold">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
