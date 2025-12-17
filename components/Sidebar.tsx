import React from 'react';
import { ViewState, UserProfile } from '../types';

interface SidebarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
  user: UserProfile | null;
}

// Acting as Top Navbar now
const Navigation: React.FC<SidebarProps> = ({ currentView, setView, user }) => {
  
  const navItems = [
    { id: ViewState.DASHBOARD, label: 'Home' },
    { id: ViewState.ROADMAP, label: 'Roadmap' },
    { id: ViewState.COURSES, label: 'Courses' },
    { id: ViewState.RESUME, label: 'Resume' },
    { id: ViewState.JOB_SEARCH, label: 'Jobs' },
    { id: ViewState.ROLE_INTEL, label: 'Roles' },
    { id: ViewState.CHAT, label: 'AI Coach' },
    { id: ViewState.SAVED_ITEMS, label: 'Saved' },
  ];

  return (
    <div className="w-full bg-[#2f8d46] text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => user && setView(ViewState.DASHBOARD)}>
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-[#2f8d46] font-bold text-xl">
              K
            </div>
            <span className="font-bold text-xl tracking-wide">AI Career</span>
          </div>
          
          {user ? (
            <>
              {/* Desktop Menu */}
              <div className="hidden lg:block">
                <div className="ml-10 flex items-baseline space-x-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === item.id
                          ? 'bg-white text-[#2f8d46]'
                          : 'text-white hover:bg-[#1e6b30]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* User Profile Button */}
              <div className="ml-4 flex items-center">
                 <button 
                   onClick={() => setView(ViewState.PROFILE)}
                   className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${currentView === ViewState.PROFILE ? 'bg-white text-[#2f8d46] border-white' : 'hover:bg-[#1e6b30] border-transparent'}`}
                 >
                   <div className={`w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold ${currentView === ViewState.PROFILE ? 'bg-[#2f8d46] text-white' : 'bg-white text-[#2f8d46]'}`}>
                     {user.avatarImage ? (
                       <img 
                         src={user.avatarImage} 
                         alt="Profile" 
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       user.name.charAt(0).toUpperCase()
                     )}
                   </div>
                   <span className="text-sm font-medium hidden md:block">{user.name.split(' ')[0]}</span>
                 </button>
              </div>

              {/* Mobile Menu Button (Simple) */}
              <div className="-mr-2 flex lg:hidden">
                <button className="bg-[#1e6b30] inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-[#14532d] focus:outline-none">
                  <span className="sr-only">Open main menu</span>
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </>
          ) : (
            <div>
               {/* Place holder for when not logged in - Logo is centered or left */}
            </div>
          )}
        </div>
      </div>
      
      {/* Sub-header stripe */}
      <div className="bg-[#1e293b] h-1 w-full"></div>
    </div>
  );
};

export default Navigation;
