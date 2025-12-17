import React, { useState } from 'react';
import { getCourseRecommendations } from '../services/geminiService';
import { saveCourseToStorage } from '../services/storageService';
import { CourseResponse, Course } from '../types';

interface Props {
  onBack: () => void;
}

const CourseRecommender: React.FC<Props> = ({ onBack }) => {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [budget, setBudget] = useState('Any');
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CourseResponse | null>(null);
  const [savedCourses, setSavedCourses] = useState<Set<string>>(new Set());

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;
    setLoading(true);
    setSavedCourses(new Set()); // Reset saved state for new search
    try {
      const res = await getCourseRecommendations(topic, level, budget);
      setCourses(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (course: Course) => {
    saveCourseToStorage(course);
    setSavedCourses(prev => new Set(prev).add(course.link));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-[#2f8d46] mb-6">Course Finder</h2>
        <p className="text-sm text-slate-500 mb-4">
          Find the best tutorials from GeeksforGeeks, W3Schools, LeetCode, and JavaTPoint.
        </p>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Topic (e.g., Data Structures, React, Python)"
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none"
            required
          />
          <select 
            value={level} 
            onChange={(e) => setLevel(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
           <select 
            value={budget} 
            onChange={(e) => setBudget(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-slate-900 focus:ring-2 focus:ring-[#2f8d46] focus:border-transparent outline-none"
          >
            <option>Any</option>
            <option>Free Only</option>
            <option>Paid</option>
          </select>
          <button
            type="submit"
            disabled={loading}
            className="bg-[#2f8d46] px-6 py-3 rounded-lg text-white font-bold hover:bg-[#1e6b30] transition-colors disabled:opacity-50 shadow-md"
          >
            {loading ? 'Searching...' : 'Find Resources'}
          </button>
        </form>
      </div>

      {courses && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.courses.map((course, idx) => (
            <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full group">
              <div className="h-2 bg-[#2f8d46]"></div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-slate-100 text-xs px-2 py-1 rounded text-slate-600 uppercase tracking-wide font-bold border border-slate-200">
                    {course.platform}
                  </span>
                  <div className="flex gap-2">
                    <span className={`text-xs px-2 py-1 rounded font-bold ${
                        course.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                        course.difficulty === 'Advanced' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                    }`}>
                        {course.difficulty}
                    </span>
                    <button 
                        onClick={() => handleSave(course)}
                        disabled={savedCourses.has(course.link)}
                        title="Save Course"
                        className="text-slate-400 hover:text-indigo-600 transition-colors disabled:text-indigo-600"
                    >
                        {savedCourses.has(course.link) ? (
                             <svg className="w-5 h-5 fill-indigo-600" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" /></svg>
                        ) : (
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
                        )}
                    </button>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-slate-900 mb-2">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-4 line-clamp-3">{course.reason}</p>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-1 font-medium">
                     🕒 {course.duration}
                  </span>
                  {course.link && course.link !== '#' && (
                    <a 
                      href={course.link} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-[#2f8d46] hover:text-[#1e6b30] text-sm font-bold flex items-center gap-1 underline decoration-2 underline-offset-2"
                    >
                      Start Learning
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseRecommender;
