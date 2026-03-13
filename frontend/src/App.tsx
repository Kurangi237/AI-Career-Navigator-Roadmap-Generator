import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import Navigation from './components/common/Sidebar';
import Login from './components/common/Login';
import StatePanel from './components/common/StatePanel';
import { ViewState, UserProfile, Notification } from '@shared/types';
import { getCurrentUser } from './services/authService';
import { uuidv4 } from './utils/uuid';
import notificationService from './services/notificationService';
import { canAccessView, getDefaultViewForRole, roleViewAccess } from './auth/permissions';
import { getPracticeStatsSync } from './services/practiceService';
import { getSavedCourses, getSavedJobs, getSavedResumeDrafts, getSavedRoadmaps } from './services/storageService';
import { trackEvent } from './services/analyticsService';

const RoadmapGenerator = lazy(() => import('./components/features/RoadmapGenerator'));
const CourseRecommender = lazy(() => import('./components/features/CourseRecommender'));
const ResumeAnalyzer = lazy(() => import('./components/features/ResumeAnalyzer'));
const RoleIntel = lazy(() => import('./components/features/RoleIntel'));
const ChatAssistant = lazy(() => import('./components/features/ChatAssistant'));
const SavedItems = lazy(() => import('./components/features/SavedItems'));
const JobSearch = lazy(() => import('./components/features/JobSearch'));
const MNCDSAPrepHub = lazy(() => import('./components/features/MNCDSAPrepHub'));
const PortfolioGenerator = lazy(() => import('./components/features/PortfolioGenerator'));
const Profile = lazy(() => import('./components/features/Profile'));
const AnalyticsDashboard = lazy(() => import('./components/features/AnalyticsDashboard'));
declare global {
  interface Window {
    gsap?: {
      fromTo: (target: any, fromVars: Record<string, any>, toVars: Record<string, any>) => any;
      registerPlugin?: (...plugins: any[]) => void;
    };
    ScrollTrigger?: any;
  }
}

const DASHBOARD_CARDS = [
  { title: 'MNC DSA Prep Hub', desc: 'Master DSA topics asked by top companies. Crack Google, Meta, Amazon, Microsoft interviews.', view: ViewState.CODING_ARENA, icon: 'DSA' },
  { title: 'Career Roadmap', desc: 'Build week-by-week execution plans.', view: ViewState.ROADMAP, icon: 'ROUTE' },
  { title: 'Course Finder', desc: 'Ranked learning paths by role and budget.', view: ViewState.COURSES, icon: 'LEARN' },
  { title: 'Job Search', desc: 'Curated company and startup pipelines.', view: ViewState.JOB_SEARCH, icon: 'HIRE' },
  { title: 'Analyze Resume', desc: 'AI gap analysis with hiring signal checks.', view: ViewState.RESUME, icon: 'CV' },
  { title: 'Portfolio Generator', desc: 'Build your student portfolio with projects and achievements.', view: ViewState.PORTFOLIO, icon: 'PORT' },
  { title: 'Analytics', desc: 'Track product events and usage trends.', view: ViewState.ANALYTICS, icon: 'DATA' },
  { title: 'Role Intelligence', desc: 'Compensation, skills, and role demand.', view: ViewState.ROLE_INTEL, icon: 'INTEL' },
  { title: 'AI Coach', desc: 'Real-time prep for interviews and growth.', view: ViewState.CHAT, icon: 'COPILOT' },
  { title: 'Saved Items', desc: 'Persist your strategy and learning stack.', view: ViewState.SAVED_ITEMS, icon: 'VAULT' }
];

const JOB_ALERT_SEEN_KEY = 'AI_Career_seen_jobs';
const JOB_EVENT_CURSOR_KEY = 'AI_Career_job_event_cursor';
type JobCountryRoute = 'All' | 'India' | 'UK' | 'USA' | 'Australia' | 'Dubai';
const countryToSegment = (country: JobCountryRoute) => (country === 'All' ? 'all' : country.toLowerCase());
const segmentToCountry = (segment: string): JobCountryRoute => {
  const s = (segment || '').toLowerCase();
  if (s === 'india') return 'India';
  if (s === 'uk') return 'UK';
  if (s === 'usa') return 'USA';
  if (s === 'australia') return 'Australia';
  if (s === 'dubai') return 'Dubai';
  return 'All';
};
const parseJobsPath = (pathname: string): JobCountryRoute | null => {
  const match = pathname.match(/^\/jobs(?:\/([a-z-]+))?\/?$/i);
  if (!match) return null;
  return segmentToCountry(match[1] || 'all');
};

const LiquidParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 48 }).map(() => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 1 + Math.random() * 2.5,
    }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(96,165,250,0.6)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-70" />;
};

const Dashboard: React.FC<{ setView: (v: ViewState) => void; user: UserProfile }> = ({ setView, user }) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [liveStats, setLiveStats] = useState(() => getPracticeStatsSync(user.email));

  useEffect(() => {
    setLiveStats(getPracticeStatsSync(user.email));
  }, [user.email, user.targetRole]);

  useEffect(() => {
    const gsap = window.gsap;
    if (!gsap || !rootRef.current) return;
    if (window.ScrollTrigger && gsap.registerPlugin) {
      gsap.registerPlugin(window.ScrollTrigger);
    }

    gsap.fromTo(
      rootRef.current.querySelectorAll('[data-hero]'),
      { opacity: 0, y: 24, scale: 0.99 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'power3.out' }
    );

    gsap.fromTo(
      rootRef.current.querySelectorAll('[data-card]'),
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.65, ease: 'power2.out', stagger: 0.08, delay: 0.15 }
    );

    const scrollEls = rootRef.current.querySelectorAll('[data-scroll]');
    scrollEls.forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 40, borderRadius: 48 },
        {
          opacity: 1,
          y: 0,
          borderRadius: 16,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: window.ScrollTrigger ? { trigger: el, start: 'top 85%' } : undefined,
        }
      );
    });
  }, []);

  const visibleCards = DASHBOARD_CARDS.filter((card) => canAccessView(user.role, card.view));
  const careerMetrics = useMemo(() => {
    const roadmaps = getSavedRoadmaps().length;
    const courses = getSavedCourses().length;
    const jobs = getSavedJobs().length;
    const resumeDrafts = getSavedResumeDrafts().length;
    const practice = Math.min(100, liveStats.streakDays * 6 + (liveStats.accuracy || 0) * 0.5);
    const score = Math.round(
      Math.min(
        100,
        roadmaps * 12 +
          courses * 6 +
          jobs * 4 +
          resumeDrafts * 8 +
          practice * 0.5
      )
    );
    const trend = [score - 12, score - 8, score - 5, score - 2, score].map((v) => Math.max(5, Math.min(100, v)));
    const reminders = [
      roadmaps === 0 ? 'Generate one roadmap for your target role.' : null,
      jobs < 3 ? 'Save at least 3 matching jobs and track stages.' : null,
      resumeDrafts === 0 ? 'Create a resume draft and run ATS optimization.' : null,
      liveStats.streakDays < 2 ? 'Complete one DSA session today to keep momentum.' : null,
    ].filter(Boolean) as string[];
    return { score, trend, reminders };
  }, [liveStats.accuracy, liveStats.streakDays]);

  return (
    <div ref={rootRef} className="space-y-8 py-4 premium-page">
      <section data-hero className="glass-panel rounded-2xl p-8 md:p-10 relative overflow-hidden">
        <LiquidParticles />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-4 max-w-3xl">
            <span className="brand-chip inline-flex rounded-full px-3 py-1 text-xs font-semibold tracking-[0.16em] text-cyan-200">STARTUP CONTROL CENTER</span>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight text-slate-50">
              {user.name.split(' ')[0]}, build your hiring-ready AI career engine.
            </h1>
            <p className="text-slate-300 text-base md:text-lg">
              Product-grade tools for roadmap execution, interview prep, and opportunity tracking in one operating system.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 min-w-[260px]">
            <div className="glass-panel rounded-xl p-4">
              <p className="text-cyan-300 text-xs">Active Modules</p>
              <p className="text-2xl font-bold text-white">{visibleCards.length}</p>
            </div>
            <div className="glass-panel rounded-xl p-4">
              <p className="text-cyan-300 text-xs">Access</p>
              <p className="text-2xl font-bold text-white">Free Public</p>
            </div>
            <div className="glass-panel rounded-xl p-4 col-span-2">
              <p className="text-cyan-300 text-xs">Target Role</p>
              <p className="text-xl font-semibold text-white">{user.targetRole || 'Software Engineer'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleCards.map((card) => (
          <button
            key={card.title}
            data-card
            onClick={() => setView(card.view)}
            className="glass-panel distort-hover rounded-xl p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <p className="text-[11px] tracking-[0.2em] text-cyan-300 mb-2">{card.icon}</p>
            <h3 className="text-lg font-bold text-white">{card.title}</h3>
            <p className="text-sm text-slate-300 mt-1">{card.desc}</p>
          </button>
        ))}
      </section>

      <section data-scroll className="glass-panel rounded-2xl p-5 premium-card">
        <h2 className="text-lg text-white font-bold">Today's MNC Interview Prep</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          <p>1. Solve 3 DSA problems from your selected company path.</p>
          <p>2. Complete one timed mock round and review your weak patterns.</p>
          <p>3. Update resume with one quantified impact point before applying.</p>
        </div>
      </section>

      <section data-scroll className="glass-panel rounded-2xl p-5 premium-card">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-white font-bold">Career Score</h2>
          <p className="text-2xl font-bold text-cyan-300">{careerMetrics.score}/100</p>
        </div>
        <div className="mt-3 h-2 w-full rounded bg-slate-800 overflow-hidden">
          <div className="h-2 rounded bg-cyan-400" style={{ width: `${careerMetrics.score}%` }} />
        </div>
        <div className="mt-3 flex items-end gap-1 h-10">
          {careerMetrics.trend.map((v, i) => (
            <div key={i} className="flex-1 rounded-t bg-blue-500/60" style={{ height: `${Math.max(15, v)}%` }} />
          ))}
        </div>
        <div className="mt-3 space-y-1">
          {(careerMetrics.reminders.length ? careerMetrics.reminders : ['You are on track. Keep applying and practicing daily.']).map((r) => (
            <p key={r} className="text-xs text-slate-300">- {r}</p>
          ))}
        </div>
      </section>

      <section data-scroll className="glass-panel rounded-2xl p-6 premium-card">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-slate-100 font-bold">Execution Board</h2>
          <button
            onClick={() => setView(ViewState.JOB_SEARCH)}
            className="text-xs px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Open Jobs
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 premium-stagger">
          <button onClick={() => setView(ViewState.CODING_ARENA)} className="distort-hover rounded-lg border border-blue-500/30 p-4 bg-slate-900/40 text-left premium-card">
            <p className="text-sm font-semibold text-white">Practice Target</p>
            <p className="text-xs text-slate-300 mt-1">DSA streak: {liveStats.streakDays} days</p>
          </button>
          <button onClick={() => setView(ViewState.ROADMAP)} className="distort-hover rounded-lg border border-blue-500/30 p-4 bg-slate-900/40 text-left premium-card">
            <p className="text-sm font-semibold text-white">Roadmap Target</p>
            <p className="text-xs text-slate-300 mt-1">Keep weekly milestones on track</p>
          </button>
          <button onClick={() => setView(ViewState.RESUME)} className="distort-hover rounded-lg border border-blue-500/30 p-4 bg-slate-900/40 text-left premium-card">
            <p className="text-sm font-semibold text-white">Resume Target</p>
            <p className="text-xs text-slate-300 mt-1">Run ATS + JD alignment before applying</p>
          </button>
        </div>
      </section>

    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [selectedJobLink, setSelectedJobLink] = useState<string | null>(null);
  const [resumeJobDescription, setResumeJobDescription] = useState('');
  const [jobCountryRoute, setJobCountryRoute] = useState<JobCountryRoute>('All');
  const contentRef = useRef<HTMLDivElement | null>(null);
  const seenJobKeysRef = useRef<Set<string>>(new Set());
  const jobEventCursorRef = useRef<number>(0);
  const roleAllowedViews = user ? roleViewAccess[user.role] : [];
  const allowedViews = roleAllowedViews;

  useEffect(() => {
    if (!notificationService.isSupabaseEnabled()) {
      localStorage.setItem('AI_Career_notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(JOB_ALERT_SEEN_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      if (Array.isArray(arr)) {
        seenJobKeysRef.current = new Set(arr.slice(0, 6000));
      }
    } catch {
      seenJobKeysRef.current = new Set();
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(JOB_EVENT_CURSOR_KEY);
      const value = raw ? Number(raw) : 0;
      jobEventCursorRef.current = Number.isFinite(value) ? value : 0;
    } catch {
      jobEventCursorRef.current = 0;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const items = await notificationService.fetchNotifications();
        if (mounted) setNotifications(items);
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!notificationService.isSupabaseEnabled()) return;
    const unsub = notificationService.subscribeNotifications((n) => {
      setNotifications((prev) => {
        const exists = prev.find((p) => p.id === n.id);
        if (exists) {
          return prev.map((p) => (p.id === n.id ? { ...p, ...n } : p));
        }
        return [n, ...prev];
      });
    });
    return () => {
      unsub && unsub();
    };
  }, []);

  const addNotification = (n: Omit<Notification, 'id' | 'timestamp' | 'read'> & Partial<Pick<Notification, 'read'>>) => {
    const newNotif: Notification = {
      id: uuidv4(),
      timestamp: Date.now(),
      read: false,
      ...n,
    } as Notification;
    setNotifications((s) => [newNotif, ...s]);
    notificationService.saveNotification(newNotif).catch((err: any) => console.error(err));
  };

  const persistSeenJobs = () => {
    try {
      localStorage.setItem(JOB_ALERT_SEEN_KEY, JSON.stringify(Array.from(seenJobKeysRef.current).slice(-6000)));
    } catch (e) {
      console.error('Failed to persist seen jobs', e);
    }
  };

  const notifyOnlyNewJobs = (jobs: { title: string; company?: string; location?: string; link: string }[], maxNotifications = 3) => {
    let sent = 0;
    for (const job of jobs) {
      const key = `${job.title}|${job.company || ''}|${job.link}`.toLowerCase().trim();
      if (!key) continue;
      if (seenJobKeysRef.current.has(key)) continue;
      seenJobKeysRef.current.add(key);
      if (sent < maxNotifications) {
        addNotification({
          type: 'job',
          title: `New: ${job.title}`,
          message: `${job.company || 'Company'} - ${job.location || ''}`.trim(),
          link: job.link,
          priority: 'medium',
          category: 'opportunity'
        });
        sent += 1;
      }
    }
    if (sent > 0) persistSeenJobs();
  };

  const markAsRead = (id: string) => {
    setNotifications((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n)));
    notificationService.markAsReadRemote(id).catch((err: any) => console.error(err));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    notificationService.clearAllRemote().catch((err: any) => console.error(err));
  };

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const pollJobEvents = async () => {
      if (!mounted) return;
      try {
        const resp = await fetch(`/api/jobs/events?cursor=${jobEventCursorRef.current}&limit=120`);
        if (!resp.ok) return;
        const data = await resp.json();
        const events = Array.isArray(data?.events) ? data.events : [];
        const nextCursor = Number(data?.cursor || jobEventCursorRef.current);
        if (Number.isFinite(nextCursor)) {
          jobEventCursorRef.current = nextCursor;
          localStorage.setItem(JOB_EVENT_CURSOR_KEY, String(nextCursor));
        }
        const mapped = events.map((e: any) => ({
          title: e.title || 'Job',
          company: e.company || '',
          location: e.location || '',
          link: e.link || ''
        })).filter((e: any) => e.link);
        notifyOnlyNewJobs(mapped, 5);
      } catch (e) {
        console.error('Background job event poll failed', e);
      }
    };

    const id = setInterval(pollJobEvents, 30_000);
    pollJobEvents();
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [user?.email, user?.targetRole]);

  useEffect(() => {
    if (!user) return;
    let es: EventSource | null = null;
    try {
      es = new EventSource(`/api/jobs/stream?cursor=${jobEventCursorRef.current}`);
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data || '{}');
          if (typeof payload?.cursor === 'number' && Number.isFinite(payload.cursor)) {
            jobEventCursorRef.current = payload.cursor;
            localStorage.setItem(JOB_EVENT_CURSOR_KEY, String(payload.cursor));
          }
          if (payload?.type !== 'events' || !Array.isArray(payload?.events)) return;
          const mapped = payload.events.map((e: any) => ({
            title: e.title || 'Job',
            company: e.company || '',
            location: e.location || '',
            link: e.link || ''
          })).filter((x: any) => x.link);
          notifyOnlyNewJobs(mapped, 5);
        } catch (e) {
          console.error('SSE payload parse error', e);
        }
      };
      es.onerror = () => {
        try { es?.close(); } catch { /* ignore */ }
      };
    } catch (e) {
      console.error('Failed to open job SSE stream', e);
    }
    return () => {
      try { es?.close(); } catch { /* ignore */ }
    };
  }, [user?.email]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      const deepLinkCountry = parseJobsPath(window.location.pathname);
      if (deepLinkCountry) {
        setJobCountryRoute(deepLinkCountry);
        setCurrentView(ViewState.JOB_SEARCH);
      } else {
        setCurrentView(ViewState.DASHBOARD);
      }
    } else {
      setCurrentView(ViewState.LOGIN);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      if (!user) return;
      const deepLinkCountry = parseJobsPath(window.location.pathname);
      if (deepLinkCountry) {
        setJobCountryRoute(deepLinkCountry);
        setCurrentView(ViewState.JOB_SEARCH);
      }
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [user]);

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setCurrentView(ViewState.DASHBOARD);
    trackEvent('login_success', { role: loggedInUser.role, plan: loggedInUser.subscriptionPlan });
  };

  const goToDashboard = () => setCurrentView(ViewState.DASHBOARD);
  const guardedSetView = (view: ViewState) => {
    if (!user) return;
    if (canAccessView(user.role, view)) {
      setCurrentView(view);
      trackEvent('view_opened', { view, role: user.role });
      return;
    }
    addNotification({
      type: 'system',
      title: 'Access blocked',
      message: `Role permissions do not allow access to ${view}.`,
      priority: 'medium',
      category: 'update'
    });
    setCurrentView(getDefaultViewForRole());
  };

  useEffect(() => {
    if (!user) return;
    if (!canAccessView(user.role, currentView)) {
      setCurrentView(getDefaultViewForRole());
    }
  }, [user, currentView]);

  useEffect(() => {
    const gsap = window.gsap;
    if (!gsap || !contentRef.current) return;
    gsap.fromTo(
      contentRef.current,
      { opacity: 0, y: 16, filter: 'blur(4px)' },
      { opacity: 1, y: 0, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' }
    );
  }, [currentView]);

  useEffect(() => {
    if (!user) return;
    if (currentView === ViewState.JOB_SEARCH) {
      const target = `/jobs/${countryToSegment(jobCountryRoute)}`;
      if (window.location.pathname !== target) {
        window.history.replaceState({}, '', target);
      }
    } else if (window.location.pathname.startsWith('/jobs')) {
      window.history.replaceState({}, '', '/');
    }
  }, [currentView, jobCountryRoute, user]);

  if (currentView === ViewState.LOGIN || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-shell flex flex-col">
      <Navigation
        currentView={currentView}
        setView={guardedSetView}
        user={user}
        allowedViews={allowedViews}
        notifications={notifications}
        onMarkRead={markAsRead}
        onClearAll={clearAllNotifications}
        onOpenJobLink={(link: string) => {
          setSelectedJobLink(null);
          setTimeout(() => {
            setSelectedJobLink(link);
            guardedSetView(ViewState.JOB_SEARCH);
          }, 50);
        }}
      />

      <main ref={contentRef} className="app-main flex-1">
        <Suspense
          fallback={
            <StatePanel
              mode="loading"
              title="Loading section"
              message="Preparing this module..."
            />
          }
        >
        {currentView === ViewState.DASHBOARD && <Dashboard setView={guardedSetView} user={user} />}
        {currentView === ViewState.PROFILE && <Profile user={user} setUser={setUser} onBack={goToDashboard} />}
        {currentView === ViewState.CODING_ARENA && <MNCDSAPrepHub onBack={goToDashboard} />}
        {currentView === ViewState.ROADMAP && <RoadmapGenerator onBack={goToDashboard} />}
        {currentView === ViewState.COURSES && <CourseRecommender onBack={goToDashboard} />}
        {currentView === ViewState.RESUME && (
          <ResumeAnalyzer
            onBack={goToDashboard}
            initialJobDescription={resumeJobDescription}
            onConsumeInitialJobDescription={() => setResumeJobDescription('')}
          />
        )}
        {currentView === ViewState.PORTFOLIO && <PortfolioGenerator user={user} onBack={goToDashboard} />} 
        {currentView === ViewState.ANALYTICS && <AnalyticsDashboard onBack={goToDashboard} />}
        {currentView === ViewState.ROLE_INTEL && <RoleIntel onBack={goToDashboard} />}
        {currentView === ViewState.CHAT && <ChatAssistant onBack={goToDashboard} />}
        {currentView === ViewState.SAVED_ITEMS && <SavedItems onBack={goToDashboard} />}
        {currentView === ViewState.JOB_SEARCH && (
          <JobSearch
            initialCountry={jobCountryRoute}
            onCountryRouteChange={(next) => setJobCountryRoute(next as JobCountryRoute)}
            selectedJobLink={selectedJobLink}
            onClearSelected={() => setSelectedJobLink(null)}
            onBack={goToDashboard}
            onNotifyJobs={(jobs) => {
              notifyOnlyNewJobs(jobs.slice(0, 20), 5);
            }}
            onGoToResumeWithJob={(jobDescription) => {
              setResumeJobDescription(jobDescription);
              guardedSetView(ViewState.RESUME);
            }}
          />
        )}
        </Suspense>
      </main>

      <footer className="border-t border-slate-700/70 bg-slate-950/80 text-slate-400 py-6 text-center text-sm mt-auto">
        <p>(c) 2026 KBV OS. Built for startup-scale career intelligence.</p>
      </footer>
    </div>
  );
};

export default App;









