import React, { useMemo, useState } from 'react';
import { getCourseRecommendations } from '../../services/geminiService';
import { saveCourseToStorage } from '../../services/storageService';
import { Course, CourseResponse } from '@shared/types';

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
    try {
      const res = await getCourseRecommendations(topic, level, budget);
      setAiCourses(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (course: Course) => {
    saveCourseToStorage(course);
    setSavedCourses((prev) => new Set(prev).add(course.link));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-2xl font-bold text-orange-600">Courses, Tutorials & Articles</h2>
          <button onClick={onBack} className="text-sm text-slate-500 hover:text-slate-800">Back</button>
        </div>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 mt-4">
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Search topic (Java, OS, CN, DBMS...)" className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 outline-none" required />
          <select value={level} onChange={(e) => setLevel(e.target.value as any)} className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900">
            <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
          <select value={budget} onChange={(e) => setBudget(e.target.value as any)} className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900">
            <option>Any</option><option>Free Only</option><option>Paid</option>
          </select>
          <button type="submit" disabled={loading} className="bg-orange-600 px-6 py-3 rounded-lg text-white font-bold hover:bg-orange-700 disabled:opacity-50">
            {loading ? 'Searching...' : 'Find'}
          </button>
        </form>
        <div className="mt-3 flex gap-2">
          {(['All', 'Tutorial', 'Article'] as const).map((f) => (
            <button key={f} onClick={() => setFormat(f)} className={`px-3 py-1 text-xs rounded border ${format === f ? 'bg-orange-600 text-white border-orange-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-900">Catalog Results ({filteredCatalog.length})</h3>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCatalog.map((item) => (
            <a key={item.id} href={item.link} target="_blank" rel="noopener noreferrer" className="border border-slate-200 rounded-lg p-4 hover:shadow-md">
              <p className="text-xs uppercase tracking-wide text-slate-500">{item.format} · {item.pricing}</p>
              <h4 className="font-semibold text-slate-900 mt-1">{item.title}</h4>
              <p className="text-sm text-slate-600 mt-1">{item.topic} · {item.level}</p>
              <p className="text-xs text-slate-500 mt-1">Duration: {item.duration}</p>
            </a>
          ))}
        </div>
      </div>

      {aiCourses && (
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900">AI Recommended Courses ({aiCourses.courses.length})</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiCourses.courses.map((course, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4">
                <p className="text-xs text-slate-500">{course.platform} · {course.difficulty}</p>
                <h4 className="font-semibold text-slate-900 mt-1">{course.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{course.reason}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{course.duration}</span>
                  <button
                    onClick={() => handleSave(course)}
                    disabled={savedCourses.has(course.link)}
                    className="text-xs px-2 py-1 rounded border border-orange-300 text-orange-700 disabled:opacity-50"
                  >
                    {savedCourses.has(course.link) ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseRecommender;
