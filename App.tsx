import React, { useState, useEffect } from 'react';
import Navigation from './components/Sidebar';
import RoadmapGenerator from './components/RoadmapGenerator';
import CourseRecommender from './components/CourseRecommender';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import RoleIntel from './components/RoleIntel';
import ChatAssistant from './components/ChatAssistant';
import SavedItems from './components/SavedItems';
import JobSearch from './components/JobSearch';
import Login from './components/Login';
import Profile from './components/Profile';
import { ViewState, UserProfile } from './types';
import { getCurrentUser } from './services/authService';

const Dashboard: React.FC<{ setView: (v: ViewState) => void, user: UserProfile }> = ({ setView, user }) => (
  <div className="space-y-12 animate-fade-in py-6">
    {/* Hero Section */}
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-[#2f8d46] mb-4">Hello, {user.name.split(' ')[0]}! 👋</h1>
      <p className="text-slate-600 max-w-2xl mx-auto text-xl leading-relaxed">
        Welcome to your KARE26 student dashboard. Ready to upgrade your career today?
      </p>
    </div>

    {/* Feature Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { 
          title: "Career Roadmap", 
          desc: "Step-by-step weekly plan tailored for you.", 
          view: ViewState.ROADMAP, 
          icon: "🗺️",
          bg: "bg-green-50",
          border: "border-green-200"
        },
        { 
          title: "Course Finder", 
          desc: "Best of GeeksforGeeks, W3Schools & YouTube.", 
          view: ViewState.COURSES, 
          icon: "📚",
          bg: "bg-yellow-50",
          border: "border-yellow-200"
        },
        { 
          title: "Job Search", 
          desc: "Top 100+ Career Pages & Portals.", 
          view: ViewState.JOB_SEARCH, 
          icon: "🚀",
          bg: "bg-pink-50",
          border: "border-pink-200"
        },
        { 
          title: "Analyze Resume", 
          desc: "Get AI feedback on your resume.", 
          view: ViewState.RESUME, 
          icon: "📄",
          bg: "bg-blue-50",
          border: "border-blue-200"
        },
        { 
          title: "Role Intelligence", 
          desc: "Salaries, Skills & Responsibilities.", 
          view: ViewState.ROLE_INTEL, 
          icon: "💼",
          bg: "bg-purple-50",
          border: "border-purple-200"
        },
        { 
          title: "AI Coach", 
          desc: "Chat with KARE26 AI Assistant.", 
          view: ViewState.CHAT, 
          icon: "🤖",
          bg: "bg-orange-50",
          border: "border-orange-200"
        },
        { 
          title: "Saved Items", 
          desc: "Access your saved roadmaps and courses.", 
          view: ViewState.SAVED_ITEMS, 
          icon: "💾",
          bg: "bg-slate-50",
          border: "border-slate-200"
        }
      ].map((card, i) => (
        <button 
          key={i} 
          onClick={() => setView(card.view)}
          className={`p-6 rounded-xl border ${card.border} ${card.bg} hover:shadow-md hover:scale-[1.02] transition-all text-left group`}
        >
          <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-200">
             {card.icon}
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-[#2f8d46] transition-colors">{card.title}</h3>
          <p className="text-slate-600 text-sm">{card.desc}</p>
        </button>
      ))}
    </div>

    {/* About Section (Shortened) */}
    <div className="bg-[#1e293b] rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Personalized career guidance at your fingertips</h2>
    </div>
  </div>
);

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.LOGIN);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Check for existing session
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

  if (currentView === ViewState.LOGIN || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <Navigation currentView={currentView} setView={setCurrentView} user={user} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === ViewState.DASHBOARD && <Dashboard setView={setCurrentView} user={user} />}
        {currentView === ViewState.PROFILE && <Profile user={user} setUser={setUser} onBack={goToDashboard} />}
        {currentView === ViewState.ROADMAP && <RoadmapGenerator onBack={goToDashboard} />}
        {currentView === ViewState.COURSES && <CourseRecommender onBack={goToDashboard} />}
        {currentView === ViewState.RESUME && <ResumeAnalyzer onBack={goToDashboard} />}
        {currentView === ViewState.ROLE_INTEL && <RoleIntel onBack={goToDashboard} />}
        {currentView === ViewState.CHAT && <ChatAssistant onBack={goToDashboard} />}
        {currentView === ViewState.SAVED_ITEMS && <SavedItems onBack={goToDashboard} />}
        {currentView === ViewState.JOB_SEARCH && <JobSearch onBack={goToDashboard} />}
      </main>
      
      <footer className="bg-slate-900 text-slate-400 py-6 text-center text-sm mt-auto">
        <p>© 2025 KARE26 Students. Powered by Career Path AI.</p>
      </footer>
    </div>
  );
};

export default App;
