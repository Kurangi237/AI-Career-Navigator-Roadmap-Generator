import React, { useState } from 'react';
import { getJobRoleDetails } from '../services/geminiService';
import { JobRoleResponse } from '../types';

interface Props {
  onBack: () => void;
}

const RoleIntel: React.FC<Props> = ({ onBack }) => {
  const [roleInput, setRoleInput] = useState('');
  const [data, setData] = useState<JobRoleResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleInput) return;
    setLoading(true);
    try {
      const res = await getJobRoleDetails(roleInput);
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <button 
        onClick={onBack} 
        className="flex items-center text-slate-400 hover:text-white transition-colors group mb-6"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
        </svg>
        Back to Dashboard
      </button>

      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Job Role Intelligence</h2>
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto">
          <input
            type="text"
            value={roleInput}
            onChange={(e) => setRoleInput(e.target.value)}
            placeholder="Enter a job title (e.g., DevOps Engineer)"
            className="w-full bg-slate-800 border-2 border-slate-700 rounded-full py-4 px-6 text-white focus:outline-none focus:border-indigo-500 pr-32 transition-colors"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white px-6 rounded-full font-medium hover:bg-indigo-500 transition-colors"
          >
            {loading ? '...' : 'Analyze'}
          </button>
        </form>
      </div>

      {data && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Card */}
          <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
               <svg className="w-32 h-32 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/><path d="M12 14l9-5-9-5-9 5 9 5z"/><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/></svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">{data.role}</h2>
            <p className="text-slate-400 text-lg">{data.overview}</p>
            <div className="mt-6 flex items-center gap-4">
              <div className="px-4 py-2 bg-green-500/10 text-green-400 rounded-lg border border-green-500/20 font-mono">
                {data.salary_range}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-bold text-white mb-4">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {data.required_skills.map((s, i) => (
                  <span key={i} className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
               <h3 className="text-lg font-bold text-white mb-4">Key Responsibilities</h3>
               <ul className="space-y-2">
                 {data.responsibilities.map((r, i) => (
                   <li key={i} className="text-slate-300 text-sm flex gap-2">
                     <span className="text-indigo-500">•</span> {r}
                   </li>
                 ))}
               </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleIntel;
