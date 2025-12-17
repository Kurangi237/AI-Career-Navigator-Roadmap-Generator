import React, { useState } from 'react';
import { generateRoadmap } from '../services/geminiService';
import { saveRoadmapToStorage } from '../services/storageService';
import { RoadmapResponse } from '../types';

interface Props {
  onBack: () => void;
}

const RoadmapGenerator: React.FC<Props> = ({ onBack }) => {
  const [role, setRole] = useState('');
  const [skills, setSkills] = useState('');
  const [availability, setAvailability] = useState('10 hours/week');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) return;

    setLoading(true);
    setError('');
    setRoadmap(null);
    setSaved(false);

    try {
      const result = await generateRoadmap(role, skills, availability);
      setRoadmap(result);
    } catch (err) {
      console.error(err);
      setError("Failed to generate roadmap. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (roadmap) {
      saveRoadmapToStorage(roadmap);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000); // Reset feedback after 3s
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-[#2f8d46] mb-6 flex items-center">
          <span className="bg-[#2f8d46] w-2 h-8 rounded-sm mr-3"></span>
          Generate Career Roadmap
        </h2>
        
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Target Role</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Java Full Stack Developer"
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none transition-all"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Time Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none transition-all"
            >
              <option>5 hours/week</option>
              <option>10 hours/week</option>
              <option>20 hours/week</option>
              <option>Full-time (40h/week)</option>
            </select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-semibold text-slate-700">Current Skills (Optional)</label>
            <textarea
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. Basic HTML, Python knowledge, Excel..."
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none transition-all h-24"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-white transition-all transform active:scale-95 ${
                loading 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-[#2f8d46] hover:bg-[#1e6b30] shadow-lg shadow-green-200'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Thinking...
                </span>
              ) : 'Generate Personal Roadmap'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-lg">
          {error}
        </div>
      )}

      {roadmap && (
        <div className="animate-fade-in space-y-6">
          <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-slate-200">
             <div className="flex flex-col">
                <h3 className="text-xl font-bold text-slate-800">
                    Your Path to <span className="text-[#2f8d46]">{roadmap.role}</span>
                </h3>
                <span className="text-sm text-slate-500">{roadmap.duration_weeks} Weeks Estimated</span>
             </div>
             
             <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saved}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                        saved 
                        ? 'bg-slate-100 text-slate-500' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                    }`}
                >
                    {saved ? (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            Saved!
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                            Save Roadmap
                        </>
                    )}
                </button>
             </div>
          </div>

          <div className="relative border-l-2 border-[#2f8d46] ml-4 space-y-8">
            {roadmap.weekly_plan.map((week, idx) => (
              <div key={idx} className="relative pl-8 pb-8 last:pb-0 group">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-[#2f8d46]"></div>
                
                <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <span className="text-xs font-bold text-[#2f8d46] uppercase tracking-wider mb-1 block">
                    Week {week.week}
                  </span>
                  <h4 className="text-lg font-bold text-slate-800 mb-2">{week.topic}</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-slate-50 p-3 rounded border border-slate-200">
                        <p className="text-xs text-slate-500 mb-2 font-semibold uppercase">Learn From (Click to Open)</p>
                        <ul className="space-y-2">
                          {week.resources.map((r, i) => (
                            <li key={i}>
                                <a 
                                    href={r.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-[#2f8d46] hover:underline flex items-start gap-2"
                                >
                                    <span>🔗</span>
                                    <span>{r.title}</span>
                                </a>
                            </li>
                          ))}
                        </ul>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-100">
                        <p className="text-xs text-green-700 mb-1 font-bold uppercase">Practical Project</p>
                        <p className="text-sm text-slate-700">{week.project}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoadmapGenerator;
