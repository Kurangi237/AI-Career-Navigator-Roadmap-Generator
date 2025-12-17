import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { updateUserProfile, logoutUser } from '../services/authService';
import { getSavedRoadmaps, getSavedCourses } from '../services/storageService';

interface Props {
  user: UserProfile;
  setUser: (user: UserProfile | null) => void;
  onBack: () => void;
}

const Profile: React.FC<Props> = ({ user, setUser, onBack }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(user);
  const [stats, setStats] = useState({ roadmaps: 0, courses: 0 });

  useEffect(() => {
    // Load stats
    const r = getSavedRoadmaps();
    const c = getSavedCourses();
    setStats({ roadmaps: r.length, courses: c.length });
  }, []);

  const handleSave = () => {
    const updated = updateUserProfile(formData);
    if (updated) {
      setUser(updated);
      setIsEditing(false);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null); // This triggers the App to show Login screen
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <button 
        onClick={onBack} 
        className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 mb-4"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#2f8d46] to-[#1e6b30]"></div>
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="flex items-end gap-6">
              <div className={`w-24 h-24 rounded-full border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-white ${user.avatarColor || 'bg-slate-500'}`}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="mb-1">
                <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                <p className="text-slate-500">{user.email}</p>
              </div>
            </div>
            <div className="flex gap-3">
               {!isEditing ? (
                 <>
                   <button 
                     onClick={() => setIsEditing(true)}
                     className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                   >
                     Edit Profile
                   </button>
                   <button 
                     onClick={handleLogout}
                     className="px-4 py-2 bg-red-50 text-red-600 border border-red-100 rounded-lg font-medium hover:bg-red-100 transition-colors"
                   >
                     Sign Out
                   </button>
                 </>
               ) : (
                 <>
                   <button 
                     onClick={() => setIsEditing(false)}
                     className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 font-medium hover:bg-slate-50"
                   >
                     Cancel
                   </button>
                   <button 
                     onClick={handleSave}
                     className="px-4 py-2 bg-[#2f8d46] text-white rounded-lg font-medium hover:bg-[#1e6b30]"
                   >
                     Save Changes
                   </button>
                 </>
               )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Form */}
            <div className="md:col-span-2 space-y-6">
              <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="text-xl">🎯</span> Career Goals
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Target Role</label>
                    {isEditing ? (
                      <input 
                        type="text" 
                        value={formData.targetRole}
                        onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#2f8d46] outline-none"
                      />
                    ) : (
                      <p className="text-slate-900 font-medium">{user.targetRole || "Not set"}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1">Current Skills</label>
                     {isEditing ? (
                      <textarea 
                        value={formData.skills}
                        onChange={(e) => setFormData({...formData, skills: e.target.value})}
                        className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-[#2f8d46] outline-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-slate-900">{user.skills || "No skills listed yet."}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Stats */}
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Your Activity</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                     <span className="text-green-800 font-medium">Saved Roadmaps</span>
                     <span className="text-2xl font-bold text-green-600">{stats.roadmaps}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                     <span className="text-blue-800 font-medium">Saved Courses</span>
                     <span className="text-2xl font-bold text-blue-600">{stats.courses}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-slate-900 text-slate-400 rounded-xl p-6 text-sm">
                <p>Member since:</p>
                <p className="text-white font-medium">{new Date(user.joinedDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
