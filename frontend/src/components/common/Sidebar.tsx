import React, { useState, useRef, useEffect } from 'react';
import { ViewState, UserProfile, Notification } from '@shared/types';
import Notifications from './Notifications';
import { getSavedCourses, getSavedJobs, getSavedResumeScans, getSavedRoadmaps } from '../../services/storageService';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: UserProfile | null;
  allowedViews?: ViewState[];
  notifications?: Notification[];
  onMarkRead?: (id: string) => void;
  onClearAll?: () => void;
  onOpenJobLink?: (link: string) => void;
}

const Navigation: React.FC<SidebarProps> = ({
  currentView,
  setView,
  user,
  allowedViews = [],
  notifications = [],
  onMarkRead,
  onClearAll,
  onOpenJobLink,
}) => {
  const [showNotif, setShowNotif] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);
  useEffect(() => {
    const loadSavedCount = () => {
      const total =
        getSavedRoadmaps().length +
        getSavedCourses().length +
        getSavedResumeScans().length +
        getSavedJobs().length;
      setSavedCount(total);
    };
    loadSavedCount();
    const id = window.setInterval(loadSavedCount, 4000);
    window.addEventListener('focus', loadSavedCount);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', loadSavedCount);
    };
  }, []);

  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Home' },
    { id: ViewState.CODING_ARENA, label: 'DSA Prep' },
    { id: ViewState.ROADMAP, label: 'Roadmap' },
    { id: ViewState.COURSES, label: 'Courses' },
    { id: ViewState.RESUME, label: 'Resume' },
    { id: ViewState.JOB_SEARCH, label: 'Jobs' },
    { id: ViewState.PORTFOLIO, label: 'Portfolio' },
    { id: ViewState.ANALYTICS, label: 'Analytics' },
    { id: ViewState.ROLE_INTEL, label: 'Roles' },
    { id: ViewState.CHAT, label: 'AI Coach' },
    { id: ViewState.SAVED_ITEMS, label: 'Saved' },
  ].filter((item) => allowedViews.length === 0 || allowedViews.includes(item.id));

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/60 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-3">
          <button
            className="flex items-center gap-2"
            onClick={() => user && setView(ViewState.DASHBOARD)}
          >
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-base">M</div>
            <span className="font-semibold text-white tracking-wide">MNC DSA Prep</span>
          </button>

          {user ? (
            <>
              <nav className="hidden xl:flex items-center gap-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setView(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      currentView === item.id
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-200 hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="flex items-center gap-2" ref={containerRef}>
                <div className="relative">
                  <button
                    onClick={() => setShowNotif((s) => !s)}
                    className="p-2 rounded-lg border border-slate-600 text-slate-100 hover:bg-white/10"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118.6 14.6V11a6 6 0 10-12 0v3c0 .737-.268 1.447-.74 1.995L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                  </button>
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full text-[10px] flex items-center justify-center bg-rose-500 text-white">
                      {unread}
                    </span>
                  )}
                  {showNotif && (
                    <div className="absolute right-0 mt-2 z-50">
                      <Notifications
                        notifications={notifications}
                        onMarkRead={(id) => onMarkRead && onMarkRead(id)}
                        onClearAll={() => onClearAll && onClearAll()}
                        onNavigate={(link) => {
                          if (/^https?:\/\//i.test(link)) {
                            window.open(link, '_blank', 'noopener');
                          } else if (onOpenJobLink) {
                            onOpenJobLink(link);
                          }
                          setShowNotif(false);
                        }}
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setView(ViewState.SAVED_ITEMS)}
                  className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                    currentView === ViewState.SAVED_ITEMS
                      ? 'border-blue-400 bg-blue-600/30 text-white'
                      : 'border-slate-600 text-slate-200 hover:bg-white/10'
                  }`}
                  title="Open Saved"
                >
                  <span className="text-sm font-medium">Saved</span>
                  <span className="min-w-5 h-5 px-1 rounded-full bg-blue-500 text-white text-[11px] flex items-center justify-center">
                    {savedCount}
                  </span>
                </button>

                <button
                  onClick={() => setView(ViewState.PROFILE)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
                    currentView === ViewState.PROFILE
                      ? 'border-blue-400 bg-blue-600/30 text-white'
                      : 'border-slate-600 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                    {user.avatarImage ? <img src={user.avatarImage} alt="Profile" className="w-full h-full object-cover" /> : user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm">{user.name.split(' ')[0]}</span>
                </button>

                <button
                  onClick={() => setMobileOpen((s) => !s)}
                  className="xl:hidden p-2 rounded-lg border border-slate-600 text-slate-200 hover:bg-white/10"
                >
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </>
          ) : null}
        </div>

        {mobileOpen && user && (
          <div className="xl:hidden pb-3 premium-stagger">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setMobileOpen(false); }}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    currentView === item.id
                      ? 'bg-blue-600 border-blue-400 text-white'
                      : 'border-slate-600 text-slate-200 hover:bg-white/10'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navigation;






