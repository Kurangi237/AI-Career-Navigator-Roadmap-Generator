import React, { useState, useEffect } from 'react';
import { getSavedRoadmaps, getSavedCourses, deleteSavedRoadmap, deleteSavedCourse, getSavedResumeScans, deleteSavedResumeScan } from '../../services/storageService';
import { SavedRoadmap, SavedCourse, SavedResumeScan } from '@shared/types';

interface Props {
  onBack: () => void;
}

const SavedItems: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'roadmaps' | 'courses' | 'scans'>('roadmaps');
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [savedScans, setSavedScans] = useState<SavedResumeScan[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSavedRoadmaps(getSavedRoadmaps());
    setSavedCourses(getSavedCourses());
    setSavedScans(getSavedResumeScans());
  };

  const handleDeleteRoadmap = (id: string) => {
    if (window.confirm('Are you sure you want to delete this roadmap?')) {
      deleteSavedRoadmap(id);
      loadData();
    }
  };

  const handleDeleteCourse = (id: string) => {
    deleteSavedCourse(id);
    loadData();
  };

  const handleDeleteScan = (id: string) => {
    deleteSavedResumeScan(id);
    loadData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-orange-600">Saved Items</h2>
        <div className="flex space-x-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('roadmaps')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'roadmaps' 
                ? 'bg-white text-orange-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Roadmaps ({savedRoadmaps.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'courses' 
                ? 'bg-white text-orange-600 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Courses ({savedCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'scans'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Resume Scans ({savedScans.length})
          </button>
        </div>
      </div>

      {/* Roadmaps View */}
      {activeTab === 'roadmaps' && (
        <div className="space-y-6">
          {savedRoadmaps.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">No saved roadmaps yet. Go generate one!</p>
            </div>
          ) : (
            savedRoadmaps.map((roadmap) => (
              <div key={roadmap.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">
                      Path to <span className="text-orange-600">{roadmap.role}</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Saved on {new Date(roadmap.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteRoadmap(roadmap.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium px-3 py-1 bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>

                <div className="relative border-l-2 border-orange-500 ml-2 space-y-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {roadmap.weekly_plan.map((week, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-orange-500"></div>
                      <h4 className="text-sm font-bold text-slate-800">Week {week.week}: {week.topic}</h4>
                      <div className="mt-2 text-xs space-y-2">
                        <div className="bg-slate-50 p-2 rounded">
                           <ul className="space-y-1">
                            {week.resources.map((r, i) => (
                                <li key={i}>
                                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline flex gap-1">
                                        <span>🔗</span> {r.title}
                                    </a>
                                </li>
                            ))}
                           </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Courses View */}
      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedCourses.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">No saved courses yet. Go find some!</p>
            </div>
          ) : (
            savedCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full">
                <div className="h-1 bg-orange-600"></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-100 text-[10px] px-2 py-1 rounded text-slate-600 uppercase tracking-wide font-bold">
                      {course.platform}
                    </span>
                    <button 
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-slate-400 hover:text-red-500"
                        title="Remove"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                  </div>
                  
                  <h3 className="text-md font-bold text-slate-900 mb-2">{course.title}</h3>
                  <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                       {course.duration}
                    </span>
                    <a 
                      href={course.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-orange-600 hover:text-orange-700 text-xs font-bold underline"
                    >
                      Open Link
                    </a>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'scans' && (
        <div className="space-y-4">
          {savedScans.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500">No resume scans yet. Analyze a resume to create history.</p>
            </div>
          ) : (
            savedScans.map((scan) => (
              <div key={scan.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900">{scan.fileName}</h4>
                    <p className="text-xs text-slate-500 mt-1">{new Date(scan.analyzedAt).toLocaleString()} · JD: {scan.jdProvided ? 'yes' : 'no'}</p>
                  </div>
                  <button onClick={() => handleDeleteScan(scan.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="border rounded p-2 border-slate-200">Skills: {scan.analysis.skills_identified.length}</div>
                  <div className="border rounded p-2 border-slate-200">Missing: {scan.analysis.missing_skills.length}</div>
                  <div className="border rounded p-2 border-slate-200">Match: {scan.analysis.jd_match_score ?? 0}%</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SavedItems;
