import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/common/Sidebar';
import RoadmapGenerator from './components/features/RoadmapGenerator';
import CourseRecommender from './components/features/CourseRecommender';
import ResumeAnalyzer from './components/features/ResumeAnalyzer';
import RoleIntel from './components/features/RoleIntel';
import ChatAssistant from './components/features/ChatAssistant';
import SavedItems from './components/features/SavedItems';
import JobSearch from './components/features/JobSearch';
import CodingArena from './components/features/CodingArena';
import Login from './components/common/Login';
import Profile from './components/features/Profile';
import { ViewState, UserProfile, Notification } from '@shared/types';
import { getCurrentUser } from './services/authService';
import { uuidv4 } from './utils/uuid';
import notificationService from './services/notificationService';
import { canAccessView, getDefaultViewForRole, roleViewAccess } from './auth/permissions';
import { getPracticeStatsSync } from './services/practiceService';

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
  { title: 'Role Intelligence', desc: 'Compensation, skills, and role demand.', view: ViewState.ROLE_INTEL, icon: 'INTEL' },
  { title: 'AI Coach', desc: 'Real-time prep for interviews and growth.', view: ViewState.CHAT, icon: 'COPILOT' },
  { title: 'Saved Items', desc: 'Persist your strategy and learning stack.', view: ViewState.SAVED_ITEMS, icon: 'VAULT' }
];

const LANGUAGES = ['Java', 'Python', 'C', 'C++', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'SQL', 'Kotlin', 'Swift', 'C#'];
const CS_SUBJECTS = ['Computer Networks', 'Operating Systems', 'DBMS', 'System Design', 'Software Engineering', 'Compiler Design', 'OOP', 'Distributed Systems', 'Cloud Computing', 'Computer Architecture'];
const HOME_LEARNING_ITEMS = [
  { title: 'Java Interview Patterns', type: 'Tutorial', pricing: 'Free' },
  { title: 'OS Process Scheduling Deep Dive', type: 'Article', pricing: 'Free' },
  { title: 'Network Protocols for Interviews', type: 'Tutorial', pricing: 'Paid' },
  { title: 'DSA for Backend Engineers', type: 'Tutorial', pricing: 'Free' },
  { title: 'System Design Case Study Pack', type: 'Article', pricing: 'Paid' },
  { title: 'Database Indexing Explained', type: 'Article', pricing: 'Free' },
  { title: 'Concurrency in Java', type: 'Tutorial', pricing: 'Paid' },
  { title: 'Software Engineering Principles', type: 'Article', pricing: 'Free' },
  { title: 'C++ STL Master Track', type: 'Tutorial', pricing: 'Paid' },
  { title: 'Computer Architecture Primer', type: 'Article', pricing: 'Free' },
  { title: 'Python for Coding Rounds', type: 'Tutorial', pricing: 'Free' },
  { title: 'Distributed Systems Intro', type: 'Article', pricing: 'Paid' },
];

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
        ctx.fillStyle = 'rgba(251,146,60,0.55)';
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

  return (
    <div ref={rootRef} className="space-y-8 py-4">
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div data-scroll className="glass-panel rounded-2xl p-5 lg:col-span-2">
          <h2 className="text-lg text-white font-bold">Today's MNC Interview Prep</h2>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p>1. Solve 3 DSA problems from your target company path.</p>
            <p>2. Complete mock interview simulation and review feedback.</p>
            <p>3. Study one weak DSA topic with company-specific examples.</p>
          </div>
        </div>
        <div data-scroll className="glass-panel rounded-2xl p-5">
          <h2 className="text-lg text-white font-bold">Live Pulse</h2>
          <div className="mt-3 text-sm text-slate-300 space-y-1">
            <p>Practice streak: {liveStats.streakDays} days</p>
            <p>Accuracy: {liveStats.accuracy}%</p>
            <p>Solved today XP: {liveStats.todayXp}</p>
          </div>
        </div>
      </section>

      <section data-scroll className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl text-slate-100 font-bold">Founder Note</h2>
        <p className="text-slate-300 mt-2 leading-relaxed">
          This product is now structured as an extensible platform: intelligence APIs, reusable UI modules, and startup-focused user workflows.
        </p>
      </section>

      <section data-scroll className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl text-slate-100 font-bold">Languages & Core CS</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {LANGUAGES.slice(0, 10).map((x) => <span key={x} className="px-3 py-1 text-xs rounded border border-orange-400/30 text-orange-200">{x}</span>)}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {CS_SUBJECTS.slice(0, 8).map((x) => <span key={x} className="px-3 py-1 text-xs rounded border border-slate-500/40 text-slate-200">{x}</span>)}
        </div>
      </section>

      <section data-scroll className="glass-panel rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl text-slate-100 font-bold">Featured Learning</h2>
          <button
            onClick={() => setView(ViewState.COURSES)}
            className="text-xs px-3 py-1.5 rounded bg-orange-500 text-white hover:bg-orange-600"
          >
            View All
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {HOME_LEARNING_ITEMS.slice(0, 6).map((x) => (
            <button key={x.title} onClick={() => setView(ViewState.COURSES)} className="distort-hover rounded-lg border border-orange-500/20 p-3 bg-slate-900/40 text-left">
              <p className="text-sm font-semibold text-white">{x.title}</p>
              <p className="text-xs text-slate-300 mt-1">{x.type} · {x.pricing}</p>
            </button>
          ))}
        </div>
      </section>

      <section data-scroll className="glass-panel rounded-2xl p-6">
        <h2 className="text-xl text-slate-100 font-bold">About MNC DSA Prep Hub</h2>
        <p className="text-slate-300 mt-2 leading-relaxed">
          Master Data Structures and Algorithms following the exact patterns asked at top MNC companies. Get company-specific learning paths, mock interviews, and resources to crack your dream job interviews at Google, Meta, Amazon, Microsoft, and more.
        </p>
      </section>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const notificationsRef = useRef<Notification[]>([]);
  const [selectedJobLink, setSelectedJobLink] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const roleAllowedViews = user ? roleViewAccess[user.role] : [];
  const allowedViews = roleAllowedViews;

  useEffect(() => {
    if (!notificationService.isSupabaseEnabled()) {
      localStorage.setItem('AI_Career_notifications', JSON.stringify(notifications));
    }
    notificationsRef.current = notifications;
  }, [notifications]);

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

  const markAsRead = (id: string) => {
    setNotifications((s) => s.map((n) => (n.id === id ? { ...n, read: true } : n)));
    notificationService.markAsReadRemote(id).catch((err: any) => console.error(err));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    notificationService.clearAllRemote().catch((err: any) => console.error(err));
  };

  useEffect(() => {
    let mounted = true;
    const poll = async () => {
      if (!mounted) return;
      if (notificationsRef.current.length === 0) {
        addNotification({
          type: 'job',
          title: 'New job openings available',
          message: 'Top companies posted new roles. Check job search.',
          priority: 'medium',
          category: 'opportunity',
          link: '/jobs'
        });
      }
    };

    const id = setInterval(poll, 60_000);
    poll();
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setCurrentView(ViewState.DASHBOARD);
    } else {
      setCurrentView(ViewState.LOGIN);
    }
  }, []);

  const handleLoginSuccess = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    setCurrentView(ViewState.DASHBOARD);
  };

  const goToDashboard = () => setCurrentView(ViewState.DASHBOARD);
  const guardedSetView = (view: ViewState) => {
    if (!user) return;
    if (canAccessView(user.role, view)) {
      setCurrentView(view);
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

  if (currentView === ViewState.LOGIN || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
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

      <main ref={contentRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === ViewState.DASHBOARD && <Dashboard setView={guardedSetView} user={user} />}
        {currentView === ViewState.PROFILE && <Profile user={user} setUser={setUser} onBack={goToDashboard} />}
        {currentView === ViewState.CODING_ARENA && <CodingArena user={user} onBack={goToDashboard} />}
        {currentView === ViewState.ROADMAP && <RoadmapGenerator onBack={goToDashboard} />}
        {currentView === ViewState.COURSES && <CourseRecommender onBack={goToDashboard} />}
        {currentView === ViewState.RESUME && <ResumeAnalyzer onBack={goToDashboard} />}
        {currentView === ViewState.ROLE_INTEL && <RoleIntel onBack={goToDashboard} />}
        {currentView === ViewState.CHAT && <ChatAssistant onBack={goToDashboard} />}
        {currentView === ViewState.SAVED_ITEMS && <SavedItems onBack={goToDashboard} />}
        {currentView === ViewState.JOB_SEARCH && (
          <JobSearch
            selectedJobLink={selectedJobLink}
            onClearSelected={() => setSelectedJobLink(null)}
            onBack={goToDashboard}
            onNotifyJobs={(jobs) => {
              jobs.slice(0, 5).forEach((job) =>
                addNotification({
                  type: 'job',
                  title: `New: ${job.title}`,
                  message: `${job.company} - ${job.location || ''}`.trim(),
                  link: job.link,
                  priority: 'medium',
                  category: 'opportunity'
                })
              );
            }}
          />
        )}
      </main>

      <footer className="bg-slate-950/80 border-t border-cyan-900/60 text-slate-400 py-6 text-center text-sm mt-auto">
        <p>© 2026 KBV OS. Built for startup-scale career intelligence.</p>
      </footer>
    </div>
  );
};

export default App;


