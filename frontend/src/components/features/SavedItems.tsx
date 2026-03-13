import React, { useMemo, useState, useEffect } from 'react';
import {
  getSavedRoadmaps,
  getSavedCourses,
  deleteSavedRoadmap,
  deleteSavedCourse,
  getSavedResumeScans,
  deleteSavedResumeScan,
  deleteSavedJob,
  getSavedJobs,
  updateSavedJobStage,
  type JobApplicationStage,
  type SavedJob,
} from '../../services/storageService';
import { SavedRoadmap, SavedCourse, SavedResumeScan } from '@shared/types';
import AdvancedFilterDrawer from '../common/AdvancedFilterDrawer';

interface Props {
  onBack: () => void;
}

const STAGE_OPTIONS: Array<{ value: JobApplicationStage; label: string }> = [
  { value: 'saved', label: 'Saved' },
  { value: 'applied', label: 'Applied' },
  { value: 'aptitude_round', label: 'Aptitude' },
  { value: 'technical_round', label: 'Technical' },
  { value: 'interview_round', label: 'Interview' },
  { value: 'offer_letter', label: 'Offer' },
];

const SavedItems: React.FC<Props> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'roadmaps' | 'courses' | 'scans' | 'jobs'>('roadmaps');
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmap[]>([]);
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [savedScans, setSavedScans] = useState<SavedResumeScan[]>([]);
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [jobStageFilter, setJobStageFilter] = useState<'all' | JobApplicationStage>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setSavedRoadmaps(getSavedRoadmaps());
    setSavedCourses(getSavedCourses());
    setSavedScans(getSavedResumeScans());
    setSavedJobs(getSavedJobs());
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

  const handleDeleteJob = (id: string) => {
    deleteSavedJob(id);
    loadData();
  };

  const handleJobStageChange = (id: string, stage: JobApplicationStage) => {
    updateSavedJobStage(id, stage);
    loadData();
  };

  const q = search.trim().toLowerCase();
  const visibleRoadmaps = useMemo(
    () => savedRoadmaps.filter((x) => !q || `${x.role}`.toLowerCase().includes(q)),
    [savedRoadmaps, q]
  );
  const visibleCourses = useMemo(
    () => savedCourses.filter((x) => !q || `${x.title} ${x.platform}`.toLowerCase().includes(q)),
    [savedCourses, q]
  );
  const visibleScans = useMemo(
    () => savedScans.filter((x) => !q || `${x.fileName}`.toLowerCase().includes(q)),
    [savedScans, q]
  );
  const visibleJobs = useMemo(
    () => savedJobs.filter((x) => {
      const textOk = !q || `${x.title} ${x.company} ${x.location} ${x.country}`.toLowerCase().includes(q);
      const stageOk = jobStageFilter === 'all' || x.stage === jobStageFilter;
      return textOk && stageOk;
    }),
    [savedJobs, q, jobStageFilter]
  );
  const jobStageSummary = useMemo(() => {
    const summary: Record<JobApplicationStage, number> = {
      saved: 0,
      applied: 0,
      aptitude_round: 0,
      technical_round: 0,
      interview_round: 0,
      offer_letter: 0,
    };
    visibleJobs.forEach((j) => {
      summary[j.stage] = (summary[j.stage] || 0) + 1;
    });
    return summary;
  }, [visibleJobs]);

  return (
    <div className="space-y-6 premium-page feature-saved">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 glass-panel p-6 rounded-xl shadow-sm border border-slate-700 premium-card">
        <h2 className="text-2xl font-bold text-cyan-300">Saved Items</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setAdvancedOpen(true)} className="text-sm px-3 py-1.5 rounded border border-slate-600 text-slate-300 hover:bg-slate-700/40">Advanced Filters</button>
          <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-100">Back</button>
        </div>
        <div className="flex space-x-2 bg-slate-800/70 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('roadmaps')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'roadmaps'
                ? 'bg-blue-600/30 text-blue-100 border border-blue-400/40'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Roadmaps ({savedRoadmaps.length})
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'courses'
                ? 'bg-blue-600/30 text-blue-100 border border-blue-400/40'
              : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Courses ({savedCourses.length})
          </button>
          <button
            onClick={() => setActiveTab('scans')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'scans'
                ? 'bg-blue-600/30 text-blue-100 border border-blue-400/40'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Resume Scans ({savedScans.length})
          </button>
          <button
            onClick={() => setActiveTab('jobs')}
            className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${
              activeTab === 'jobs'
                ? 'bg-blue-600/30 text-blue-100 border border-blue-400/40'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Jobs ({savedJobs.length})
          </button>
        </div>
      </div>

      {activeTab === 'roadmaps' && (
        <div className="space-y-6 premium-stagger">
          {visibleRoadmaps.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-600">
              <p className="text-slate-400">No saved roadmaps yet. Go generate one!</p>
            </div>
          ) : (
            visibleRoadmaps.map((roadmap) => (
              <div key={roadmap.id} className="glass-panel p-6 rounded-xl shadow-sm border border-slate-700 premium-card">
                <div className="flex justify-between items-start mb-6 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-100">
                      Path to <span className="text-blue-600">{roadmap.role}</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Saved on {new Date(roadmap.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteRoadmap(roadmap.id)}
                    className="text-red-300 hover:text-red-200 text-sm font-medium px-3 py-1 bg-red-500/10 rounded border border-red-400/30"
                  >
                    Delete
                  </button>
                </div>

                <div className="relative border-l-2 border-blue-500 ml-2 space-y-6 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                  {roadmap.weekly_plan.map((week, idx) => (
                    <div key={idx} className="relative pl-6">
                      <div className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-slate-900 border-2 border-blue-500"></div>
                      <h4 className="text-sm font-bold text-slate-100">Week {week.week}: {week.topic}</h4>
                      <div className="mt-2 text-xs space-y-2">
                        <div className="bg-slate-900/60 p-2 rounded border border-slate-700">
                           <ul className="space-y-1">
                            {week.resources.map((r, i) => (
                                <li key={i}>
                                    <a href={r.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex gap-1">
                                        <span>Link</span> {r.title}
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

      {activeTab === 'courses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 premium-stagger">
          {visibleCourses.length === 0 ? (
            <div className="col-span-full text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-600">
              <p className="text-slate-400">No saved courses yet. Go find some!</p>
            </div>
          ) : (
            visibleCourses.map((course) => (
              <div key={course.id} className="glass-panel rounded-xl border border-slate-700 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full premium-card">
                <div className="h-1 bg-blue-600"></div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-3">
                    <span className="bg-slate-800/70 text-[10px] px-2 py-1 rounded text-slate-300 uppercase tracking-wide font-bold">
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

                  <h3 className="text-md font-bold text-slate-100 mb-2">{course.title}</h3>
                  <div className="mt-auto pt-3 border-t border-slate-700 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                       {course.duration}
                    </span>
                    <a
                      href={course.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-xs font-bold underline"
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
        <div className="space-y-4 premium-stagger">
          {visibleScans.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-600">
              <p className="text-slate-400">No resume scans yet. Analyze a resume to create history.</p>
            </div>
          ) : (
            visibleScans.map((scan) => (
              <div key={scan.id} className="glass-panel p-5 rounded-xl shadow-sm border border-slate-700 premium-card">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-100">{scan.fileName}</h4>
                    <p className="text-xs text-slate-400 mt-1">{new Date(scan.analyzedAt).toLocaleString()} · JD: {scan.jdProvided ? 'yes' : 'no'}</p>
                  </div>
                  <button onClick={() => handleDeleteScan(scan.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">Delete</button>
                </div>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="border rounded p-2 border-slate-700 bg-slate-900/40">Skills: {scan.analysis.skills_identified.length}</div>
                  <div className="border rounded p-2 border-slate-700 bg-slate-900/40">Missing: {scan.analysis.missing_skills.length}</div>
                  <div className="border rounded p-2 border-slate-700 bg-slate-900/40">Match: {scan.analysis.jd_match_score ?? 0}%</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'jobs' && (
        <div className="space-y-4 premium-stagger">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {STAGE_OPTIONS.map((s) => (
              <div key={s.value} className="rounded-lg border border-slate-700 bg-slate-900/50 p-2 premium-card">
                <p className="text-[11px] text-slate-400">{s.label}</p>
                <p className="text-lg font-bold text-slate-100">{jobStageSummary[s.value] || 0}</p>
              </div>
            ))}
          </div>
          {visibleJobs.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-600">
              <p className="text-slate-400">No saved jobs yet. Save jobs from the Job Search section.</p>
            </div>
          ) : (
            visibleJobs.map((job) => (
              <div key={job.id} className="glass-panel p-5 rounded-xl shadow-sm border border-slate-700 premium-card">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div>
                    <p className="text-xs text-slate-400">{job.company}</p>
                    <h4 className="font-semibold text-slate-100">{job.title}</h4>
                    <p className="text-sm text-slate-300 mt-1">{job.location} • {job.country} • {job.source}</p>
                    <p className="text-xs text-slate-400 mt-1">Saved {new Date(job.savedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={job.stage}
                      onChange={(e) => handleJobStageChange(job.id, e.target.value as JobApplicationStage)}
                      className="text-sm border border-slate-600 rounded px-2 py-1"
                    >
                      {STAGE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                    <a href={job.link} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      Open
                    </a>
                    <button onClick={() => handleDeleteJob(job.id)} className="text-xs px-2 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <AdvancedFilterDrawer
        open={advancedOpen}
        title="Saved Filters"
        onClose={() => setAdvancedOpen(false)}
      >
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Search</label>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, company, file name"
            className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input"
          />
        </div>
        {activeTab === 'jobs' && (
          <div className="space-y-2">
            <label className="block text-xs text-slate-300">Job Stage</label>
            <select
              value={jobStageFilter}
              onChange={(e) => setJobStageFilter(e.target.value as any)}
              className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input"
            >
              <option value="all">All</option>
              <option value="saved">Saved</option>
              <option value="applied">Applied</option>
              <option value="aptitude_round">Aptitude Round</option>
              <option value="technical_round">Technical Round</option>
              <option value="interview_round">Interview Round</option>
              <option value="offer_letter">Offer Letter</option>
            </select>
          </div>
        )}
        <button
          onClick={() => { setSearch(''); setJobStageFilter('all'); }}
          className="w-full text-xs px-3 py-2 rounded border border-slate-600 text-slate-200 hover:bg-slate-700/40"
        >
          Reset Filters
        </button>
      </AdvancedFilterDrawer>
    </div>
  );
};

export default SavedItems;




