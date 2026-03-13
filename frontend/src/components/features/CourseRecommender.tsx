import React, { useMemo, useState } from 'react';
import { getCourseRecommendations } from '../../services/geminiService';
import { saveCourseToStorage } from '../../services/storageService';
import { Course, CourseResponse } from '@shared/types';
import AdvancedFilterDrawer from '../common/AdvancedFilterDrawer';
import StatePanel from '../common/StatePanel';

interface Props {
  onBack: () => void;
}

type LearningItem = {
  id: string;
  title: string;
  topic: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  format: 'Tutorial' | 'Article';
  pricing: 'Free' | 'Paid';
  duration: string;
  link: string;
};

const CATALOG: LearningItem[] = [
  { id: 'l1', title: 'Java Core to Advanced', topic: 'Java', level: 'Intermediate', format: 'Tutorial', pricing: 'Free', duration: '18h', link: 'https://www.geeksforgeeks.org/java/' },
  { id: 'l2', title: 'Python Interview Track', topic: 'Python', level: 'Beginner', format: 'Tutorial', pricing: 'Free', duration: '14h', link: 'https://docs.python.org/3/tutorial/' },
  { id: 'l3', title: 'C++ DSA Patterns', topic: 'C++', level: 'Advanced', format: 'Tutorial', pricing: 'Paid', duration: '22h', link: 'https://cp-algorithms.com/' },
  { id: 'l4', title: 'Computer Networks Revision', topic: 'Computer Networks', level: 'Intermediate', format: 'Article', pricing: 'Free', duration: '2h', link: 'https://www.tutorialspoint.com/data_communication_computer_network/index.htm' },
  { id: 'l5', title: 'Operating Systems Concepts', topic: 'OS', level: 'Intermediate', format: 'Article', pricing: 'Paid', duration: '3h', link: 'https://www.geeksforgeeks.org/operating-systems/' },
  { id: 'l6', title: 'Software Engineering Notes', topic: 'Software Engineering', level: 'Beginner', format: 'Article', pricing: 'Free', duration: '1.5h', link: 'https://www.tutorialspoint.com/software_engineering/index.htm' },
  { id: 'l7', title: 'JavaScript Full Guide', topic: 'JavaScript', level: 'Beginner', format: 'Tutorial', pricing: 'Free', duration: '20h', link: 'https://javascript.info/' },
  { id: 'l8', title: 'HTML/CSS Production Styling', topic: 'HTML/CSS', level: 'Beginner', format: 'Tutorial', pricing: 'Paid', duration: '16h', link: 'https://developer.mozilla.org/en-US/docs/Learn' },
  { id: 'l9', title: 'System Design Articles', topic: 'System Design', level: 'Advanced', format: 'Article', pricing: 'Paid', duration: '4h', link: 'https://github.com/donnemartin/system-design-primer' },
  { id: 'l10', title: 'DBMS Handbook', topic: 'DBMS', level: 'Intermediate', format: 'Article', pricing: 'Free', duration: '2h', link: 'https://www.geeksforgeeks.org/dbms/' },
  { id: 'l11', title: 'C Language Basics', topic: 'C', level: 'Beginner', format: 'Tutorial', pricing: 'Free', duration: '10h', link: 'https://www.learn-c.org/' },
  { id: 'l12', title: 'Compiler Design Essentials', topic: 'CD', level: 'Advanced', format: 'Article', pricing: 'Paid', duration: '3h', link: 'https://www.geeksforgeeks.org/compiler-design-tutorials/' },
];

const CourseRecommender: React.FC<Props> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [budget, setBudget] = useState<'Any' | 'Free Only' | 'Paid'>('Any');
  const [format, setFormat] = useState<'All' | 'Tutorial' | 'Article'>('All');
  const [loading, setLoading] = useState(false);
  const [aiCourses, setAiCourses] = useState<CourseResponse | null>(null);
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [error, setError] = useState('');

  const filteredCatalog = useMemo(() => {
    const q = topic.trim().toLowerCase();
    return CATALOG.filter((x) => {
      const qOk = !q || `${x.title} ${x.topic}`.toLowerCase().includes(q);
      const levelOk = x.level === level || level === 'Beginner';
      const budgetOk = budget === 'Any' || (budget === 'Free Only' ? x.pricing === 'Free' : x.pricing === 'Paid');
      const formatOk = format === 'All' || x.format === format;
      return qOk && levelOk && budgetOk && formatOk;
    });
  }, [topic, level, budget, format]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    setError('');
    try {
      const res = await getCourseRecommendations(topic, level, budget);
      setAiCourses(res);
    } catch (err) {
      console.error(err);
      setError('Course recommendations are temporarily unavailable. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (course: Course) => {
    saveCourseToStorage(course);
    setSavedCourses((prev) => new Set(prev).add(course.link));
  };

  return (
    <div className="space-y-6 premium-page">
      <div className="glass-panel p-8 rounded-xl shadow-sm border border-slate-700 premium-card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-blue-600">Courses, Tutorials & Articles</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setAdvancedOpen(true)} className="text-sm px-3 py-1.5 rounded border border-slate-600 text-slate-700 hover:bg-slate-800/70">Advanced Filters</button>
            <button onClick={onBack} className="text-sm text-slate-400 hover:text-slate-800">Back</button>
          </div>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mt-4">
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Search topic (Java, OS, CN, DBMS...)" className="flex-1 bg-slate-800/70 border border-slate-600 rounded-lg px-4 py-3 text-slate-100 outline-none" required />
          <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="bg-slate-800/70 border border-slate-600 rounded-lg px-4 py-3 text-slate-100">
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
          <select value={budget} onChange={(e) => setBudget(e.target.value as any)} className="bg-slate-800/70 border border-slate-600 rounded-lg px-4 py-3 text-slate-100">
            <option>Any</option><option>Free Only</option><option>Paid</option>
          </select>
          <button type="submit" disabled={loading} className="bg-blue-600 px-6 py-3 rounded-lg text-white font-bold hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Searching...' : 'Find'}
          </button>
        </form>
        <div className="mt-3 flex gap-2">
          {(['All', 'Tutorial', 'Article'] as const).map((f) => (
            <button key={f} onClick={() => setFormat(f)} className={`px-3 py-1 text-xs rounded border ${format === f ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-600 text-slate-300 hover:bg-slate-800/70'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl border border-slate-700 premium-card">
        <h3 className="text-lg font-bold text-slate-100">Catalog Results ({filteredCatalog.length})</h3>
        {filteredCatalog.length === 0 && (
          <div className="mt-4">
            <StatePanel mode="empty" title="No catalog matches" message="Try a broader topic or reset filters." />
          </div>
        )}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 premium-stagger">
          {filteredCatalog.map((item) => (
            <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="border border-slate-200 rounded-lg p-4 hover:shadow-md premium-card">
              <p className="text-xs uppercase tracking-wide text-slate-400">{item.format} · {item.pricing}</p>
              <h4 className="font-semibold text-slate-100 mt-1">{item.title}</h4>
              <p className="text-sm text-slate-300 mt-1">{item.topic} · {item.level}</p>
              <p className="text-xs text-slate-400 mt-1">Duration: {item.duration}</p>
            </a>
          ))}
        </div>
      </div>

      {aiCourses && (
        <div className="glass-panel p-6 rounded-xl border border-slate-700 premium-card">
          <h3 className="text-lg font-bold text-slate-100">AI Recommended Courses ({aiCourses.courses.length})</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 premium-stagger">
            {aiCourses.courses.map((course, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 premium-card">
                <p className="text-xs text-slate-400">{course.platform} · {course.difficulty}</p>
                <h4 className="font-semibold text-slate-100 mt-1">{course.title}</h4>
                <p className="text-sm text-slate-300 mt-1">{course.reason}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-400">{course.duration}</span>
                  <button
                    onClick={() => handleSave(course)}
                    disabled={savedCourses.has(course.link)}
                    className="text-xs px-2 py-1 rounded border border-blue-300 text-blue-700 disabled:opacity-50"
                  >
                    {savedCourses.has(course.link) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {loading && (
        <StatePanel mode="loading" title="Loading recommendations" message="Fetching best resources for your topic..." />
      )}
      {error && (
        <StatePanel mode="error" title="AI recommendations unavailable" message={error} actionLabel="Retry" onAction={() => {
          if (!loading && topic) {
            const fake = { preventDefault: () => {} } as React.FormEvent;
            handleSearch(fake);
          }
        }} />
      )}

      <AdvancedFilterDrawer
        open={advancedOpen}
        title="Course Filters"
        onClose={() => setAdvancedOpen(false)}
      >
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Level</label>
          <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input">
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Budget</label>
          <select value={budget} onChange={(e) => setBudget(e.target.value as any)} className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input">
            <option>Any</option><option>Free Only</option><option>Paid</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-xs text-slate-300">Format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="w-full bg-slate-900/70 border border-slate-600 rounded-lg px-3 py-2 text-slate-100 on-dark-input">
            <option>All</option><option>Tutorial</option><option>Article</option>
          </select>
        </div>
        <button
          onClick={() => { setLevel('Beginner'); setBudget('Any'); setFormat('All'); }}
          className="w-full text-xs px-3 py-2 rounded border border-slate-600 text-slate-200 hover:bg-slate-700/40"
        >
          Reset Filters
        </button>
      </AdvancedFilterDrawer>
    </div>
  );
};

export default CourseRecommender;



